import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    let config = await prisma.config.findFirst();

    if (!config) {
      config = await prisma.config.create({
        data: {
          transparenciaPublica: true,
          nombreClub: "Club de Fútbol",
        },
      });
    }

    return NextResponse.json({
      transparenciaPublica: config.transparenciaPublica,
      nombreClub: config.nombreClub,
      descripcionClub: config.descripcionClub,
    });
  } catch (error) {
    console.error("Error obteniendo configuración:", error);
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { transparenciaPublica, nombreClub, descripcionClub } = await req.json();

    let config = await prisma.config.findFirst();

    if (!config) {
      config = await prisma.config.create({
        data: {
          transparenciaPublica: transparenciaPublica ?? true,
          nombreClub: nombreClub ?? "Club de Fútbol",
          descripcionClub: descripcionClub,
        },
      });
    } else {
      config = await prisma.config.update({
        where: { id: config.id },
        data: {
          transparenciaPublica: transparenciaPublica ?? config.transparenciaPublica,
          nombreClub: nombreClub ?? config.nombreClub,
          descripcionClub: descripcionClub ?? config.descripcionClub,
        },
      });
    }

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error("Error actualizando configuración:", error);
    return NextResponse.json(
      { error: "Error al actualizar configuración" },
      { status: 500 },
    );
  }
}
