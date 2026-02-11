import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

// GET /api/super-admin/clubes/[id] - Obtener detalles de un club
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

    // Obtener el club con estadísticas detalladas
    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            usuarios: true,
            miembros: true,
            colectas: true,
            aportes: true,
            gastos: true,
            ingresos: true,
            deudas: true,
          },
        },
        config: true,
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
    }

    return NextResponse.json(club);
  } catch (error) {
    console.error("Error al obtener club:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PUT /api/super-admin/clubes/[id] - Actualizar club
export async function PUT(
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
    const existingClub = await prisma.club.findUnique({
      where: { id },
    });

    if (!existingClub) {
      return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
    }

    // Obtener datos del body
    const body = await request.json();
    const { nombre, slug, planId, activo, logoUrl } = body;

    // Si se está actualizando el slug, verificar que no exista
    if (slug && slug !== existingClub.slug) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        return NextResponse.json(
          { error: "El slug solo puede contener letras minúsculas, números y guiones" },
          { status: 400 },
        );
      }

      const clubConSlug = await prisma.club.findUnique({
        where: { slug },
      });

      if (clubConSlug) {
        return NextResponse.json(
          { error: "Ya existe un club con ese slug" },
          { status: 400 },
        );
      }
    }

    // Actualizar el club
    const clubActualizado = await prisma.club.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(slug && { slug }),
        ...(planId && { planId }),
        ...(activo !== undefined && { activo }),
        ...(logoUrl !== undefined && { logoUrl }),
      },
    });

    return NextResponse.json(clubActualizado);
  } catch (error) {
    console.error("Error al actualizar club:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/super-admin/clubes/[id] - Eliminar club
export async function DELETE(
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
    });
    if (!club) {
      return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
    }

    // Eliminar el club (cascade eliminará todos los registros relacionados)
    await prisma.club.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Club eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar club:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
