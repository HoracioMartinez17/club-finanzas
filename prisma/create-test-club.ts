import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getArgValue = (key: string) => {
  const prefix = `--${key}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
};

async function main() {
  const name = getArgValue("name") || "Club Prueba";
  const slug = getArgValue("slug") || slugify(name) || "club-prueba";
  const planId = getArgValue("plan") || "free";
  const email = getArgValue("email") || `admin.${slug}@club.com`;
  const password =
    getArgValue("password") || process.env.TEST_CLUB_ADMIN_PASSWORD || "***REMOVED***";

  console.log("\n🏟️  Creando club de prueba...");
  console.log(`   Nombre: ${name}`);
  console.log(`   Slug: ${slug}`);
  console.log(`   Plan: ${planId}`);

  let club = await prisma.club.findUnique({
    where: { slug },
  });

  if (!club) {
    club = await prisma.club.create({
      data: {
        nombre: name,
        slug,
        activo: true,
        planId,
        logoUrl: null,
        createdBy: null,
      },
    });
    console.log(`✅ Club creado: ${club.nombre} (${club.id})`);
  } else {
    console.log(`ℹ️  Club ya existe: ${club.nombre} (${club.id})`);
  }

  let adminUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!adminUser) {
    const hashedPassword = await bcrypt.hash(password, 10);
    adminUser = await prisma.user.create({
      data: {
        email,
        nombre: `Admin ${name}`,
        password: hashedPassword,
        rol: "admin",
        activo: true,
        isSuperAdmin: false,
        clubId: club.id,
      },
    });
    console.log(`✅ Usuario admin creado: ${email}`);
  } else if (adminUser.clubId !== club.id) {
    console.log("⚠️  Ya existe un usuario con ese email en otro club.");
    console.log(`   Usuario ID: ${adminUser.id}`);
  } else {
    console.log(`ℹ️  Usuario admin ya existe: ${email}`);
  }

  const existingConfig = await prisma.config.findFirst({
    where: { clubId: club.id },
  });

  if (!existingConfig) {
    await prisma.config.create({
      data: {
        transparenciaPublica: true,
        nombreClub: name,
        descripcionClub: `Configuracion inicial para ${name}`,
        clubId: club.id,
      },
    });
    console.log("✅ Configuracion creada");
  }

  const miembrosData = [
    { nombre: "Carlos Prueba", email: `carlos.${slug}@club.com`, telefono: "0981000001" },
    { nombre: "Maria Prueba", email: `maria.${slug}@club.com`, telefono: "0981000002" },
  ];

  const miembros = [] as Array<{ id: string; nombre: string }>;
  for (const data of miembrosData) {
    let miembro = await prisma.miembro.findFirst({
      where: { email: data.email, clubId: club.id },
    });

    if (!miembro) {
      miembro = await prisma.miembro.create({
        data: {
          nombre: data.nombre,
          email: data.email,
          telefono: data.telefono,
          estado: "activo",
          deudaCuota: 0,
          clubId: club.id,
        },
      });
      console.log(`✅ Miembro creado: ${miembro.nombre}`);
    }

    miembros.push({ id: miembro.id, nombre: miembro.nombre });
  }

  let colecta = await prisma.colecta.findFirst({
    where: { nombre: "Colecta Prueba", clubId: club.id },
  });

  if (!colecta) {
    colecta = await prisma.colecta.create({
      data: {
        nombre: "Colecta Prueba",
        descripcion: "Colecta de ejemplo para pruebas",
        objetivo: 1000,
        estado: "activa",
        fechaInicio: new Date(),
        fechaCierre: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        clubId: club.id,
      },
    });
    console.log("✅ Colecta creada");
  }

  const aporteExists = await prisma.aporte.findFirst({
    where: { clubId: club.id, colectaId: colecta.id, miembroId: miembros[0].id },
  });

  if (!aporteExists) {
    await prisma.aporte.create({
      data: {
        colectaId: colecta.id,
        miembroId: miembros[0].id,
        miembroNombre: miembros[0].nombre,
        cantidad: 150,
        estado: "aportado",
        metodoPago: "efectivo",
        notas: "Aporte de prueba",
        clubId: club.id,
      },
    });
    console.log("✅ Aporte creado");
  }

  const gastoExists = await prisma.gasto.findFirst({
    where: { clubId: club.id, concepto: "Gasto Prueba" },
  });

  if (!gastoExists) {
    await prisma.gasto.create({
      data: {
        concepto: "Gasto Prueba",
        cantidad: 120,
        categoria: "equipamiento",
        quienPagoId: miembros[0].id,
        quienPagoNombre: miembros[0].nombre,
        colectaId: colecta.id,
        tipoGasto: "colecta",
        notas: "Gasto de prueba",
        clubId: club.id,
      },
    });
    console.log("✅ Gasto creado");
  }

  const ingresoExists = await prisma.ingreso.findFirst({
    where: { clubId: club.id, concepto: "Ingreso Prueba" },
  });

  if (!ingresoExists) {
    await prisma.ingreso.create({
      data: {
        concepto: "Ingreso Prueba",
        cantidad: 200,
        fuente: "Evento",
        miembroId: miembros[1].id,
        fecha: new Date(),
        clubId: club.id,
      },
    });
    console.log("✅ Ingreso creado");
  }

  const deudaExists = await prisma.deuda.findFirst({
    where: { clubId: club.id, concepto: "Deuda Prueba" },
  });

  if (!deudaExists) {
    const deuda = await prisma.deuda.create({
      data: {
        miembroId: miembros[1].id,
        miembroNombre: miembros[1].nombre,
        concepto: "Deuda Prueba",
        montoOriginal: 300,
        montoPagado: 0,
        montoRestante: 300,
        estado: "pendiente",
        notas: "Deuda de prueba",
        clubId: club.id,
      },
    });

    await prisma.pagoDeuda.create({
      data: {
        deudaId: deuda.id,
        cantidad: 100,
        notas: "Pago parcial de prueba",
        clubId: club.id,
      },
    });

    await prisma.deuda.update({
      where: { id: deuda.id },
      data: {
        montoPagado: 100,
        montoRestante: 200,
        estado: "parcial_pagada",
      },
    });

    console.log("✅ Deuda y pago creados");
  }

  console.log("\n📋 Credenciales de admin del club:");
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log("\n✅ Script finalizado. Puedes iniciar sesion con el usuario creado.\n");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
