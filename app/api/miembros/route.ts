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

    const miembros = await prisma.miembro.findMany({
      where: { clubId },
      include: {
        aportes: true,
        gastosRealizados: true,
      },
      orderBy: {
        nombre: "asc",
      },
    });

    const miembrosConEstadisticas = miembros.map((miembro: (typeof miembros)[number]) => {
      const totalAportado = miembro.aportes
        .filter((a: (typeof miembro.aportes)[number]) => a.estado === "aportado")
        .reduce(
          (sum: number, a: (typeof miembro.aportes)[number]) => sum + a.cantidad,
          0,
        );
      const totalComprometido = miembro.aportes
        .filter((a: (typeof miembro.aportes)[number]) => a.estado === "comprometido")
        .reduce(
          (sum: number, a: (typeof miembro.aportes)[number]) => sum + a.cantidad,
          0,
        );
      const totalGastos = miembro.gastosRealizados.reduce(
        (sum: number, g: (typeof miembro.gastosRealizados)[number]) => sum + g.cantidad,
        0,
      );

      return {
        ...miembro,
        totalAportado,
        totalComprometido,
        totalGastos,
      };
    });

    return NextResponse.json(miembrosConEstadisticas);
  } catch (error) {
    console.error("Error obteniendo miembros:", error);
    return NextResponse.json({ error: "Error al obtener miembros" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    const clubId = payload?.clubId;
    if (!clubId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { nombre, email, telefono, estado, deudaCuota } = await req.json();

    if (!nombre) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const miembro = await prisma.miembro.create({
      data: {
        nombre,
        email: email || null,
        telefono: telefono || null,
        estado: estado || "activo",
        deudaCuota: deudaCuota ? parseFloat(deudaCuota) : 0,
        clubId,
      },
    });

    return NextResponse.json({
      success: true,
      miembro,
    });
  } catch (error) {
    console.error("Error creando miembro:", error);
    return NextResponse.json({ error: "Error al crear miembro" }, { status: 500 });
  }
}
