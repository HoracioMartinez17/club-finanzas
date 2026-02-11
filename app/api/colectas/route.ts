import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthPayload } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    const clubId = payload?.clubId;
    if (!clubId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");

    const colectas = await prisma.colecta.findMany({
      where: {
        clubId,
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

    // Calcular estadísticas
    const colectasConEstadisticas = colectas.map((colecta: (typeof colectas)[number]) => {
      const totalAportado = colecta.aportes
        .filter((a: (typeof colecta.aportes)[number]) => a.estado === "aportado")
        .reduce(
          (sum: number, a: (typeof colecta.aportes)[number]) => sum + a.cantidad,
          0,
        );
      const totalComprometido = colecta.aportes
        .filter((a: (typeof colecta.aportes)[number]) => a.estado === "comprometido")
        .reduce(
          (sum: number, a: (typeof colecta.aportes)[number]) => sum + a.cantidad,
          0,
        );
      const totalGastos = colecta.gastos.reduce(
        (sum: number, g: (typeof colecta.gastos)[number]) => sum + g.cantidad,
        0,
      );
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

    return NextResponse.json(colectasConEstadisticas);
  } catch (error) {
    console.error("Error obteniendo colectas:", error);
    return NextResponse.json({ error: "Error al obtener colectas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    const clubId = payload?.clubId;
    if (!clubId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { nombre, descripcion, objetivo, fechaCierre } = await req.json();

    if (!nombre || !objetivo) {
      return NextResponse.json(
        { error: "Nombre y objetivo requeridos" },
        { status: 400 },
      );
    }

    const colecta = await prisma.colecta.create({
      data: {
        nombre,
        descripcion,
        objetivo: parseFloat(objetivo),
        fechaCierre: fechaCierre ? new Date(fechaCierre) : null,
        clubId,
      },
    });

    return NextResponse.json({
      success: true,
      colecta,
    });
  } catch (error) {
    console.error("Error creando colecta:", error);
    return NextResponse.json({ error: "Error al crear colecta" }, { status: 500 });
  }
}
