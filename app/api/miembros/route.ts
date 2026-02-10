import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const miembros = await prisma.miembro.findMany({
      include: {
        aportes: true,
        gastosRealizados: true,
      },
      orderBy: {
        nombre: "asc",
      },
    });

    const miembrosConEstadisticas = miembros.map((miembro) => {
      const totalAportado = miembro.aportes
        .filter((a) => a.estado === "aportado")
        .reduce((sum, a) => sum + a.cantidad, 0);
      const totalComprometido = miembro.aportes
        .filter((a) => a.estado === "comprometido")
        .reduce((sum, a) => sum + a.cantidad, 0);
      const totalGastos = miembro.gastosRealizados.reduce(
        (sum, g) => sum + g.cantidad,
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
