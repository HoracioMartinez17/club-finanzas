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
    const fuente = searchParams.get("fuente");

    const ingresos = await prisma.ingreso.findMany({
      where: {
        clubId,
        ...(fuente && { fuente }),
      },
      include: {
        miembro: true,
      },
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(ingresos);
  } catch (error) {
    console.error("Error obteniendo ingresos:", error);
    return NextResponse.json({ error: "Error al obtener ingresos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    const clubIdFromToken = payload?.clubId;
    if (!clubIdFromToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { concepto, cantidad, fuente, miembroId, fecha } = await req.json();

    if (!concepto || !cantidad || !fuente) {
      return NextResponse.json(
        { error: "Concepto, cantidad y fuente son requeridos" },
        { status: 400 },
      );
    }

    // Si se especifica un miembro, verificar que existe
    let clubId: string = clubIdFromToken;
    if (miembroId) {
      const miembro = await prisma.miembro.findUnique({
        where: { id: miembroId },
      });

      if (!miembro) {
        return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
      }
      if (miembro.clubId !== clubIdFromToken) {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
      }
      clubId = miembro.clubId;
    }

    const ingreso = await prisma.ingreso.create({
      data: {
        concepto,
        cantidad: parseFloat(cantidad),
        fuente,
        miembroId: miembroId || null,
        fecha: fecha ? new Date(fecha) : new Date(),
        clubId,
      },
      include: {
        miembro: true,
      },
    });

    return NextResponse.json({
      success: true,
      ingreso,
    });
  } catch (error) {
    console.error("Error creando ingreso:", error);
    return NextResponse.json({ error: "Error al crear ingreso" }, { status: 500 });
  }
}
