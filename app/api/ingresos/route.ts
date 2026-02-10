import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fuente = searchParams.get("fuente");

    const ingresos = await prisma.ingreso.findMany({
      where: {
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
    const { concepto, cantidad, fuente, miembroId, fecha } = await req.json();

    if (!concepto || !cantidad || !fuente) {
      return NextResponse.json(
        { error: "Concepto, cantidad y fuente son requeridos" },
        { status: 400 },
      );
    }

    // Si se especifica un miembro, verificar que existe
    if (miembroId) {
      const miembro = await prisma.miembro.findUnique({
        where: { id: miembroId },
      });

      if (!miembro) {
        return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
      }
    }

    const ingreso = await prisma.ingreso.create({
      data: {
        concepto,
        cantidad: parseFloat(cantidad),
        fuente,
        miembroId: miembroId || null,
        fecha: fecha ? new Date(fecha) : new Date(),
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
