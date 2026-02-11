import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthPayload } from "@/lib/auth";

// GET /api/audit-log - Obtener logs de auditoría
export async function GET(request: NextRequest) {
  try {
    const payload = getAuthPayload(request);
    const clubId = payload?.clubId;
    if (!clubId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");

    const where: any = { clubId };

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        userId: true,
        userName: true,
        details: true,
        ipAddress: true,
        createdAt: true,
      },
    });

    // Parsear los detalles JSON
    const logsFormatted = logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));

    return NextResponse.json(logsFormatted);
  } catch (error) {
    console.error("Error obteniendo audit logs:", error);
    return NextResponse.json(
      { error: "Error al obtener logs de auditoría" },
      { status: 500 },
    );
  }
}
