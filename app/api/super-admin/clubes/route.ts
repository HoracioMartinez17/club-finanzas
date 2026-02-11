import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

// GET /api/super-admin/clubes - Listar todos los clubes
export async function GET(request: Request) {
  try {
    // Verificar autenticación y rol de super admin
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = verifyAuth(token);
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Verificar que el usuario sea super admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isSuperAdmin: true },
    });

    if (!user?.isSuperAdmin) {
      return NextResponse.json(
        { error: "Acceso denegado. Se requiere rol de Super Admin." },
        { status: 403 },
      );
    }

    // Obtener todos los clubes con estadísticas
    const clubes = await prisma.club.findMany({
      select: {
        id: true,
        nombre: true,
        slug: true,
        activo: true,
        planId: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            usuarios: true,
            miembros: true,
            colectas: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clubes);
  } catch (error) {
    console.error("Error al obtener clubes:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/super-admin/clubes - Crear nuevo club
export async function POST(request: Request) {
  try {
    // Verificar autenticación y rol de super admin
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = verifyAuth(token);
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Verificar que el usuario sea super admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isSuperAdmin: true },
    });

    if (!user?.isSuperAdmin) {
      return NextResponse.json(
        { error: "Acceso denegado. Se requiere rol de Super Admin." },
        { status: 403 },
      );
    }

    // Obtener datos del body
    const body = await request.json();
    const { nombre, slug, planId = "free", logoUrl } = body;

    // Validaciones
    if (!nombre || !slug) {
      return NextResponse.json(
        { error: "Nombre y slug son requeridos" },
        { status: 400 },
      );
    }

    // Validar formato del slug (solo letras minúsculas, números y guiones)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: "El slug solo puede contener letras minúsculas, números y guiones" },
        { status: 400 },
      );
    }

    // Verificar que el slug no exista
    const existingClub = await prisma.club.findUnique({
      where: { slug },
    });

    if (existingClub) {
      return NextResponse.json(
        { error: "Ya existe un club con ese slug" },
        { status: 400 },
      );
    }

    // Crear el club
    const nuevoClub = await prisma.club.create({
      data: {
        nombre,
        slug,
        planId,
        logoUrl,
        activo: true,
        createdBy: payload.userId,
      },
    });

    // Crear configuración por defecto para el club
    await prisma.config.create({
      data: {
        clubId: nuevoClub.id,
        transparenciaPublica: true,
        nombreClub: nombre,
        descripcionClub: "",
      },
    });

    return NextResponse.json(nuevoClub, { status: 201 });
  } catch (error) {
    console.error("Error al crear club:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
