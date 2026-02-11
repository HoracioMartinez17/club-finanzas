import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const deuda = await prisma.deuda.findUnique({
      where: { id },
      include: {
        miembro: true,
        pagos: true,
      },
    });

    if (!deuda) {
      return NextResponse.json({ error: "Deuda no encontrada" }, { status: 404 });
    }

    return NextResponse.json(deuda);
  } catch (error) {
    console.error("Error obteniendo deuda:", error);
    return NextResponse.json({ error: "Error al obtener la deuda" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { concepto, montoOriginal, notas } = await req.json();

    // Verificar que la deuda existe
    const deudaExistente = await prisma.deuda.findUnique({
      where: { id },
    });

    if (!deudaExistente) {
      return NextResponse.json({ error: "Deuda no encontrada" }, { status: 404 });
    }

    // Validaciones
    if (montoOriginal && montoOriginal <= 0) {
      return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 });
    }

    // Si se actualiza el montoOriginal, recalcular montoRestante
    const nuevoMontoOriginal = montoOriginal || deudaExistente.montoOriginal;
    const montoPagado = deudaExistente.montoPagado;
    const nuevoMontoRestante = nuevoMontoOriginal - montoPagado;

    // Determinar nuevo estado
    let nuevoEstado = deudaExistente.estado;
    if (nuevoMontoRestante === 0) {
      nuevoEstado = "pagada";
    } else if (montoPagado > 0) {
      nuevoEstado = "parcial_pagada";
    } else {
      nuevoEstado = "pendiente";
    }

    const deudaActualizada = await prisma.deuda.update({
      where: { id },
      data: {
        concepto: concepto || deudaExistente.concepto,
        montoOriginal: nuevoMontoOriginal,
        montoRestante: nuevoMontoRestante,
        estado: nuevoEstado,
        notas: notas !== undefined ? notas : deudaExistente.notas,
      },
      include: {
        miembro: true,
        pagos: true,
      },
    });

    return NextResponse.json(deudaActualizada);
  } catch (error) {
    console.error("Error actualizando deuda:", error);
    return NextResponse.json({ error: "Error al actualizar la deuda" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    // Verificar que la deuda existe
    const deuda = await prisma.deuda.findUnique({
      where: { id },
    });

    if (!deuda) {
      return NextResponse.json({ error: "Deuda no encontrada" }, { status: 404 });
    }

    // Eliminar la deuda (eliminará automáticamente los pagos por CASCADE)
    await prisma.deuda.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Deuda eliminada correctamente" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error eliminando deuda:", error);
    return NextResponse.json({ error: "Error al eliminar la deuda" }, { status: 500 });
  }
}
