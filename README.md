# ⚽ Club Fútbol - Gestor de Colectas y Finanzas

## 📋 Descripción del Proyecto

Aplicación web para gestionar **colectas especiales** y **finanzas generales** de una comisión de un club de fútbol con 30+ miembros.

### 🆕 Panel de Administración

Se ha creado un **panel de administración completo** con:

- **Dashboard** con estadísticas en tiempo real
  ![Dashboard del panel de administración](public/image/Dashboard-club.png)

  ---
- **Gestión de Colectas** - Crear, editar, eliminar
  ![Gestión de colectas](public/image/colectas.png)

  ---
- **Gestión de Miembros** - Control de miembros y deudas
  ![Gestión de miembros](public/image/miembros.png)

  ---
  ![Control de deudas de miembros](public/image/deudas.png)

  ---
- **Historial de Aportes** - Seguimiento completo
  ![Historial de aportes](public/image/aportes.png)

  ---
- **Registro de Gastos** - Categorización y responsables
  _Captura pendiente_
- **Gestión de Usuarios** - Administrador y tesorero
  _Captura pendiente_
- **Componentes reutilizables** - Tablas, formularios, alertas
  _Captura pendiente_

### El Problema

- Sin registro centralizado de aportes
- Dinero en papel sin seguimiento
- No se sabe cuánto se recaudó vs objetivo
- Sin visibilidad sobre gastos
- Deudas sin control

### La Solución

Una plataforma web que permite:

- ✅ Registrar aportes de miembros
- ✅ Controlar colectas vs objetivos
- ✅ Registrar gastos clasificados
- ✅ Generar reportes automáticos
- ✅ Transparencia controlable por directiva
- ✅ Gestión de finanzas generales del club

---

## 🏗️ Arquitectura Técnica

```
FRONTEND (Next.js + React)
    ├── Dashboard Público (sin login)
    └── Panel Admin/Directiva (con autenticación)

API REST (Next.js Routes)
    ├── auth/ (login, logout)
    ├── colectas/ (CRUD)
    ├── gastos/ (CRUD)
    ├── miembros/ (CRUD)
    ├── config/ (transparencia)
    └── reportes/ (estadísticas)

BASE DE DATOS (PostgreSQL + Prisma ORM)
    ├── users
    ├── miembros
    ├── colectas
    ├── aportes
    ├── gastos
    ├── ingresos
    └── config
```

---

## 👥 Roles y Acceso

### 🌍 Miembro Público

- **Sin login** - acceso directo
- **Ve:** Colectas activas, progreso, (si transparencia ON) aportes, gastos
- **NO ve:** Datos sensibles de finanzas generales

### 💼 Directiva (3-5 personas)

- **Con login** - email + contraseña
- **Ve:** Todo - colectas, finanzas, reportes, miembros
- **Puede:** Crear colectas, registrar aportes/gastos, controlar transparencia

### 🔒 Tesorero

- **Rol especial** dentro de Directiva
- Gestión de ingresos/egresos generales

---

## 📌 MÓDULO 1: COLECTAS ESPECIALES

### Características

- Crear colecta con: nombre, descripción, objetivo ($), fecha límite
- Estados: Activa, Cerrada, Completada
- Registrar aportes de miembros (aportado vs comprometido)
- Registrar gastos de colecta
- Calcular: recaudado, vs objetivo, faltante, saldo

### Datos Capturados - Aportes

- ✅ Quién aportó (nombre)
- ✅ Cantidad aportada
- ✅ Fecha y hora
- ✅ Método de pago (efectivo/transferencia)
- ✅ Estado (aportado/comprometido)
- ✅ Notas personalizadas

### Datos Capturados - Gastos

- ✅ Concepto/descripción
- ✅ Cantidad
- ✅ Quién lo pagó
- ✅ Categoría (jugadores, viajes, etc)
- ✅ Comprobante/recibo (archivo)

---

## 🏦 MÓDULO 2: FINANZAS GENERALES DEL CLUB

### Ingresos

- 💰 Cuotas mensuales de miembros
- 💰 Patrocinios/donaciones
- 💰 Venta de productos del club

### Egresos

- 💸 Salarios/pagos jugadores
- 💸 Pago de árbitros
- 💸 Arriendo de cancha
- 💸 Viajes/transportes
- 💸 Otros gastos administrativos
- 💸 Gastos inesperados

### Reportes Financieros

- 📊 **Balance mensual**: Ingresos vs Egresos
- 💰 **Estado de tesorería**: Saldo actual disponible
- 👤 **Deuda de cuotas**: Quién debe y cuánto
- ⚽ **Costo por jugador**: Inversión en cada jugador
- 📈 **Proyección presupuestaria**: Estimaciones futuras

---

## 🔒 CONTROL DE TRANSPARENCIA

### ¿Qué es?

Toggle en panel admin para controlar qué ve el público:

### Estado: ON (Máxima Transparencia)

Todos ven:

- ✅ Quién aportó y cuánto
- ✅ En qué se gastó
- ✅ Total recaudado
- ✅ Porcentaje de progreso
- ✅ Listado completo de gastos

### Estado: OFF (Privado - Solo Directiva)

Público solo ve:

- ❌ Nombres de colectas
- ❌ Objetivos
- ❌ Nada de transacciones
- ❌ Nada de gastos
- ❌ Sin cifras

Directiva ve:

- ✅ TODO

---

## 🛠️ Stack Tecnológico

| Capa              | Tecnología                                     |
| ----------------- | ---------------------------------------------- |
| **Frontend**      | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend**       | Next.js API Routes                             |
| **ORM**           | Prisma                                         |
| **Base Datos**    | PostgreSQL                                     |
| **Autenticación** | JWT + bcrypt                                   |
| **UI Icons**      | react-icons                                    |
| **Gráficos**      | recharts                                       |
| **Validación**    | Zod (TODO)                                     |

---

## 📦 Instalación y Setup

### Requisitos Previos

- Node.js 18+
- PostgreSQL 12+
- npm o yarn

### Pasos

1. **Clonar/Localizar proyecto**

```bash
cd ~/Downloads/club-finanzas
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar base de datos**
   Crear archivo `.env`:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/club_finanzas"
JWT_SECRET="tu-secreto-super-seguro"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Crear schema en Base de Datos**

```bash
npx prisma migrate dev --name init
```

5. **Seed de datos iniciales (TODO)**

```bash
npx prisma db seed
```

6. **Ejecutar desarrollo**

```bash
npm run dev
```

7. **Abrir en navegador**

```
http://localhost:3000
```

---

## 🚀 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm start

# Prisma Studio (ver BD visualmente)
npx prisma studio

# Generar migraciones
npx prisma migrate dev --name descripcion

# Resetear BD (⚠️ borra todo)
npx prisma migrate reset

# Ver estado de migraciones
npx prisma migrate status
```

---

## 📁 Estructura de Carpetas

```
club-finanzas/
├── app/
│   ├── api/                 ← Routes del backend
│   │   ├── auth/
│   │   ├── colectas/
│   │   ├── gastos/
│   │   ├── miembros/
│   │   ├── config/
│   │   └── reportes/
│   ├── dashboard/           ← Panel administrativo
│   ├── colectas/            ← Dashboard público
│   ├── login/               ← Página login
│   └── page.tsx             ← Home pública
├── components/              ← Componentes reutilizables
├── lib/
│   ├── db.ts               ← Prisma client
│   ├── auth.ts             ← JWT utilities
│   └── utils.ts            ← Funciones helper
├── prisma/
│   ├── schema.prisma       ← Definición de BD
│   └── migrations/         ← Historial migraciones
├── styles/                 ← Estilos globales
├── public/                 ← Archivos estáticos
├── .env                    ← Variables de entorno
├── .env.example            ← Template de .env
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---
