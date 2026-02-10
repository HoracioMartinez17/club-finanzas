# Panel de Administración - Club Finanzas

Documentación completa de la sección de administración de la aplicación Club Finanzas.

## 📋 Estructura de Carpetas

```
app/
├── admin/
│   ├── layout.tsx                 # Layout principal con sidebar
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard con estadísticas
│   ├── colectas/
│   │   ├── page.tsx              # Listado de colectas
│   │   └── nueva/
│   │       └── page.tsx          # Crear nueva colecta
│   ├── miembros/
│   │   ├── page.tsx              # Listado de miembros
│   │   └── nuevo/
│   │       └── page.tsx          # Crear nuevo miembro
│   ├── aportes/
│   │   └── page.tsx              # Historial de aportes
│   ├── gastos/
│   │   ├── page.tsx              # Listado de gastos
│   │   └── nuevo/
│   │       └── page.tsx          # Crear nuevo gasto
│   └── usuarios/
│       ├── page.tsx              # Gestión de usuarios admin
│       └── nuevo/
│           └── page.tsx          # Crear nuevo usuario admin
components/
├── AdminTable.tsx                 # Tabla reutilizable para admin
├── AdminForm.tsx                  # Formulario reutilizable para admin
├── Alert.tsx                      # Componente de alertas
└── ConfirmDialog.tsx              # Modal de confirmación
```

## 🔐 Protección de Rutas

El middleware en `middleware.ts` protege todas las rutas `/admin/*` verificando que:

1. El usuario tenga un token JWT válido
2. El token esté almacenado en las cookies
3. El usuario tenga rol de "admin"

### Configuración:

```typescript
// middleware.ts
export const config = {
  matcher: ["/admin/:path*"],
};
```

## 📱 Componentes Principales

### AdminTable

Tabla reutilizable para mostrar datos tabulares con acciones.

```tsx
import { AdminTable, TableColumn } from "@/components/AdminTable";

const columns: TableColumn[] = [
  { key: "nombre", label: "Nombre" },
  { key: "email", label: "Email" },
];

<AdminTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />;
```

### AdminForm

Formulario dinámico para crear/editar elementos.

```tsx
import { AdminForm } from "@/components/AdminForm";

const fields: FormField[] = [
  { name: "nombre", label: "Nombre", type: "text", required: true },
];

<AdminForm title="Nueva Colecta" fields={fields} onSubmit={handleSubmit} />;
```

### Alert

Componente para mostrar mensajes de éxito, error, etc.

```tsx
import { Alert } from "@/components/Alert";

<Alert type="success" message="Guardado correctamente" />;
```

## 📊 Dashboard

El dashboard muestra:

- Colectas activas vs total
- Número de miembros
- Total aportado
- Total gastado
- Balance final
- Accesos rápidos a funciones principales

## 🔑 Funcionalidades por Sección

### Colectas

- ✅ Listar colectas activas y cerradas
- ✅ Crear nueva colecta
- ✅ Editar colecta (preparado)
- ✅ Eliminar colecta
- ✅ Filtrar por estado

### Miembros

- ✅ Listar miembros
- ✅ Crear nuevo miembro
- ✅ Ver deuda de cuota
- ✅ Cambiar estado (activo/inactivo)
- ✅ Eliminar miembro

### Aportes

- ✅ Listar todos los aportes
- ✅ Ver miembro que aportó
- ✅ Ver colecta a la que aportó
- ✅ Método de pago
- ✅ Estado del aporte

### Gastos

- ✅ Listar gastos registrados
- ✅ Crear nuevo gasto
- ✅ Categorizar gastos
- ✅ Ver responsable del gasto
- ✅ Eliminar gasto

### Usuarios (Admin)

- ✅ Listar usuarios administradores
- ✅ Crear nuevo usuario (admin/tesorero)
- ✅ Ver rol de cada usuario
- ✅ Cambiar estado (activo/inactivo)
- ✅ Eliminar usuario

## 🎯 Rutas API para Admin

### Usuarios

```
GET    /api/usuarios              # Listar todos los usuarios
POST   /api/usuarios              # Crear nuevo usuario
GET    /api/usuarios/[id]         # Obtener usuario específico
PUT    /api/usuarios/[id]         # Actualizar usuario
DELETE /api/usuarios/[id]         # Eliminar usuario
```

### Colectas

```
GET    /api/colectas              # Listar colectas
POST   /api/colectas              # Crear colecta
DELETE /api/colectas/[id]         # Eliminar colecta
```

### Miembros

```
GET    /api/miembros              # Listar miembros
POST   /api/miembros              # Crear miembro
DELETE /api/miembros/[id]         # Eliminar miembro
```

### Gastos

```
GET    /api/gastos                # Listar gastos
POST   /api/gastos                # Crear gasto
DELETE /api/gastos/[id]           # Eliminar gasto
```

## 🎨 Tema Visual

- **Color principal**: Azul (#1e40af)
- **Sidebar**: Azul oscuro (#1e3a8a)
- **Alertas**: Verde (éxito), Rojo (error), Amarillo (advertencia), Azul (info)
- **Tabla**: Fondo blanco con hover gris claro

## 🚀 Cómo Usar

### Acceder al Admin

1. Inicia sesión con una cuenta de admin
2. Navega a `/admin/dashboard`
3. Usa el sidebar para acceder a las diferentes secciones

### Crear un Registro

1. Ve a la sección deseada (Colectas, Miembros, etc.)
2. Haz clic en el botón "+ Nuevo"
3. Completa el formulario
4. Haz clic en "Guardar"

### Editar/Eliminar

1. En el listado, usa los botones de acciones
2. Editar: ✏️ (preparado para implementación)
3. Eliminar: 🗑️ (muestra confirmación)

## ⚙️ Configuración

### Variables de Entorno

```
JWT_SECRET=tu-secreto-super-seguro-cambiar-en-produccion
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/club-finanzas
```

### Roles Disponibles

- `admin`: Acceso completo
- `tesorero`: Acceso limitado a finanzas

## 📝 Próximas Mejoras

- [ ] Implementar funcionalidad de edición completa
- [ ] Agregar búsqueda y filtros avanzados
- [ ] Paginación en tablas largas
- [ ] Exportar datos a PDF/Excel
- [ ] Gráficos más detallados
- [ ] Auditoria de cambios
- [ ] Notificaciones en tiempo real
- [ ] Respaldos automáticos

## 🐛 Solución de Problemas

### "No autorizado" al entrar a admin

- Verifica que estés logueado
- Comprueba que tu usuario tenga rol "admin"
- Limpia las cookies del navegador

### Datos no se cargan

- Verifica la conexión a la base de datos
- Comprueba los logs del servidor
- Intenta recargar la página

### Formulario no se envía

- Verifica que todos los campos requeridos estén completos
- Comprueba la consola del navegador para errores
- Verifica que la API esté disponible

---

**Última actualización**: Febrero 2026
