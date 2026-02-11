# 🔒 Guía de Seguridad del Sistema

## ✅ Protecciones Implementadas

### 1. **Prevención de Eliminación del Último Admin**

```typescript
// No permite eliminar o desactivar el último admin activo de un club
await canDeleteUser(userId, clubId);
await canDeactivateUser(userId, clubId);
await canChangeRole(userId, clubId, newRole);
```

**Ubicación:** `lib/security.ts`

**Cómo funciona:**

- Antes de eliminar un usuario, verifica si es el último admin activo
- Antes de desactivar, verifica lo mismo
- Antes de cambiar rol de admin a otro, verifica que no sea el último
- **Error devuelto:** "No puedes eliminar el último administrador del club. Crea otro administrador primero."

### 2. **Registro de Auditoría (Audit Log)**

```typescript
await createAuditLog({
  clubId,
  userId,
  userName,
  action: 'USER_DELETE',
  entityType: 'User',
  entityId: id,
  details: { ... },
  ipAddress,
  userAgent,
});
```

**Ubicación:** `lib/security.ts`, tabla `audit_logs` en BD

**Acciones registradas:**

- ✅ `USER_DELETE` - Eliminación de usuarios
- ✅ `USER_CREATE` - Creación de usuarios
- ✅ `USER_UPDATE` - Actualización de datos (rol, estado)
- ✅ `PASSWORD_CHANGE` - Cambio de contraseña
- ✅ `ROLE_CHANGE` - Cambio de rol

**Información capturada:**

- Quién realizó la acción (userId, userName)
- Qué acción se realizó (action)
- Sobre qué entidad (entityType, entityId)
- Detalles adicionales (JSON con contexto)
- Desde dónde (IP, User-Agent)
- Cuándo (timestamp automático)

**Visualización:**

- Página: `/admin/audit-log`
- API: `GET /api/audit-log`
- Filtros por tipo de acción

### 3. **Validaciones de Seguridad en APIs**

**API de Usuarios (`/api/usuarios/[id]`)**

- ✅ PUT: Valida cambios de rol y estado
- ✅ DELETE: Valida que no sea el último admin
- ✅ Todas las operaciones quedan registradas en audit log

## 📋 Mejores Prácticas Implementadas

### Arquitectura de Seguridad en Capas

```
┌─────────────────────────────────────────┐
│  1. Validación en Frontend (UX)         │
│     - Deshabilitar botones               │
│     - Mostrar advertencias               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  2. Validación en Backend (Seguridad)   │
│     - canDeleteUser()                    │
│     - canDeactivateUser()                │
│     - canChangeRole()                    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  3. Registro de Auditoría (Trazabilidad)│
│     - createAuditLog()                   │
│     - IP, User-Agent, Details            │
└─────────────────────────────────────────┘
```

## 🚀 Recomendaciones Adicionales (No Implementadas)

### 1. **Autenticación de Dos Factores (2FA)**

```typescript
// Sugerencia de implementación
- Usar librería: @otplib/preset-default
- Generar QR con: qrcode
- Requerir 2FA para acciones críticas
```

**Beneficios:**

- Protección adicional contra robo de contraseñas
- Cumplimiento de estándares de seguridad
- Confianza de usuarios

### 2. **Verificación de Contraseña Actual**

```typescript
// Al cambiar contraseña, requerir la actual
const isValidPassword = await bcrypt.compare(currentPassword, user.password);
```

**Implementar en:**

- Cambio de contraseña
- Cambio de email
- Eliminación de cuenta

### 3. **Notificaciones por Email**

```typescript
// Alertar al usuario sobre acciones críticas
await sendEmail({
  to: user.email,
  subject: "🔐 Cambio de contraseña detectado",
  template: "password-change",
});
```

**Casos de uso:**

- Cambio de contraseña
- Cambio de email
- Nuevo inicio de sesión desde IP desconocida
- Cambio de rol
- Usuario eliminado

### 4. **Cooldown Period (Período de Espera)**

```typescript
// No permitir eliminación inmediata
const scheduleDeletion(userId: string, deleteAt: Date) {
  // Marcar para eliminar en 24h
  // Usuario recibe email con link de cancelación
}
```

**Beneficios:**

- Tiempo para revertir errores
- Prevenir eliminaciones impulsivas
- Detectar accesos no autorizados

### 5. **Rate Limiting (Límite de Intentos)**

```typescript
// Limitar intentos de login
const maxAttempts = 5;
const lockDuration = 15 * 60 * 1000; // 15 minutos
```

**Implementar en:**

- Login (prevenir brute force)
- Recuperación de contraseña
- API de cambio de contraseña

### 6. **Tokens de Recuperación**

```typescript
// Sistema de recuperación de cuenta
const recoveryToken = crypto.randomBytes(32).toString("hex");
await sendEmail({
  to: user.email,
  link: `/recover/${recoveryToken}`,
});
```

**Casos de uso:**

- Olvido de contraseña
- Cuenta bloqueada
- Email comprometido

### 7. **Sesiones y JWT Mejorados**

```typescript
// Tokens con expiración corta + refresh tokens
const accessToken = jwt.sign(payload, secret, { expiresIn: "15m" });
const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: "7d" });
```

**Beneficios:**

- Tokens de corta duración (más seguro)
- Refresh tokens para renovar sesión
- Revocación de sesiones activas

### 8. **Roles y Permisos Granulares**

```typescript
// Sistema RBAC (Role-Based Access Control)
const permissions = {
  admin: ["*"],
  tesorero: ["read:finanzas", "write:gastos"],
  visualizador: ["read:*"],
};
```

**Estructura sugerida:**

- Super Admin (gestiona clubes)
- Club Admin (control total del club)
- Tesorero (finanzas)
- Secretario (miembros, actas)
- Visualizador (solo lectura)

## 🔍 Cómo Detectar Accesos No Autorizados

### Señales de Alerta en Audit Log:

1. **Múltiples cambios de contraseña en corto tiempo**

   ```sql
   SELECT * FROM audit_logs
   WHERE action = 'PASSWORD_CHANGE'
   AND createdAt > NOW() - INTERVAL '1 hour'
   GROUP BY userId
   HAVING COUNT(*) > 3
   ```

2. **Eliminaciones masivas**

   ```sql
   SELECT * FROM audit_logs
   WHERE action = 'USER_DELETE'
   AND createdAt > NOW() - INTERVAL '10 minutes'
   GROUP BY userId
   HAVING COUNT(*) > 2
   ```

3. **Accesos desde IPs sospechosas**

   ```sql
   SELECT * FROM audit_logs
   WHERE ipAddress NOT IN (SELECT DISTINCT ipAddress FROM audit_logs WHERE createdAt < NOW() - INTERVAL '30 days')
   ```

4. **Cambios de rol inesperados**
   ```sql
   SELECT * FROM audit_logs
   WHERE action = 'ROLE_CHANGE'
   ORDER BY createdAt DESC
   ```

## 📊 Dashboard de Seguridad (Sugerencia)

Crear página `/admin/security` con:

```
┌─────────────────────────────────────────┐
│  🔐 Estado de Seguridad del Club        │
├─────────────────────────────────────────┤
│  ✅ 3 Administradores activos           │
│  ⚠️  2FA no habilitado                   │
│  ✅ Última auditoría: hace 2 minutos    │
│  ⚠️  2 usuarios sin actividad (30 días)  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📈 Actividad Reciente (últimas 24h)    │
├─────────────────────────────────────────┤
│  12 inicios de sesión                   │
│  3 cambios de contraseña                │
│  0 usuarios eliminados                  │
│  5 cambios de rol                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🚨 Alertas de Seguridad                │
├─────────────────────────────────────────┤
│  ⚠️  Usuario "Juan" intentó eliminar    │
│     al último admin (bloqueado)         │
│  ✅ Sin alertas adicionales             │
└─────────────────────────────────────────┘
```

## 🎯 Plan de Implementación Progresiva

### Fase 1: ✅ Completada

- ✅ Prevención de eliminación del último admin
- ✅ Registro de auditoría básico
- ✅ Validaciones en APIs

### Fase 2: Seguridad Intermedia (Recomendado)

- 🔲 Verificación de contraseña actual para cambios
- 🔲 Notificaciones por email
- 🔲 Rate limiting en login

### Fase 3: Seguridad Avanzada

- 🔲 2FA obligatorio para admins
- 🔲 Cooldown period para eliminaciones
- 🔲 Dashboard de seguridad
- 🔲 Sistema de recuperación robusto

### Fase 4: Enterprise

- 🔲 SSO (Single Sign-On)
- 🔲 RBAC granular
- 🔲 Compliance reporting
- 🔲 Penetration testing

## 💡 Tips de Seguridad para Administradores

1. **Nunca compartas tu contraseña**
2. **Usa contraseñas únicas y fuertes** (mínimo 12 caracteres)
3. **Crea múltiples administradores** (mínimo 2-3)
4. **Revisa el audit log regularmente** (semanalmente)
5. **Desactiva usuarios inactivos** (no los elimines de inmediato)
6. **Mantén actualizados los emails de contacto**
7. **Documenta cambios importantes** (usa el campo "notas")

## 🆘 Qué Hacer si Detectas un Hackeo

### Respuesta Inmediata:

1. **Cambiar todas las contraseñas de administradores**
2. **Revisar audit log para identificar acciones sospechosas**
3. **Desactivar usuarios comprometidos**
4. **Crear nuevo administrador con contraseña fuerte**
5. **Revisar cambios en configuración del club**

### Investigación:

1. **Analizar IPs en audit log**
2. **Verificar cambios de email y contactos**
3. **Revisar eliminaciones recientes**
4. **Comprobar modificaciones en datos financieros**

### Prevención Futura:

1. **Implementar 2FA**
2. **Establecer política de contraseñas fuertes**
3. **Capacitar a usuarios sobre seguridad**
4. **Auditorías de seguridad periódicas**

---

**Última actualización:** 11 de febrero de 2026  
**Versión:** 1.0  
**Estado:** Protecciones básicas implementadas ✅
