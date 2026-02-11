import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // Verificar autenticación y rol de super admin
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = verifyAuth(token);
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Verificar que el usuario sea super admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user?.isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const where: any = {};

    if (action && action !== "all") {
      where.action = action;
    }

    // Obtener logs con información del club
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        club: {
          select: {
            nombre: true,
            slug: true,
          },
        },
      },
    });

    // Parsear detalles JSON
    const parsedLogs = logs.map((log: any) => ({
      ...log,
      details: log.details ? JSON.parse(log.details as string) : null,
    }));

    return NextResponse.json(parsedLogs);
  } catch (error) {
    console.error("Error al obtener audit logs:", error);
    return NextResponse.json({ error: "Error al obtener logs" }, { status: 500 });
  }
}

// Endpoint para obtener estadísticas de auditoría
export async function POST(request: Request) {
  try {
    // Verificar autenticación y rol de super admin
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = verifyAuth(token);
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Verificar que el usuario sea super admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user?.isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Contar logs por tipo de acción
    const stats = await prisma.auditLog.groupBy({
      by: ["action"],
      _count: {
        action: true,
      },
    });

    // Contar logs totales
    const total = await prisma.auditLog.count();

    // Logs de las últimas 24 horas
    const last24Hours = await prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return NextResponse.json({
      total,
      last24Hours,
      byAction: stats.reduce(
        (acc: Record<string, number>, stat: any) => {
          acc[stat.action] = stat._count.action;
          return acc;
        },
        {} as Record<string, number>,
      ),
    });
  } catch (error) {
    console.error("Error al obtener stats de audit logs:", error);
    return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 });
  }
}
