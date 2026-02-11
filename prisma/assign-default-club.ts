import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Iniciando asignación de club por defecto...");

  // 1. Crear club por defecto
  const defaultClub = await prisma.club.create({
    data: {
      nombre: "Sporting Club",
      slug: "sporting",
      activo: true,
      planId: "free",
      logoUrl: null,
      createdBy: null,
    },
  });

  console.log(`✅ Club creado: ${defaultClub.nombre} (${defaultClub.id})`);

  // 2. Asignar todos los miembros al club por defecto
  const miembrosUpdated = await prisma.miembro.updateMany({
    where: { clubId: { equals: null } as any },
    data: { clubId: defaultClub.id },
  });
  console.log(`✅ ${miembrosUpdated.count} miembros asignados`);

  // 3. Asignar todas las colectas al club por defecto
  const colectasUpdated = await prisma.colecta.updateMany({
    where: { clubId: { equals: null } as any },
    data: { clubId: defaultClub.id },
  });
  console.log(`✅ ${colectasUpdated.count} colectas asignadas`);

  // 4. Asignar todos los aportes al club por defecto
  const aportesUpdated = await prisma.aporte.updateMany({
    where: { clubId: { equals: null } as any },
    data: { clubId: defaultClub.id },
  });
  console.log(`✅ ${aportesUpdated.count} aportes asignados`);

  // 5. Asignar todos los gastos al club por defecto
  const gastosUpdated = await prisma.gasto.updateMany({
    where: { clubId: { equals: null } as any },
    data: { clubId: defaultClub.id },
  });
  console.log(`✅ ${gastosUpdated.count} gastos asignados`);

  // 6. Asignar todos los ingresos al club por defecto
  const ingresosUpdated = await prisma.ingreso.updateMany({
    where: { clubId: { equals: null } as any },
    data: { clubId: defaultClub.id },
  });
  console.log(`✅ ${ingresosUpdated.count} ingresos asignados`);

  // 7. Asignar todas las deudas al club por defecto
  const deudasUpdated = await prisma.deuda.updateMany({
    where: { clubId: { equals: null } as any },
    data: { clubId: defaultClub.id },
  });
  console.log(`✅ ${deudasUpdated.count} deudas asignadas`);

  // 8. Asignar todos los pagos de deuda al club por defecto
  const pagosDeudasUpdated = await prisma.pagoDeuda.updateMany({
    where: { clubId: { equals: null } as any },
    data: { clubId: defaultClub.id },
  });
  console.log(`✅ ${pagosDeudasUpdated.count} pagos de deuda asignados`);

  // 9. Asignar config al club por defecto
  const configUpdated = await prisma.config.updateMany({
    where: { clubId: { equals: null } as any },
    data: { clubId: defaultClub.id },
  });
  console.log(`✅ ${configUpdated.count} configuración asignada`);

  // 10. Actualizar usuarios existentes para asociarlos al club
  const usuariosUpdated = await prisma.user.updateMany({
    where: { clubId: null },
    data: { clubId: defaultClub.id },
  });
  console.log(`✅ ${usuariosUpdated.count} usuarios asignados`);

  console.log("\n🎉 ¡Todos los registros asignados exitosamente al club por defecto!");
  console.log(
    `📊 Resumen: ${miembrosUpdated.count + colectasUpdated.count + aportesUpdated.count + gastosUpdated.count + ingresosUpdated.count + deudasUpdated.count + pagosDeudasUpdated.count + configUpdated.count + usuariosUpdated.count} registros actualizados`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
