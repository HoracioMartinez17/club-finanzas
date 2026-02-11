import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

// GET /api/super-admin/clubes/[id]/usuarios - Obtener usuarios de un club
export async function GET(
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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isSuperAdmin: true },
    });

    if (!user?.isSuperAdmin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Verificar que el club existe
    const club = await prisma.club.findUnique({
      where: { id },
      select: { id: true, nombre: true },
    });

    if (!club) {
      return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
    }

    // Obtener usuarios del club
    const usuarios = await prisma.user.findMany({
      where: { clubId: id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ rol: "desc" }, { nombre: "asc" }],
    });

    return NextResponse.json({
      club,
      usuarios,
      total: usuarios.length,
      admins: usuarios.filter((u) => u.rol === "admin").length,
    });
  } catch (error) {
    console.error("Error al obtener usuarios del club:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
