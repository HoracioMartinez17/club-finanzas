import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// PUT - Actualizar miembro
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, email, telefono, estado, deudaCuota } = body;

    // Validación
    if (!nombre) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    // Actualizar miembro
    const miembro = await prisma.miembro.update({
      where: { id },
      data: {
        nombre,
        email: email || null,
        telefono: telefono || null,
        estado,
        deudaCuota: parseFloat(deudaCuota) || 0,
      },
    });

    return NextResponse.json(miembro);
  } catch (error) {
    console.error("Error al actualizar miembro:", error);
    return NextResponse.json(
      { error: "Error al actualizar el miembro" },
      { status: 500 },
    );
  }
}

// DELETE - Eliminar miembro
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Eliminar miembro
    // Los aportes, gastos e ingresos mantendrán el nombre del miembro guardado en miembroNombre/quienPagoNombre
    await prisma.miembro.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Miembro eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar miembro:", error);
    return NextResponse.json({ error: "Error al eliminar el miembro" }, { status: 500 });
  }
}
