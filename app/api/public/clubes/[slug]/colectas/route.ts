import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");

    const club = await prisma.club.findUnique({
      where: { slug },
      select: { id: true, nombre: true, slug: true },
    });

    if (!club) {
      return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
    }

    const colectas = await prisma.colecta.findMany({
      where: {
        clubId: club.id,
        ...(estado && { estado }),
      },
      include: {
        aportes: true,
        gastos: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const colectasConEstadisticas = colectas.map((colecta) => {
      const totalAportado = colecta.aportes
        .filter((a) => a.estado === "aportado")
        .reduce((sum, a) => sum + a.cantidad, 0);
      const totalComprometido = colecta.aportes
        .filter((a) => a.estado === "comprometido")
        .reduce((sum, a) => sum + a.cantidad, 0);
      const totalGastos = colecta.gastos.reduce((sum, g) => sum + g.cantidad, 0);
      const saldo = totalAportado - totalGastos;

      return {
        ...colecta,
        totalAportado,
        totalComprometido,
        totalGastos,
        saldo,
        porcentaje: Math.round((totalAportado / colecta.objetivo) * 100),
      };
    });

    return NextResponse.json({
      club,
      colectas: colectasConEstadisticas,
    });
  } catch (error) {
    console.error("Error obteniendo colectas publicas:", error);
    return NextResponse.json({ error: "Error al obtener colectas" }, { status: 500 });
  }
}
