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

    let config = await prisma.config.findFirst({
      where: { clubId },
    });

    if (!config) {
      config = await prisma.config.create({
        data: {
          transparenciaPublica: true,
          nombreClub: "Club de Fútbol",
          clubId,
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
    const payload = getAuthPayload(req);
    const clubId = payload?.clubId;
    if (!clubId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { transparenciaPublica, nombreClub, descripcionClub } = await req.json();

    let config = await prisma.config.findFirst({
      where: { clubId },
    });

    if (!config) {
      config = await prisma.config.create({
        data: {
          transparenciaPublica: transparenciaPublica ?? true,
          nombreClub: nombreClub ?? "Club de Fútbol",
          descripcionClub: descripcionClub,
          clubId,
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
