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
    const aporte = await prisma.aporte.findFirst({
      where: { id, clubId },
      include: {
        miembro: true,
        colecta: true,
      },
    });

    if (!aporte) {
      return NextResponse.json({ error: "Aporte no encontrado" }, { status: 404 });
    }

    return NextResponse.json(aporte);
  } catch (error) {
    console.error("Error obteniendo aporte:", error);
    return NextResponse.json({ error: "Error al obtener aporte" }, { status: 500 });
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
    const { miembroId, cantidad, estado, metodoPago, notas } = await req.json();

    const aporte = await prisma.aporte.findFirst({
      where: { id, clubId },
    });

    if (!aporte) {
      return NextResponse.json({ error: "Aporte no encontrado" }, { status: 404 });
    }

    // Si se cambia el miembro, verificar que existe y obtener su nombre
    let nuevoMiembroNombre = aporte.miembroNombre;
    if (miembroId && miembroId !== aporte.miembroId) {
      const miembro = await prisma.miembro.findUnique({
        where: { id: miembroId },
      });

      if (!miembro) {
        return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
      }
      if (miembro.clubId !== clubId) {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
      }
      nuevoMiembroNombre = miembro.nombre;
    }

    const aporteActualizado = await prisma.aporte.update({
      where: { id },
      data: {
        miembroId: miembroId || aporte.miembroId,
        miembroNombre: nuevoMiembroNombre,
        cantidad: cantidad !== undefined ? parseFloat(cantidad) : aporte.cantidad,
        estado: estado || aporte.estado,
        metodoPago: metodoPago !== undefined ? metodoPago : aporte.metodoPago,
        notas: notas !== undefined ? notas : aporte.notas,
      },
      include: {
        miembro: true,
        colecta: true,
      },
    });

    return NextResponse.json({
      success: true,
      aporte: aporteActualizado,
    });
  } catch (error) {
    console.error("Error actualizando aporte:", error);
    return NextResponse.json({ error: "Error al actualizar aporte" }, { status: 500 });
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
    const aporte = await prisma.aporte.findFirst({
      where: { id, clubId },
    });

    if (!aporte) {
      return NextResponse.json({ error: "Aporte no encontrado" }, { status: 404 });
    }

    await prisma.aporte.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Aporte eliminado correctamente",
    });
  } catch (error) {
    console.error("Error eliminando aporte:", error);
    return NextResponse.json({ error: "Error al eliminar aporte" }, { status: 500 });
  }
}
