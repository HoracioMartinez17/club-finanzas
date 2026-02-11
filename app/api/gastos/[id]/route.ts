import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthPayload } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = getAuthPayload(req);
    const clubId = payload?.clubId;
    if (!clubId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const gasto = await prisma.gasto.findFirst({
      where: { id, clubId },
      include: {
        quienPago: true,
        colecta: true,
      },
    });

    if (!gasto) {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
    }

    return NextResponse.json(gasto);
  } catch (error) {
    console.error("Error obteniendo gasto:", error);
    return NextResponse.json({ error: "Error al obtener gasto" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = getAuthPayload(req);
    const clubId = payload?.clubId;
    if (!clubId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const { concepto, cantidad, categoria, quienPagoId, comprobante, notas } =
      await req.json();

    const gasto = await prisma.gasto.findFirst({
      where: { id, clubId },
    });

    if (!gasto) {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
    }

    // Si se está cambiando el miembro, obtener su nombre
    let quienPagoNombre = gasto.quienPagoNombre;
    if (quienPagoId && quienPagoId !== gasto.quienPagoId) {
      const miembro = await prisma.miembro.findUnique({
        where: { id: quienPagoId },
      });
      if (miembro) {
        if (miembro.clubId !== clubId) {
          return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }
        quienPagoNombre = miembro.nombre;
      }
    }

    const gastoActualizado = await prisma.gasto.update({
      where: { id },
      data: {
        concepto: concepto || gasto.concepto,
        cantidad: cantidad !== undefined ? parseFloat(cantidad) : gasto.cantidad,
        categoria: categoria || gasto.categoria,
        quienPagoId: quienPagoId || gasto.quienPagoId,
        quienPagoNombre: quienPagoNombre,
        comprobante: comprobante !== undefined ? comprobante : gasto.comprobante,
        notas: notas !== undefined ? notas : gasto.notas,
      },
      include: {
        quienPago: true,
        colecta: true,
      },
    });

    return NextResponse.json({
      success: true,
      gasto: gastoActualizado,
    });
  } catch (error) {
    console.error("Error actualizando gasto:", error);
    return NextResponse.json({ error: "Error al actualizar gasto" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = getAuthPayload(req);
    const clubId = payload?.clubId;
    if (!clubId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const gasto = await prisma.gasto.findFirst({
      where: { id, clubId },
    });

    if (!gasto) {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
    }

    await prisma.gasto.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Gasto eliminado correctamente",
    });
  } catch (error) {
    console.error("Error eliminando gasto:", error);
    return NextResponse.json({ error: "Error al eliminar gasto" }, { status: 500 });
  }
}
