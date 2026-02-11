import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  canDeleteUser,
  canChangeRole,
  canDeactivateUser,
  createAuditLog,
  getIpFromRequest,
  getUserAgentFromRequest,
} from "@/lib/security";
import prisma from "@/lib/db";
import { getAuthPayload } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = getAuthPayload(request);
    const clubId = payload?.clubId;
    if (!clubId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const usuario = await prisma.user.findFirst({
      where: { id, clubId },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = getAuthPayload(request);
    const clubIdFromToken = payload?.clubId;
    if (!clubIdFromToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { nombre, email, rol, activo, password, currentUserId, currentUserName } = body;

    console.log("Datos recibidos:", {
      id,
      nombre,
      email,
      rol,
      activo,
      tienePassword: !!password,
    });

    // Obtener usuario actual para verificar cambios
    const usuarioActual = await prisma.user.findFirst({
      where: { id, clubId: clubIdFromToken },
      select: {
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        clubId: true,
        isSuperAdmin: true,
      },
    });

    if (!usuarioActual) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Proteger super administradores
    if (usuarioActual.isSuperAdmin) {
      return NextResponse.json(
        { error: "No se puede modificar un super administrador" },
        { status: 403 },
      );
    }

    const clubId = usuarioActual.clubId;

    // Validar cambio de rol
    if (rol !== undefined && rol !== usuarioActual.rol) {
      const validation = await canChangeRole(id, clubId || "", rol);
      if (!validation.allowed) {
        return NextResponse.json({ error: validation.reason }, { status: 403 });
      }
    }

    // Validar desactivación
    if (activo === false && usuarioActual.activo) {
      const validation = await canDeactivateUser(id, clubId || "");
      if (!validation.allowed) {
        return NextResponse.json({ error: validation.reason }, { status: 403 });
      }
    }

    const updateData: any = {};

    // Solo agregar campos que realmente vienen en el request
    if (nombre !== undefined) updateData.nombre = nombre;
    if (email !== undefined) updateData.email = email;
    if (rol !== undefined) updateData.rol = rol;
    if (typeof activo === "boolean") updateData.activo = activo;

    // Si se proporciona una nueva contraseña, actualizarla
    if (password && typeof password === "string" && password.trim()) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      updateData.password = hashedPassword;

      // Log de cambio de contraseña
      await createAuditLog({
        clubId: clubId || "",
        userId: currentUserId,
        userName: currentUserName,
        action: "PASSWORD_CHANGE",
        entityType: "User",
        entityId: id,
        details: { targetUser: usuarioActual.nombre },
        ipAddress: getIpFromRequest(request),
        userAgent: getUserAgentFromRequest(request),
      });
    }

    console.log("Actualizando con:", updateData);

    const usuario = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    });

    // Log de cambios importantes
    const changes: string[] = [];
    if (nombre !== undefined && nombre !== usuarioActual.nombre) {
      changes.push(`nombre: ${usuarioActual.nombre} → ${nombre}`);
    }
    if (email !== undefined && email !== usuarioActual.email) {
      changes.push(`email: ${usuarioActual.email} → ${email}`);
    }
    if (rol !== undefined && rol !== usuarioActual.rol) {
      changes.push(`rol: ${usuarioActual.rol} → ${rol}`);
    }
    if (activo !== undefined && activo !== usuarioActual.activo) {
      changes.push(`activo: ${usuarioActual.activo} → ${activo}`);
    }

    if (changes.length > 0) {
      await createAuditLog({
        clubId: clubId || "",
        userId: currentUserId,
        userName: currentUserName,
        action: "USER_UPDATE",
        entityType: "User",
        entityId: id,
        details: { changes, targetUser: usuarioActual.nombre },
        ipAddress: getIpFromRequest(request),
        userAgent: getUserAgentFromRequest(request),
      });
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Error al actualizar:", error);
    return NextResponse.json(
      {
        error: "Error al actualizar usuario",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = getAuthPayload(request);
    const clubIdFromToken = payload?.clubId;
    if (!clubIdFromToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Obtener datos del cuerpo de la petición (userId y userName del que hace la acción)
    const body = await request.json().catch(() => ({}));
    const { currentUserId, currentUserName } = body;

    // Obtener información del usuario a eliminar
    const usuario = await prisma.user.findFirst({
      where: { id, clubId: clubIdFromToken },
      select: {
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        clubId: true,
        isSuperAdmin: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Proteger super administradores
    if (usuario.isSuperAdmin) {
      return NextResponse.json(
        { error: "No se puede eliminar un super administrador" },
        { status: 403 },
      );
    }

    const clubId = usuario.clubId;

    // Validar que se pueda eliminar
    const validation = await canDeleteUser(id, clubId || "");
    if (!validation.allowed) {
      return NextResponse.json({ error: validation.reason }, { status: 403 });
    }

    // Eliminar usuario
    await prisma.user.delete({
      where: { id },
    });

    // Log de eliminación
    await createAuditLog({
      clubId: clubId || "",
      userId: currentUserId,
      userName: currentUserName,
      action: "USER_DELETE",
      entityType: "User",
      entityId: id,
      details: {
        deletedUser: {
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
      },
      ipAddress: getIpFromRequest(request),
      userAgent: getUserAgentFromRequest(request),
    });

    return NextResponse.json(
      { message: "Usuario eliminado correctamente" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}
