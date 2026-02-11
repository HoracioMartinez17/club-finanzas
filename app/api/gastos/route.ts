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
    const colectaId = searchParams.get("colectaId");
    const tipo = searchParams.get("tipo");

    const gastos = await prisma.gasto.findMany({
      where: {
        clubId,
        ...(colectaId && { colectaId }),
        ...(tipo && { tipoGasto: tipo }),
      },
      include: {
        quienPago: true,
        colecta: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(gastos);
  } catch (error) {
    console.error("Error obteniendo gastos:", error);
    return NextResponse.json({ error: "Error al obtener gastos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    const clubId = payload?.clubId;
    if (!clubId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const {
      concepto,
      cantidad,
      categoria,
      quienPagoId,
      colectaId,
      tipoGasto = "general",
      comprobante,
      notas,
    } = await req.json();

    if (!concepto || !cantidad || !categoria || !quienPagoId) {
      return NextResponse.json(
        { error: "Concepto, cantidad, categoría y quienPagoId requeridos" },
        { status: 400 },
      );
    }

    // Verificar que el miembro existe
    const miembro = await prisma.miembro.findUnique({
      where: { id: quienPagoId },
    });

    if (!miembro) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }
    if (miembro.clubId !== clubId) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    if (colectaId) {
      const colecta = await prisma.colecta.findFirst({
        where: { id: colectaId, clubId },
      });
      if (!colecta) {
        return NextResponse.json({ error: "Colecta no encontrada" }, { status: 404 });
      }
    }

    const gasto = await prisma.gasto.create({
      data: {
        concepto,
        cantidad: parseFloat(cantidad),
        categoria,
        quienPagoId,
        quienPagoNombre: miembro.nombre,
        colectaId: colectaId || null,
        tipoGasto,
        comprobante,
        notas,
        clubId,
      },
      include: {
        quienPago: true,
        colecta: true,
      },
    });

    return NextResponse.json({
      success: true,
      gasto,
    });
  } catch (error) {
    console.error("Error creando gasto:", error);
    return NextResponse.json({ error: "Error al crear gasto" }, { status: 500 });
  }
}
