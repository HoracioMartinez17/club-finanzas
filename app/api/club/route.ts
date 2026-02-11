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

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        nombre: true,
        slug: true,
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
    }

    return NextResponse.json(club);
  } catch (error) {
    console.error("Error obteniendo club:", error);
    return NextResponse.json({ error: "Error al obtener club" }, { status: 500 });
  }
}
