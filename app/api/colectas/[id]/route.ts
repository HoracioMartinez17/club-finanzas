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
    const colecta = await prisma.colecta.findFirst({
      where: { id, clubId },
      include: {
        aportes: {
          include: {
            miembro: true,
          },
        },
        gastos: {
          include: {
            quienPago: true,
          },
        },
      },
    });

    if (!colecta) {
      return NextResponse.json({ error: "Colecta no encontrada" }, { status: 404 });
    }

    // Calcular estadísticas
    const totalAportado = colecta.aportes
      .filter((a: { estado: string; cantidad: number }) => a.estado === "aportado")
      .reduce(
        (sum: number, a: { estado: string; cantidad: number }) => sum + a.cantidad,
        0,
      );

    const totalComprometido = colecta.aportes
      .filter((a: { estado: string; cantidad: number }) => a.estado === "comprometido")
      .reduce(
        (sum: number, a: { estado: string; cantidad: number }) => sum + a.cantidad,
        0,
      );

    const totalGastos = colecta.gastos.reduce(
      (sum: number, g: { cantidad: number }) => sum + g.cantidad,
      0,
    );
    const saldo = totalAportado - totalGastos;
    const porcentaje = Math.round((totalAportado / colecta.objetivo) * 100);
    const faltante = Math.max(0, colecta.objetivo - totalAportado);

    return NextResponse.json({
      ...colecta,
      totalAportado,
      totalComprometido,
      totalGastos,
      saldo,
      porcentaje,
      faltante,
    });
  } catch (error) {
    console.error("Error obteniendo colecta:", error);
    return NextResponse.json({ error: "Error al obtener colecta" }, { status: 500 });
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
    const { nombre, descripcion, objetivo, estado, fechaCierre } = await req.json();

    const colecta = await prisma.colecta.findFirst({
      where: { id, clubId },
    });

    if (!colecta) {
      return NextResponse.json({ error: "Colecta no encontrada" }, { status: 404 });
    }

    const colectaActualizada = await prisma.colecta.update({
      where: { id },
      data: {
        nombre: nombre || colecta.nombre,
        descripcion: descripcion !== undefined ? descripcion : colecta.descripcion,
        objetivo: objetivo ? parseFloat(objetivo) : colecta.objetivo,
        estado: estado || colecta.estado,
        fechaCierre: fechaCierre ? new Date(fechaCierre) : colecta.fechaCierre,
      },
    });

    return NextResponse.json({
      success: true,
      colecta: colectaActualizada,
    });
  } catch (error) {
    console.error("Error actualizando colecta:", error);
    return NextResponse.json({ error: "Error al actualizar colecta" }, { status: 500 });
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
    const colecta = await prisma.colecta.findFirst({
      where: { id, clubId },
    });

    if (!colecta) {
      return NextResponse.json({ error: "Colecta no encontrada" }, { status: 404 });
    }

    await prisma.colecta.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Colecta eliminada correctamente",
    });
  } catch (error) {
    console.error("Error eliminando colecta:", error);
    return NextResponse.json({ error: "Error al eliminar colecta" }, { status: 500 });
  }
}
