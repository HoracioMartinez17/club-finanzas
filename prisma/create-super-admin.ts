import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Creando Super Administrador...\n");

  // Use environment variables for security, with defaults only for development
  const email =
    process.env.SUPERADMIN_EMAIL || "superadmin@clubfinanzas.com";
  const password =
    process.env.SUPERADMIN_PASSWORD || "SuperAdmin123!";
  const nombre = "Super Administrador";

  if (!process.env.SUPERADMIN_PASSWORD) {
    console.log(
      "⚠️  IMPORTANTE: SUPERADMIN_PASSWORD no está definida en .env"
    );
    console.log("   Usando contraseña por defecto (SOLO para desarrollo)");
    console.log(
      "   En producción, define SUPERADMIN_PASSWORD en tus variables de entorno\n"
    );
  }

  // Verificar si ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log("⚠️  Ya existe un usuario con el email:", email);
    console.log("   Usuario ID:", existingUser.id);
    console.log("   Es Super Admin:", existingUser.isSuperAdmin);

    if (!existingUser.isSuperAdmin) {
      console.log("\n🔄 Actualizando a Super Admin...");
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          isSuperAdmin: true,
          clubId: null,
        },
      });
      console.log("✅ Usuario actualizado a Super Admin");
    }

    console.log("\n📋 Credenciales:");
    console.log("   Email:", email);
    console.log("   Contraseña: (sin cambios)");
    return;
  }

  // Crear nuevo super admin
  const hashedPassword = await bcrypt.hash(password, 10);

  const superAdmin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      nombre,
      rol: "admin",
      activo: true,
      isSuperAdmin: true,
      clubId: null, // Super admin no pertenece a ningún club
    },
  });

  console.log("✅ Super Administrador creado exitosamente!\n");
  console.log("📋 Credenciales de acceso:");
  console.log("   Email:", email);
  console.log("   Contraseña:", password);
  console.log("   ID:", superAdmin.id);
  console.log("\n🔐 IMPORTANTE:");
  console.log("   1. Inicia sesión con estas credenciales en /login");
  console.log("   2. Accede a /super-admin/clubes para gestionar clubes");
  console.log("   3. CAMBIA LA CONTRASEÑA inmediatamente después del primer login");
  console.log("   4. Guarda estas credenciales en un lugar seguro");
  console.log("\n⚠️  ADVERTENCIA DE SEGURIDAD:");
  console.log("   Esta contraseña es temporal y de ejemplo.");
  console.log("   Cámbiala INMEDIATAMENTE en producción.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
