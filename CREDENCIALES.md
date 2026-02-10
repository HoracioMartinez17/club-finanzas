# 🔐 Credenciales de Acceso - Sistema Club Finanzas

**Fecha**: 9 de febrero de 2026  
**Estado**: Desarrollo  
**⚠️ IMPORTANTE**: Estas son credenciales de desarrollo. NO usar en producción.

---

## 👤 Usuarios Administradores

### 1. Admin Principal

```
Email:      admin@club.com
Contraseña: admin123
Rol:        Admin
```

**Permisos**: Acceso completo a todas las funcionalidades del sistema

**URLs de Acceso**:

- Login: `http://localhost:3000/login`
- Panel Admin: `http://localhost:3000/admin/dashboard`

---

### 2. Tesorero

```
Email:      tesorero@club.com
Contraseña: tesorero123
Rol:        Tesorero
```

**Permisos**: Gestión financiera (aportes, gastos, colectas)

**URLs de Acceso**:

- Login: `http://localhost:3000/login`
- Panel Admin: `http://localhost:3000/admin/dashboard`

---

## 🚀 Cómo Iniciar Sesión

### Paso 1: Crear los Usuarios en la Base de Datos

Si aún no has ejecutado el seed, corre:

```bash
npx prisma db seed
```

O si ya tienes datos:

```bash
npx prisma migrate reset
# Esto eliminará todos los datos y volverá a crearlos
```

### Paso 2: Acceder al Sistema

1. Abre tu navegador en: `http://localhost:3000/login`
2. Ingresa las credenciales (email y contraseña)
3. Haz clic en "Iniciar Sesión"
4. Serás redirigido al panel admin

---

## 📋 Miembros de Prueba (para testing)

El seed también crea estos miembros de prueba:

1. **Carlos García** - carlos@gmail.com
2. **Juan Pérez** - juan@gmail.com
3. **María López** - maria@gmail.com
4. **Pedro Martínez** - pedro@gmail.com
5. **Laura Fernández** - laura@gmail.com
6. **Roberto Sánchez** - roberto@gmail.com

_Estos son solo miembros del club, no usuarios del sistema admin._

---

## 🔒 Seguridad

### En Desarrollo

✅ Las contraseñas están hasheadas con bcrypt (10 rounds)  
✅ Los tokens JWT expiran en 7 días  
✅ Las rutas admin están protegidas por middleware

### Antes de Producción

⚠️ **CAMBIAR TODAS LAS CONTRASEÑAS**

1. Editar `prisma/seed.ts` con contraseñas seguras
2. Usar variables de entorno para credenciales
3. Implementar política de contraseñas fuertes
4. Habilitar 2FA (autenticación de dos factores)
5. Configurar rate limiting en el login
6. Usar HTTPS en todas las conexiones

---

## 🔄 Cambiar Contraseñas

### Opción 1: Desde el Panel Admin (cuando esté implementado)

1. Ve a `/admin/usuarios`
2. Edita el usuario
3. Cambia la contraseña
4. Guarda los cambios

### Opción 2: Manualmente con Prisma Studio

```bash
npx prisma studio
```

1. Abre la tabla `users`
2. Selecciona el usuario
3. Genera un nuevo hash con:

```javascript
const bcrypt = require("bcryptjs");
const newPassword = await bcrypt.hash("tu-nueva-contraseña", 10);
console.log(newPassword);
```

4. Actualiza el campo `password` con el nuevo hash

### Opción 3: Script de Cambio de Contraseña

```typescript
// scripts/change-password.ts
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

async function changePassword(email: string, newPassword: string) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  console.log(`✅ Contraseña actualizada para ${email}`);
}

// Ejemplo de uso
changePassword("admin@club.com", "nueva-contraseña-segura");
```

---

## 📝 Variables de Entorno Requeridas

Asegúrate de tener estas variables en tu archivo `.env`:

```env
# Base de datos
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/club_finanzas"

# JWT Secret (cambiar en producción)
JWT_SECRET="tu-secreto-super-seguro-aqui"

# Entorno
NODE_ENV="development"
```

---

## 🧪 Testing de Acceso

### Test 1: Login Exitoso

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@club.com",
    "password": "admin123"
  }'
```

**Respuesta esperada**: Token JWT y mensaje de éxito

### Test 2: Login Fallido

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@club.com",
    "password": "incorrecta"
  }'
```

**Respuesta esperada**: Error 401

---

## ⚙️ Configuración Adicional

### Tiempo de Expiración del Token

Por defecto: 7 días

Para cambiar, edita `lib/auth.ts`:

```typescript
const token = jwt.sign(
  { userId: user.id, email: user.email, rol: user.rol },
  JWT_SECRET,
  { expiresIn: "7d" }, // Cambiar aquí
);
```

### Agregar Más Usuarios

Edita `prisma/seed.ts` y agrega:

```typescript
prisma.user.create({
  data: {
    email: "nuevo@club.com",
    nombre: "Nombre Completo",
    password: await bcrypt.hash("contraseña123", 10),
    rol: "admin", // o "tesorero"
    activo: true,
  },
});
```

Luego ejecuta:

```bash
npx prisma db seed
```

---

## 📞 Soporte

Si tienes problemas para iniciar sesión:

1. ✅ Verifica que la base de datos esté corriendo
2. ✅ Confirma que ejecutaste las migraciones: `npx prisma migrate dev`
3. ✅ Asegúrate de haber ejecutado el seed: `npx prisma db seed`
4. ✅ Revisa los logs del servidor para errores
5. ✅ Verifica las variables de entorno en `.env`

---

## 📚 Documentos Relacionados

- [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - Guía completa del panel
- [ADMIN_IMPLEMENTATION_SUMMARY.md](ADMIN_IMPLEMENTATION_SUMMARY.md) - Resumen de implementación
- [MIEMBROS_ELIMINACION_CAMBIOS.md](MIEMBROS_ELIMINACION_CAMBIOS.md) - Cambios en eliminación de miembros

---

**⚠️ RECORDATORIO DE SEGURIDAD**

```
┌─────────────────────────────────────────────────┐
│  ESTAS SON CREDENCIALES DE DESARROLLO          │
│  NUNCA uses "admin123" en producción           │
│  SIEMPRE cambia las contraseñas antes de       │
│  desplegar a un servidor público               │
└─────────────────────────────────────────────────┘
```

---

**Última actualización**: 9 de febrero de 2026
