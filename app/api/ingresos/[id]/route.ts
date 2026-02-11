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
    const ingreso = await prisma.ingreso.findFirst({
      where: { id, clubId },
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
    const payload = getAuthPayload(req);
    const clubId = payload?.clubId;
    if (!clubId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    const ingresoActual = await prisma.ingreso.findFirst({
      where: { id, clubId },
    });

    if (!ingresoActual) {
      return NextResponse.json({ error: "Ingreso no encontrado" }, { status: 404 });
    }

    if (data.miembroId) {
      const miembro = await prisma.miembro.findUnique({
        where: { id: data.miembroId },
      });
      if (!miembro || miembro.clubId !== clubId) {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
      }
    }

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
    const payload = getAuthPayload(req);
    const clubId = payload?.clubId;
    if (!clubId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const ingreso = await prisma.ingreso.findFirst({
      where: { id, clubId },
    });

    if (!ingreso) {
      return NextResponse.json({ error: "Ingreso no encontrado" }, { status: 404 });
    }

    await prisma.ingreso.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando ingreso:", error);
    return NextResponse.json({ error: "Error al eliminar ingreso" }, { status: 500 });
  }
}
