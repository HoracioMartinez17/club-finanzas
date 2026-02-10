# Guía Rápida - Panel de Administración

## 🚀 Inicio Rápido

### 1. Configuración Inicial

```bash
# Instalar dependencias
npm install

# Configurar base de datos
cp .env.example .env.local
# Edita .env.local y configura DATABASE_URL y JWT_SECRET

# Crear datos iniciales
npm run prisma:migrate dev
npm run prisma:seed
```

### 2. Iniciar Servidor

```bash
npm run dev
```

Accede a: `http://localhost:3000`

### 3. Acceder al Admin

**URL**: `http://localhost:3000/admin/dashboard`

**Credenciales por defecto** (ver `prisma/seed.ts`):

- Email: `admin@club.com`
- Contraseña: (configurada en seed.ts)

---

## 📍 Rutas Principales

```
Público:
├── /                          → Home (lista colectas públicas)
├── /login                      → Inicio de sesión
├── /colectas/[id]             → Detalle de colecta
└── /colectas/[id]/aportes     → Ver aportes de una colecta

Admin:
└── /admin
    ├── /dashboard             → Panel principal
    ├── /colectas              → Gestión de colectas
    │   └── /nueva             → Crear colecta
    ├── /miembros              → Gestión de miembros
    │   └── /nuevo             → Crear miembro
    ├── /aportes               → Ver aportes
    ├── /gastos                → Gestión de gastos
    │   └── /nuevo             → Crear gasto
    └── /usuarios              → Gestión de usuarios admin
        └── /nuevo             → Crear usuario
```

---

## 🎮 Funciones Principales Admin

### Dashboard

- Estadísticas en tiempo real
- Total de colectas, miembros
- Balance financiero
- Accesos rápidos

### Colectas

- ✏️ Crear nuevas colectas
- 📊 Ver progreso vs objetivo
- 🗑️ Eliminar colectas
- 🔍 Filtrar por estado

### Miembros

- 👤 Gestionar miembros
- 💳 Ver deuda de cuota
- ✏️ Crear/editar miembro
- 🗑️ Eliminar miembro

### Aportes

- 📋 Listar todos los aportes
- 🔎 Filtrar por miembro/colecta
- 💰 Ver cantidad y método pago
- 📅 Visto por fecha

### Gastos

- 💸 Registrar gastos
- 🏷️ Categorizar
- 👤 Asignar responsable
- 📊 Ver por categoría

### Usuarios

- 🔐 Crear usuarios admin
- 👥 Asignar roles (admin/tesorero)
- ✏️ Editar usuarios
- 🗑️ Eliminar usuarios

---

## 🔑 Variables de Entorno

Requeridas en `.env.local`:

```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/club-finanzas

# JWT
JWT_SECRET=tu-secreto-super-seguro-cambiar-en-produccion
```

---

## 📦 Dependencias Principales

```json
{
  "next": "16.1.6", // Framework web
  "react": "19.2.3", // UI
  "@prisma/client": "^6.19.2", // ORM
  "tailwindcss": "^4", // Estilos
  "react-icons": "^5.5.0", // Iconos
  "bcryptjs": "^3.0.3", // Encriptación
  "jsonwebtoken": "^9.0.3", // JWT
  "axios": "^1.13.5" // HTTP
}
```

---

## 🗄️ Estructura de Base de Datos

```sql
-- Usuarios (admin)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  nombre VARCHAR NOT NULL,
  password VARCHAR NOT NULL,
  rol VARCHAR DEFAULT 'admin',
  activo BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Miembros del club
CREATE TABLE miembros (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR NOT NULL,
  email VARCHAR,
  telefono VARCHAR,
  estado VARCHAR DEFAULT 'activo',
  deudaCuota DECIMAL(10,2) DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Colectas especiales
CREATE TABLE colectas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR NOT NULL,
  descripcion TEXT,
  objetivo DECIMAL(10,2) NOT NULL,
  estado VARCHAR DEFAULT 'activa',
  fechaInicio TIMESTAMP DEFAULT NOW(),
  fechaCierre TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Aportes
CREATE TABLE aportes (
  id SERIAL PRIMARY KEY,
  colectaId INTEGER REFERENCES colectas(id),
  miembroId INTEGER REFERENCES miembros(id),
  cantidad DECIMAL(10,2) NOT NULL,
  estado VARCHAR DEFAULT 'aportado',
  metodoPago VARCHAR,
  notas TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Gastos
CREATE TABLE gastos (
  id SERIAL PRIMARY KEY,
  colectaId INTEGER REFERENCES colectas(id),
  descripcion TEXT NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  categoria VARCHAR,
  responsable VARCHAR,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## 🧪 Testing

### Crear datos de prueba

```bash
# Ejecutar seed
npm run prisma:seed
```

### Dev tools recomendadas

```bash
# Ver BD en interfaz gráfica
npm run prisma:studio
```

---

## 🔒 Seguridad

Checklist antes de producción:

- [ ] Cambiar `JWT_SECRET`
- [ ] Configurar `DATABASE_URL`
- [ ] Habilitar HTTPS
- [ ] Agregar validaciones adicionales
- [ ] Configurar CORS
- [ ] Rate limiting
- [ ] Sanitización de inputs
- [ ] Backup automático

---

## 🐛 Troubleshooting

### "No autorizado" en admin

```bash
# Verificar token
- Limpiar cookies/localStorage
- Volver a iniciar sesión
- Verificar JWT_SECRET coincide
```

### BD no conecta

```bash
# Verificar conexión
- DATABASE_URL correcta
- PostgreSQL está corriendo
- Credenciales correctas
```

### Formularios no envían

```bash
# Verificar
- Campos requeridos completos
- Validaciones en console
- Network en DevTools
```

---

## 📞 Soporte

Para problemas:

1. Revisar los logs en la consola
2. Ver ADMIN_GUIDE.md
3. Revisar archivos de componentes
4. Verificar BD con `npm run prisma:studio`

---

**Última actualización**: 9 de febrero de 2026
**Versión**: 1.0
