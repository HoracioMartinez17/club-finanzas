import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Limpiando datos anteriores...");

  // Eliminar en orden inverso de dependencias
  await prisma.aporte.deleteMany();
  await prisma.gasto.deleteMany();
  await prisma.ingreso.deleteMany();
  await prisma.colecta.deleteMany();
  await prisma.miembro.deleteMany();
  await prisma.user.deleteMany();
  await prisma.config.deleteMany();
  await prisma.club.deleteMany();

  console.log("🏟️ Creando club por defecto...");

  const defaultClub = await prisma.club.create({
    data: {
      nombre: "Club de Fútbol Local",
      slug: "club-local",
      activo: true,
      planId: "free",
      logoUrl: null,
      createdBy: null,
    },
  });

  const clubData = { clubId: defaultClub.id };

  console.log("📝 Creando usuarios (Directiva)...");

  // Test credentials - MUST be defined in .env
  if (!process.env.TEST_ADMIN_PASSWORD) {
    throw new Error(
      "❌ TEST_ADMIN_PASSWORD not defined in .env - required for seed script",
    );
  }
  if (!process.env.TEST_TESORERO_PASSWORD) {
    throw new Error(
      "❌ TEST_TESORERO_PASSWORD not defined in .env - required for seed script",
    );
  }

  const adminPassword = await bcrypt.hash(process.env.TEST_ADMIN_PASSWORD, 10);
  const tesoreroPassword = await bcrypt.hash(process.env.TEST_TESORERO_PASSWORD, 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@club.com",
        nombre: "Admin Club",
        password: adminPassword,
        rol: "admin",
        activo: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "tesorero@club.com",
        nombre: "Juan Tesorero",
        password: tesoreroPassword,
        rol: "tesorero",
        activo: true,
      },
    }),
  ]);

  console.log("👥 Creando miembros...");

  const miembros = await Promise.all([
    prisma.miembro.create({
      data: {
        nombre: "Carlos García",
        email: "carlos@gmail.com",
        telefono: "1234567890",
        estado: "activo",
      },
    }),
    prisma.miembro.create({
      data: {
        nombre: "Juan Pérez",
        email: "juan@gmail.com",
        telefono: "1234567891",
        estado: "activo",
      },
    }),
    prisma.miembro.create({
      data: {
        nombre: "María López",
        email: "maria@gmail.com",
        telefono: "1234567892",
        estado: "activo",
      },
    }),
    prisma.miembro.create({
      data: {
        nombre: "Pedro Martínez",
        email: "pedro@gmail.com",
        telefono: "1234567893",
        estado: "activo",
      },
    }),
    prisma.miembro.create({
      data: {
        nombre: "Laura Fernández",
        email: "laura@gmail.com",
        telefono: "1234567894",
        estado: "activo",
      },
    }),
    prisma.miembro.create({
      data: {
        nombre: "Roberto Sánchez",
        email: "roberto@gmail.com",
        telefono: "1234567895",
        estado: "activo",
      },
    }),
  ]);

  console.log("💰 Creando colectas...");

  const colectas = await Promise.all([
    // Colecta Activa - casi completa
    prisma.colecta.create({
      data: {
        nombre: "Uniforms 2025",
        descripcion: "Compra de uniformes nuevos para todo el equipo",
        objetivo: 10000,
        estado: "activa",
        fechaInicio: new Date("2025-02-01"),
        fechaCierre: new Date("2025-03-15"),
      },
    }),
    // Colecta Activa - baja recaudación
    prisma.colecta.create({
      data: {
        nombre: "Viaje a Torneo Nacional",
        descripcion: "Viaje a Buenos Aires para el torneo regional",
        objetivo: 25000,
        estado: "activa",
        fechaInicio: new Date("2025-02-05"),
        fechaCierre: new Date("2025-04-30"),
      },
    }),
    // Colecta Completada
    prisma.colecta.create({
      data: {
        nombre: "Reparación de Cancha",
        descripcion: "Arreglo del césped y marcado de la cancha",
        objetivo: 5000,
        estado: "completada",
        fechaInicio: new Date("2025-01-01"),
        fechaCierre: new Date("2025-01-30"),
      },
    }),
    // Colecta Cerrada
    prisma.colecta.create({
      data: {
        nombre: "Equipo de Entrenamiento",
        descripcion: "Compra de conos, balones y otros equipos",
        objetivo: 3000,
        estado: "cerrada",
        fechaInicio: new Date("2024-12-01"),
        fechaCierre: new Date("2025-01-15"),
      },
    }),
  ]);

  console.log("💵 Creando aportes...");

  // Aportes para Uniforms (casi completa - 9500 de 10000)
  await Promise.all([
    prisma.aporte.create({
      data: {
        colecta: { connect: { id: colectas[0].id } },
        miembro: { connect: { id: miembros[0].id } },
        cantidad: 2000,
        estado: "aportado",
        metodoPago: "transferencia",
        notas: "Aporte inicial",
      },
    }),
    prisma.aporte.create({
      data: {
        colecta: { connect: { id: colectas[0].id } },
        miembro: { connect: { id: miembros[1].id } },
        cantidad: 2000,
        estado: "aportado",
        metodoPago: "efectivo",
      },
    }),
    prisma.aporte.create({
      data: {
        colecta: { connect: { id: colectas[0].id } },
        miembro: { connect: { id: miembros[2].id } },
        cantidad: 2000,
        estado: "aportado",
        metodoPago: "transferencia",
      },
    }),
    prisma.aporte.create({
      data: {
        colecta: { connect: { id: colectas[0].id } },
        miembro: { connect: { id: miembros[3].id } },
        cantidad: 1500,
        estado: "aportado",
        metodoPago: "efectivo",
      },
    }),
    prisma.aporte.create({
      data: {
        colecta: { connect: { id: colectas[0].id } },
        miembro: { connect: { id: miembros[4].id } },
        cantidad: 2000,
        estado: "comprometido",
        metodoPago: null,
        notas: "Comprometido para fin de mes",
      },
    }),
    // Aportes para Viaje (baja recaudación - 8000 de 25000)
    prisma.aporte.create({
      data: {
        colecta: { connect: { id: colectas[1].id } },
        miembro: { connect: { id: miembros[0].id } },
        cantidad: 3000,
        estado: "aportado",
        metodoPago: "transferencia",
      },
    }),
    prisma.aporte.create({
      data: {
        colecta: { connect: { id: colectas[1].id } },
        miembro: { connect: { id: miembros[1].id } },
        cantidad: 2000,
        estado: "aportado",
        metodoPago: "efectivo",
      },
    }),
    prisma.aporte.create({
      data: {
        colecta: { connect: { id: colectas[1].id } },
        miembro: { connect: { id: miembros[2].id } },
        cantidad: 3000,
        estado: "comprometido",
        metodoPago: null,
      },
    }),
    // Aportes para Reparación Cancha (completada - 5200 de 5000)
    prisma.aporte.create({
      data: {
        colecta: { connect: { id: colectas[2].id } },
        miembro: { connect: { id: miembros[3].id } },
        cantidad: 2500,
        estado: "aportado",
        metodoPago: "transferencia",
      },
    }),
    prisma.aporte.create({
      data: {
        colecta: { connect: { id: colectas[2].id } },
        miembro: { connect: { id: miembros[4].id } },
        cantidad: 2700,
        estado: "aportado",
        metodoPago: "efectivo",
      },
    }),
    // Aportes para Equipo (cerrada - 2800 de 3000)
    prisma.aporte.create({
      data: {
        colecta: { connect: { id: colectas[3].id } },
        miembro: { connect: { id: miembros[5].id } },
        cantidad: 1500,
        estado: "aportado",
        metodoPago: "transferencia",
      },
    }),
    prisma.aporte.create({
      data: {
        colecta: { connect: { id: colectas[3].id } },
        miembro: { connect: { id: miembros[0].id } },
        cantidad: 1300,
        estado: "aportado",
        metodoPago: "efectivo",
      },
    }),
  ]);

  console.log("🧾 Creando gastos...");

  // Gastos para Uniforms
  await Promise.all([
    prisma.gasto.create({
      data: {
        concepto: "Camisetas blancas",
        cantidad: 4000,
        categoria: "uniformes",
        quienPago: { connect: { id: miembros[0].id } },
        colecta: { connect: { id: colectas[0].id } },
        tipoGasto: "colecta",
        notas: "15 camisetas a $267 c/u",
      },
    }),
    prisma.gasto.create({
      data: {
        concepto: "Shorts negros",
        cantidad: 3000,
        categoria: "uniformes",
        quienPago: { connect: { id: miembros[1].id } },
        colecta: { connect: { id: colectas[0].id } },
        tipoGasto: "colecta",
        notas: "15 shorts a $200 c/u",
      },
    }),
    // Gastos para Reparación Cancha
    prisma.gasto.create({
      data: {
        concepto: "Semillas de pasto",
        cantidad: 2000,
        categoria: "cancha",
        quienPago: { connect: { id: miembros[3].id } },
        colecta: { connect: { id: colectas[2].id } },
        tipoGasto: "colecta",
      },
    }),
    prisma.gasto.create({
      data: {
        concepto: "Mano de obra",
        cantidad: 2500,
        categoria: "cancha",
        quienPago: { connect: { id: miembros[4].id } },
        colecta: { connect: { id: colectas[2].id } },
        tipoGasto: "colecta",
      },
    }),
    // Gastos para Equipo
    prisma.gasto.create({
      data: {
        concepto: "Conos de entrenamiento",
        cantidad: 1000,
        categoria: "equipamiento",
        quienPago: { connect: { id: miembros[5].id } },
        colecta: { connect: { id: colectas[3].id } },
        tipoGasto: "colecta",
      },
    }),
    prisma.gasto.create({
      data: {
        concepto: "Balones de fútbol",
        cantidad: 1800,
        categoria: "equipamiento",
        quienPago: { connect: { id: miembros[0].id } },
        colecta: { connect: { id: colectas[3].id } },
        tipoGasto: "colecta",
        notas: "6 balones premium",
      },
    }),
  ]);

  console.log("📦 Creando ingresos diversos...");

  await Promise.all([
    prisma.ingreso.create({
      data: {
        concepto: "Venta de chipas y empanadas en partido del domingo",
        cantidad: 850,
        fuente: "Venta de Alimentos",
        miembro: { connect: { id: miembros[0].id } },
        fecha: new Date("2025-02-08"),
      },
    }),
    prisma.ingreso.create({
      data: {
        concepto: "Torneo relámpago - Inscripciones",
        cantidad: 1200,
        fuente: "Eventos",
        miembro: { connect: { id: miembros[1].id } },
        fecha: new Date("2025-02-05"),
      },
    }),
    prisma.ingreso.create({
      data: {
        concepto: "Rifa de camiseta Argentina autografiada",
        cantidad: 950,
        fuente: "Rifas",
        miembro: { connect: { id: miembros[2].id } },
        fecha: new Date("2025-02-01"),
      },
    }),
    prisma.ingreso.create({
      data: {
        concepto: "Patrocinio empresa local - Logo en camiseta",
        cantidad: 3000,
        fuente: "Patrocinios",
        miembro: { connect: { id: miembros[3].id } },
        fecha: new Date("2025-01-15"),
      },
    }),
    prisma.ingreso.create({
      data: {
        concepto: "Venta de camisetas y gorras del club",
        cantidad: 420,
        fuente: "Productos del club",
        miembro: { connect: { id: miembros[4].id } },
        fecha: new Date("2025-02-06"),
      },
    }),
    prisma.ingreso.create({
      data: {
        concepto: "Venta de choripán en partido vs Deportivo",
        cantidad: 680,
        fuente: "Venta de Alimentos",
        miembro: { connect: { id: miembros[5].id } },
        fecha: new Date("2025-01-28"),
      },
    }),
    prisma.ingreso.create({
      data: {
        concepto: "Cuotas sociales mes de febrero",
        cantidad: 2500,
        fuente: "Cuotas Sociales",
        fecha: new Date("2025-02-01"),
      },
    }),
    prisma.ingreso.create({
      data: {
        concepto: "Fiesta de fin de año del club",
        cantidad: 1800,
        fuente: "Eventos",
        miembro: { connect: { id: miembros[0].id } },
        fecha: new Date("2024-12-31"),
      },
    }),
  ]);

  console.log("⚙️ Creando configuración...");

  await prisma.config.create({
    data: {
      transparenciaPublica: true,
      nombreClub: "Club de Fútbol Local",
      descripcionClub: "Club fundado en 2010, con jóvenes talentos",
    },
  });

  console.log("✅ Seed completado con éxito!");
  console.log("👤 Usuarios de prueba creados:");
  console.log("  - admin@club.com");
  console.log("  - tesorero@club.com");
  console.log(
    "⚠️  Define TEST_ADMIN_PASSWORD y TEST_TESORERO_PASSWORD en .env antes de ejecutar seed.",
  );
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
