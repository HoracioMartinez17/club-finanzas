# Cambios en Eliminación de Miembros - Preservación de Historial

## Resumen

Se ha actualizado el sistema para que **los aportes y gastos conserven el nombre del miembro incluso después de eliminarlo**, manteniendo así un historial completo e intacto de todas las transacciones.

## Cambios Realizados

### 1. Schema de Base de Datos (Prisma)

**Archivo: `prisma/schema.prisma`**

Se agregaron campos opcionales para almacenar los nombres de los miembros:

```prisma
model Aporte {
  // ... otros campos
  miembro       Miembro? @relation(fields: [miembroId], references: [id], onDelete: SetNull)
  miembroId     String?
  miembroNombre String?  // Guardar nombre para historial
  // ...
}

model Gasto {
  // ... otros campos
  quienPago       Miembro? @relation(fields: [quienPagoId], references: [id], onDelete: SetNull)
  quienPagoId     String?
  quienPagoNombre String?  // Guardar nombre para historial
  // ...
}
```

**Comportamiento:**

- `onDelete: SetNull` en las relaciones hace que el ID se vuelva `null` al eliminar el miembro
- Los campos de nombre (`miembroNombre` y `quienPagoNombre`) permanecen intactos
- Son opcionales para compatibilidad con registros antiguos

### 2. API de Aportes

**Archivo: `app/api/colectas/aportes/route.ts`**

- **POST**: Guarda automáticamente el nombre del miembro al crear un aporte
- Verifica que el miembro exista y obtiene su nombre

**Archivo: `app/api/colectas/aportes/[id]/route.ts`**

- **PUT**: Al actualizar un aporte y cambiar el miembro, también actualiza el nombre

### 3. API de Gastos

**Archivo: `app/api/gastos/route.ts`**

- **POST**: Guarda automáticamente el nombre del miembro al crear un gasto
- Verifica que el miembro exista y obtiene su nombre

**Archivo: `app/api/gastos/[id]/route.ts`**

- **PUT**: Al actualizar un gasto y cambiar el miembro que pagó, también actualiza el nombre

### 4. API de Miembros

**Archivo: `app/api/miembros/[id]/route.ts`**

- **DELETE**: Se eliminó la validación que impedía eliminar miembros con gastos asociados
- Ahora se puede eliminar cualquier miembro
- Los registros históricos se mantienen con el nombre guardado

### 5. Interfaces de Usuario

#### Página de Administración de Miembros

**Archivo: `app/admin/miembros/page.tsx`**

- Modal de eliminación actualizado con mensaje simplificado:
  - Antes: Verificaba gastos y aportes, mostraba advertencias
  - Ahora: Mensaje simple: "Esta acción eliminará permanentemente al miembro."

#### Página de Aportes

**Archivo: `app/admin/aportes/page.tsx`**

- Usa `miembroNombre` como prioridad, con fallback a `miembro?.nombre`
- Muestra "N/A" si no hay información disponible

#### Página de Gastos

**Archivo: `app/admin/gastos/page.tsx`**

- Usa `quienPagoNombre` como prioridad, con fallback a `quienPago?.nombre`
- Muestra "N/A" si no hay información disponible

#### Páginas de Colectas Públicas

**Archivos:**

- `app/colectas/[id]/page.tsx`
- `app/colectas/[id]/aportes/page.tsx`
- `app/colectas/[id]/gastos/page.tsx`

Todas utilizan el patrón:

```typescript
{
  miembroNombre || miembro?.nombre || "N/A";
}
{
  quienPagoNombre || quienPago?.nombre || "N/A";
}
```

#### Página Demo

**Archivo: `app/detalle-demo/[id]/page.tsx`**

- Actualizada para usar el mismo patrón de nombres guardados

#### Página de Administración de Colecta

**Archivo: `app/admin/colectas/[id]/page.tsx`**

- Transformación de datos actualizada para usar nombres guardados
- Prioriza `miembroNombre` y `quienPagoNombre` sobre las relaciones

## Flujo de Eliminación

### Antes

1. Usuario intenta eliminar miembro
2. Sistema verifica si tiene gastos asociados
3. Si tiene gastos: **Error**, no se puede eliminar
4. Si no tiene gastos: Se elimina

### Ahora

1. Usuario intenta eliminar miembro
2. Sistema confirma la acción
3. Se elimina el miembro
4. Los registros de aportes/gastos mantienen el nombre guardado
5. Las relaciones (miembroId/quienPagoId) se vuelven `null`
6. La UI muestra el nombre guardado en el historial

## Migración de Datos Existentes

⚠️ **IMPORTANTE**: Después de aplicar estos cambios, será necesario crear una migración de Prisma:

```bash
npx prisma migrate dev --name add_nombre_fields_to_aportes_gastos
```

Los registros existentes tendrán `miembroNombre` y `quienPagoNombre` como `null`. Se recomienda ejecutar un script de migración de datos para poblar estos campos con los nombres actuales de los miembros relacionados.

## Ejemplo de Script de Migración (Opcional)

```typescript
// scripts/migrate-nombres.ts
import prisma from "@/lib/db";

async function migrarNombres() {
  // Migrar aportes
  const aportes = await prisma.aporte.findMany({
    where: { miembroNombre: null },
    include: { miembro: true },
  });

  for (const aporte of aportes) {
    if (aporte.miembro) {
      await prisma.aporte.update({
        where: { id: aporte.id },
        data: { miembroNombre: aporte.miembro.nombre },
      });
    }
  }

  // Migrar gastos
  const gastos = await prisma.gasto.findMany({
    where: { quienPagoNombre: null },
    include: { quienPago: true },
  });

  for (const gasto of gastos) {
    if (gasto.quienPago) {
      await prisma.gasto.update({
        where: { id: gasto.id },
        data: { quienPagoNombre: gasto.quienPago.nombre },
      });
    }
  }
}

migrarNombres();
```

## Ventajas de esta Implementación

✅ **Historial Completo**: Los registros financieros nunca pierden información  
✅ **Auditoría**: Se puede ver quién hizo cada transacción históricamente  
✅ **Flexibilidad**: Los administradores pueden eliminar miembros sin restricciones  
✅ **Integridad de Datos**: La información financiera se mantiene intacta  
✅ **Compatibilidad**: Funciona con registros nuevos y antiguos (con nombres nulos)

## Próximos Pasos

1. Aplicar la migración de Prisma
2. (Opcional) Ejecutar script de migración de datos
3. Probar la eliminación de miembros
4. Verificar que los reportes muestren correctamente los nombres guardados
