import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthPayload } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    const clubId = payload?.clubId;
    if (!clubId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const colectaId = searchParams.get("colectaId");
    const miembroId = searchParams.get("miembroId");

    const where: any = {};
    where.clubId = clubId;
    if (colectaId) where.colectaId = colectaId;
    if (miembroId) where.miembroId = miembroId;

    const aportes = await prisma.aporte.findMany({
      where,
      include: {
        miembro: true,
        colecta: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(aportes);
  } catch (error) {
    console.error("Error obteniendo aportes:", error);
    return NextResponse.json({ error: "Error al obtener aportes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    const clubId = payload?.clubId;
    if (!clubId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const {
      colectaId,
      miembroId,
      cantidad,
      estado = "aportado",
      metodoPago,
      notas,
    } = await req.json();

    if (!miembroId || !cantidad) {
      return NextResponse.json(
        { error: "MiembroId y cantidad requeridos" },
        { status: 400 },
      );
    }

    // Verificar que la colecta existe (si se proporciona)
    if (colectaId) {
      const colecta = await prisma.colecta.findFirst({
        where: { id: colectaId, clubId },
      });

      if (!colecta) {
        return NextResponse.json({ error: "Colecta no encontrada" }, { status: 404 });
      }
    }

    // Verificar que el miembro existe
    const miembro = await prisma.miembro.findUnique({
      where: { id: miembroId },
    });

    if (!miembro) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }
    if (miembro.clubId !== clubId) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const aporte = await prisma.aporte.create({
      data: {
        colectaId: colectaId || null,
        miembroId,
        miembroNombre: miembro.nombre, // Guardar nombre para historial
        cantidad: parseFloat(cantidad),
        estado,
        metodoPago,
        notas,
        clubId,
      },
      include: {
        miembro: true,
        colecta: true,
      },
    });

    return NextResponse.json({
      success: true,
      aporte,
    });
  } catch (error) {
    console.error("Error creando aporte:", error);
    return NextResponse.json({ error: "Error al crear aporte" }, { status: 500 });
  }
}
