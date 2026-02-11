import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const deudas = await prisma.deuda.findMany({
      include: {
        miembro: true,
        pagos: true,
      },
      orderBy: {
        fecha: "desc",
      },
    });

    return NextResponse.json(deudas);
  } catch (error) {
    console.error("Error obteniendo deudas:", error);
    return NextResponse.json({ error: "Error al obtener deudas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { miembroId, concepto, montoOriginal, montoRestante, notas } = await req.json();

    // Validaciones
    if (!miembroId || !concepto || !montoOriginal) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    if (montoOriginal <= 0) {
      return NextResponse.json({ error: "El monto debe ser mayor a 0" }, { status: 400 });
    }

    // Verificar que el miembro existe
    const miembro = await prisma.miembro.findUnique({
      where: { id: miembroId },
    });

    if (!miembro) {
      return NextResponse.json({ error: "El miembro no existe" }, { status: 404 });
    }

    // Crear la deuda
    const deuda = await prisma.deuda.create({
      data: {
        miembroId,
        concepto,
        montoOriginal,
        montoPagado: 0,
        montoRestante: montoRestante || montoOriginal,
        estado: "pendiente",
        notas: notas || null,
      },
      include: {
        miembro: true,
        pagos: true,
      },
    });

    return NextResponse.json(deuda, { status: 201 });
  } catch (error) {
    console.error("Error creando deuda:", error);
    return NextResponse.json({ error: "Error al crear la deuda" }, { status: 500 });
  }
}
