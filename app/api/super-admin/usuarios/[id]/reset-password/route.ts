import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import {
  createAuditLog,
  getIpFromRequest,
  getUserAgentFromRequest,
} from "@/lib/security";

// POST /api/super-admin/usuarios/[id]/reset-password - Resetear contraseña
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verificar autenticación y rol de super admin
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = verifyAuth(token);
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const superAdmin = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isSuperAdmin: true, nombre: true },
    });

    if (!superAdmin?.isSuperAdmin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener datos del body
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      );
    }

    // Verificar que el usuario existe
    const usuario = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        email: true,
        clubId: true,
        isSuperAdmin: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // No permitir resetear contraseña de otro super admin
    if (usuario.isSuperAdmin) {
      return NextResponse.json(
        { error: "No se puede resetear la contraseña de un super admin" },
        { status: 403 },
      );
    }

    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Registrar en audit log
    if (usuario.clubId) {
      await createAuditLog({
        clubId: usuario.clubId,
        userId: payload.userId,
        action: "PASSWORD_CHANGE",
        entityType: "User",
        entityId: id,
        details: JSON.stringify({
          targetUser: usuario.nombre,
          targetEmail: usuario.email,
          resetBy: "Super Admin",
          resetByName: superAdmin.nombre,
        }),
        ipAddress: getIpFromRequest(request),
        userAgent: getUserAgentFromRequest(request),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Contraseña reseteada correctamente",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
      },
    });
  } catch (error) {
    console.error("Error al resetear contraseña:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
