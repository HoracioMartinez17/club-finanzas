import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const colectaId = searchParams.get("colectaId");
    const tipo = searchParams.get("tipo");

    const gastos = await prisma.gasto.findMany({
      where: {
        ...(colectaId && { colectaId }),
        ...(tipo && { tipoGasto: tipo }),
      },
      include: {
        quienPago: true,
        colecta: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(gastos);
  } catch (error) {
    console.error("Error obteniendo gastos:", error);
    return NextResponse.json({ error: "Error al obtener gastos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      concepto,
      cantidad,
      categoria,
      quienPagoId,
      colectaId,
      tipoGasto = "general",
      comprobante,
      notas,
    } = await req.json();

    if (!concepto || !cantidad || !categoria || !quienPagoId) {
      return NextResponse.json(
        { error: "Concepto, cantidad, categoría y quienPagoId requeridos" },
        { status: 400 },
      );
    }

    // Verificar que el miembro existe
    const miembro = await prisma.miembro.findUnique({
      where: { id: quienPagoId },
    });

    if (!miembro) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }

    const gasto = await prisma.gasto.create({
      data: {
        concepto,
        cantidad: parseFloat(cantidad),
        categoria,
        quienPagoId,
        quienPagoNombre: miembro.nombre,
        colectaId: colectaId || null,
        tipoGasto,
        comprobante,
        notas,
      },
      include: {
        quienPago: true,
        colecta: true,
      },
    });

    return NextResponse.json({
      success: true,
      gasto,
    });
  } catch (error) {
    console.error("Error creando gasto:", error);
    return NextResponse.json({ error: "Error al crear gasto" }, { status: 500 });
  }
}
