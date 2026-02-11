import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const { slug, id } = await params;

    const club = await prisma.club.findUnique({
      where: { slug },
      select: { id: true, nombre: true, slug: true },
    });

    if (!club) {
      return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
    }

    const colecta = await prisma.colecta.findFirst({
      where: { id, clubId: club.id },
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

    const totalAportado = colecta.aportes
      .filter((a) => a.estado === "aportado")
      .reduce((sum, a) => sum + a.cantidad, 0);

    const totalComprometido = colecta.aportes
      .filter((a) => a.estado === "comprometido")
      .reduce((sum, a) => sum + a.cantidad, 0);

    const totalGastos = colecta.gastos.reduce((sum, g) => sum + g.cantidad, 0);
    const saldo = totalAportado - totalGastos;
    const porcentaje = Math.round((totalAportado / colecta.objetivo) * 100);
    const faltante = Math.max(0, colecta.objetivo - totalAportado);

    return NextResponse.json({
      club,
      colecta: {
        ...colecta,
        totalAportado,
        totalComprometido,
        totalGastos,
        saldo,
        porcentaje,
        faltante,
      },
    });
  } catch (error) {
    console.error("Error obteniendo colecta publica:", error);
    return NextResponse.json({ error: "Error al obtener colecta" }, { status: 500 });
  }
}
