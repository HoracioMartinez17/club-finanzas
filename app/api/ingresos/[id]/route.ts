import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ingreso = await prisma.ingreso.findUnique({
      where: { id },
      include: {
        miembro: true,
      },
    });

    if (!ingreso) {
      return NextResponse.json({ error: "Ingreso no encontrado" }, { status: 404 });
    }

    return NextResponse.json(ingreso);
  } catch (error) {
    console.error("Error obteniendo ingreso:", error);
    return NextResponse.json({ error: "Error al obtener ingreso" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await req.json();

    const ingreso = await prisma.ingreso.update({
      where: { id },
      data: {
        ...(data.concepto && { concepto: data.concepto }),
        ...(data.cantidad && { cantidad: parseFloat(data.cantidad) }),
        ...(data.fuente && { fuente: data.fuente }),
        ...(data.miembroId !== undefined && { miembroId: data.miembroId || null }),
        ...(data.fecha && { fecha: new Date(data.fecha) }),
      },
      include: {
        miembro: true,
      },
    });

    return NextResponse.json(ingreso);
  } catch (error) {
    console.error("Error actualizando ingreso:", error);
    return NextResponse.json({ error: "Error al actualizar ingreso" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.ingreso.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando ingreso:", error);
    return NextResponse.json({ error: "Error al eliminar ingreso" }, { status: 500 });
  }
}
