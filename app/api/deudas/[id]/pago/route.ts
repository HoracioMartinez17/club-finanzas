import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthPayload } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const payload = getAuthPayload(req);
    const clubId = payload?.clubId;
    if (!clubId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const { cantidad, notas } = await req.json();

    // Validaciones
    if (!cantidad || cantidad <= 0) {
      return NextResponse.json(
        { error: "El monto del pago debe ser mayor a 0" },
        { status: 400 },
      );
    }

    // Obtener la deuda
    const deuda = await prisma.deuda.findFirst({
      where: { id, clubId },
      include: {
        pagos: true,
      },
    });

    if (!deuda) {
      return NextResponse.json({ error: "Deuda no encontrada" }, { status: 404 });
    }

    // Validar que el pago no exceda el monto restante
    if (cantidad > deuda.montoRestante) {
      return NextResponse.json(
        {
          error: `El pago no puede exceder el monto restante (${deuda.montoRestante})`,
        },
        { status: 400 },
      );
    }

    // Crear el registro de pago
    const pago = await prisma.pagoDeuda.create({
      data: {
        deudaId: id,
        cantidad,
        notas: notas || null,
        clubId: deuda.clubId,
      },
    });

    // Actualizar la deuda
    const nuevoMontoPagado = deuda.montoPagado + cantidad;
    const nuevoMontoRestante = deuda.montoOriginal - nuevoMontoPagado;

    // Determinar nuevo estado
    let nuevoEstado = "parcial_pagada";
    if (nuevoMontoRestante === 0) {
      nuevoEstado = "pagada";
    } else if (nuevoMontoPagado === 0) {
      nuevoEstado = "pendiente";
    }

    const deudaActualizada = await prisma.deuda.update({
      where: { id },
      data: {
        montoPagado: nuevoMontoPagado,
        montoRestante: nuevoMontoRestante,
        estado: nuevoEstado,
      },
      include: {
        miembro: true,
        pagos: true,
      },
    });

    return NextResponse.json(
      {
        pago,
        deuda: deudaActualizada,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error registrando pago:", error);
    return NextResponse.json({ error: "Error al registrar el pago" }, { status: 500 });
  }
}
