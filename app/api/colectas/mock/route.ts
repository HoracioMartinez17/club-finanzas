import { NextRequest, NextResponse } from "next/server";

// Datos de prueba mockeados con montos grandes para probar formatCompactNumber
const mockColectas = [
  {
    id: "1",
    nombre: "Uniforms 2025",
    descripcion: "Compra de uniformes nuevos para todo el equipo",
    objetivo: 10000000, // 10 millones
    estado: "activa",
    totalAportado: 9500000, // 9.5 millones
    totalComprometido: 2000000, // 2 millones
    totalGastos: 1200000, // 1.2 millones
    saldo: 8300000,
    porcentaje: 95,
    faltante: 500000,
    aportes: [
      {
        id: "a1",
        cantidad: 2000000,
        estado: "aportado",
        metodoPago: "transferencia",
        createdAt: new Date("2026-02-01"),
        miembro: { id: "m1", nombre: "Carlos García" },
      },
      {
        id: "a2",
        cantidad: 2000000,
        estado: "aportado",
        metodoPago: "efectivo",
        createdAt: new Date("2026-02-02"),
        miembro: { id: "m2", nombre: "Juan Pérez" },
      },
      {
        id: "a3",
        cantidad: 2000000,
        estado: "aportado",
        metodoPago: "transferencia",
        createdAt: new Date("2026-02-03"),
        miembro: { id: "m3", nombre: "María López" },
      },
      {
        id: "a4",
        cantidad: 1500000,
        estado: "aportado",
        metodoPago: "efectivo",
        createdAt: new Date("2026-02-04"),
        miembro: { id: "m4", nombre: "Pedro Martínez" },
      },
      {
        id: "a5",
        cantidad: 2000000,
        estado: "comprometido",
        metodoPago: null,
        createdAt: new Date("2026-02-05"),
        miembro: { id: "m5", nombre: "Laura Fernández" },
      },
    ],
    gastos: [
      {
        id: "g1",
        concepto: "Camisetas blancas (50 unidades)",
        cantidad: 700000,
        categoria: "uniformes",
        notas: "Camisetas de algodón premium",
        createdAt: new Date("2026-02-06"),
        quienPago: { id: "m1", nombre: "Carlos García" },
      },
      {
        id: "g2",
        concepto: "Shorts negros (50 unidades)",
        cantidad: 500000,
        categoria: "uniformes",
        notas: "Shorts deportivos resistentes",
        createdAt: new Date("2026-02-07"),
        quienPago: { id: "m2", nombre: "Juan Pérez" },
      },
    ],
  },
  {
    id: "2",
    nombre: "Viaje a Torneo Regional",
    descripcion: "Viaje a Ciudad del Este para el torneo nacional",
    objetivo: 15000000, // 15 millones
    estado: "activa",
    totalAportado: 8500000, // 8.5 millones
    totalComprometido: 3000000, // 3 millones
    totalGastos: 2000000, // 2 millones
    saldo: 6500000,
    porcentaje: 57,
    faltante: 6500000,
    aportes: [
      {
        id: "a6",
        cantidad: 3000000,
        estado: "aportado",
        metodoPago: "transferencia",
        createdAt: new Date("2026-02-08"),
        miembro: { id: "m1", nombre: "Carlos García" },
      },
      {
        id: "a7",
        cantidad: 2000000,
        estado: "aportado",
        metodoPago: "efectivo",
        createdAt: new Date("2026-02-09"),
        miembro: { id: "m2", nombre: "Juan Pérez" },
      },
      {
        id: "a8",
        cantidad: 3000000,
        estado: "comprometido",
        metodoPago: null,
        createdAt: new Date("2026-02-10"),
        miembro: { id: "m3", nombre: "María López" },
      },
      {
        id: "a9",
        cantidad: 500000,
        estado: "aportado",
        metodoPago: "transferencia",
        createdAt: new Date("2026-02-11"),
        miembro: { id: "m6", nombre: "Roberto Sánchez" },
      },
    ],
    gastos: [
      {
        id: "g3",
        concepto: "Bus de transporte (ida y vuelta)",
        cantidad: 1500000,
        categoria: "transporte",
        notas: "Alquiler para 50 personas",
        createdAt: new Date("2026-02-12"),
        quienPago: { id: "m1", nombre: "Carlos García" },
      },
      {
        id: "g4",
        concepto: "Hospedaje 3 noches",
        cantidad: 500000,
        categoria: "alojamiento",
        notas: "25 habitaciones",
        createdAt: new Date("2026-02-13"),
        quienPago: { id: "m2", nombre: "Juan Pérez" },
      },
    ],
  },
  {
    id: "3",
    nombre: "Reparación de Cancha",
    descripcion: "Arreglo del césped y sistema de riego",
    objetivo: 7500000, // 7.5 millones
    estado: "completada",
    totalAportado: 7500000, // 7.5 millones
    totalComprometido: 0,
    totalGastos: 7200000, // 7.2 millones
    saldo: 300000,
    porcentaje: 100,
    faltante: 0,
    aportes: [
      {
        id: "a10",
        cantidad: 2500000,
        estado: "aportado",
        metodoPago: "transferencia",
        createdAt: new Date("2026-01-15"),
        miembro: { id: "m4", nombre: "Pedro Martínez" },
      },
      {
        id: "a11",
        cantidad: 2700000,
        estado: "aportado",
        metodoPago: "efectivo",
        createdAt: new Date("2026-01-16"),
        miembro: { id: "m5", nombre: "Laura Fernández" },
      },
      {
        id: "a12",
        cantidad: 2300000,
        estado: "aportado",
        metodoPago: "transferencia",
        createdAt: new Date("2026-01-17"),
        miembro: { id: "m3", nombre: "María López" },
      },
    ],
    gastos: [
      {
        id: "g5",
        concepto: "Semillas de pasto premium y fertilizante",
        cantidad: 2500000,
        categoria: "mantenimiento",
        notas: "Para 1000 m² de cancha",
        createdAt: new Date("2026-02-01"),
        quienPago: { id: "m4", nombre: "Pedro Martínez" },
      },
      {
        id: "g6",
        concepto: "Mano de obra (5 jornadas)",
        cantidad: 2000000,
        categoria: "servicios",
        notas: "Preparación del terreno",
        createdAt: new Date("2026-02-02"),
        quienPago: { id: "m5", nombre: "Laura Fernández" },
      },
      {
        id: "g7",
        concepto: "Sistema de riego automático",
        cantidad: 1800000,
        categoria: "equipamiento",
        notas: "Tuberías y aspersores",
        createdAt: new Date("2026-02-03"),
        quienPago: { id: "m3", nombre: "María López" },
      },
      {
        id: "g8",
        concepto: "Drenaje y reparación de bordes",
        cantidad: 900000,
        categoria: "mantenimiento",
        notas: "Perímetro de la cancha",
        createdAt: new Date("2026-02-04"),
        quienPago: { id: "m1", nombre: "Carlos García" },
      },
    ],
  },
  {
    id: "4",
    nombre: "Entrenamiento con Coach Internacional",
    descripcion: "Campamento de entrenamiento intensivo con especialista",
    objetivo: 12000000, // 12 millones
    estado: "cerrada",
    totalAportado: 5000000, // 5 millones
    totalComprometido: 0,
    totalGastos: 4800000, // 4.8 millones
    saldo: 200000,
    porcentaje: 42,
    faltante: 7000000,
    aportes: [
      {
        id: "a13",
        cantidad: 1500000,
        estado: "aportado",
        metodoPago: "transferencia",
        createdAt: new Date("2026-02-14"),
        miembro: { id: "m6", nombre: "Roberto Sánchez" },
      },
      {
        id: "a14",
        cantidad: 1300000,
        estado: "aportado",
        metodoPago: "efectivo",
        createdAt: new Date("2026-02-15"),
        miembro: { id: "m1", nombre: "Carlos García" },
      },
      {
        id: "a15",
        cantidad: 1200000,
        estado: "aportado",
        metodoPago: "transferencia",
        createdAt: new Date("2026-02-16"),
        miembro: { id: "m2", nombre: "Juan Pérez" },
      },
      {
        id: "a16",
        cantidad: 1000000,
        estado: "aportado",
        metodoPago: "efectivo",
        createdAt: new Date("2026-02-17"),
        miembro: { id: "m4", nombre: "Pedro Martínez" },
      },
    ],
    gastos: [
      {
        id: "g9",
        concepto: "Honorario coach internacional",
        cantidad: 2500000,
        categoria: "servicios",
        notas: "5 días de entrenamiento directo",
        createdAt: new Date("2026-02-18"),
        quienPago: { id: "m6", nombre: "Roberto Sánchez" },
      },
      {
        id: "g10",
        concepto: "Alojamiento y comidas equipo",
        cantidad: 1500000,
        categoria: "alojamiento",
        notas: "5 noches para 30 personas",
        createdAt: new Date("2026-02-19"),
        quienPago: { id: "m1", nombre: "Carlos García" },
      },
      {
        id: "g11",
        concepto: "Transporte local",
        cantidad: 800000,
        categoria: "transporte",
        notas: "Traslados diarios",
        createdAt: new Date("2026-02-20"),
        quienPago: { id: "m2", nombre: "Juan Pérez" },
      },
    ],
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams, pathname } = new URL(req.url);
    const estado = searchParams.get("estado");

    // Detectar si se está pidiendo un ID específico (ej: /api/colectas/mock/1)
    const id = pathname.split("/").pop();

    // Si el ID no es "mock" (que es el nombre de la carpeta), buscarlo
    if (id && id !== "mock") {
      const colecta = mockColectas.find((c) => c.id === id);
      if (!colecta) {
        return NextResponse.json({ error: "Colecta no encontrada" }, { status: 404 });
      }
      return NextResponse.json(colecta);
    }

    // Si se filtra por estado
    let colectas = mockColectas;
    if (estado) {
      colectas = mockColectas.filter((c) => c.estado === estado);
    }

    return NextResponse.json(colectas);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error al obtener colectas" }, { status: 500 });
  }
}
