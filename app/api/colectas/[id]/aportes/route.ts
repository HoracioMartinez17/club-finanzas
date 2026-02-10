import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: colectaId } = await params;

    if (!colectaId) {
      return NextResponse.json({ error: "ID de colecta requerido" }, { status: 400 });
    }

    const aportes = await prisma.aporte.findMany({
      where: {
        colectaId: colectaId,
      },
      include: {
        miembro: true,
        colecta: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(aportes);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener los aportes" }, { status: 500 });
  }
}
