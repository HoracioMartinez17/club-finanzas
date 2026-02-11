import prisma from "./db";

/**
 * Registra una acción en el log de auditoría
 */
export async function createAuditLog({
  clubId,
  userId,
  userName,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
  userAgent,
}: {
  clubId: string;
  userId?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        clubId,
        userId,
        userName,
        action,
        entityType,
        entityId,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Error al crear audit log:", error);
    // No lanzar error para no interrumpir la operación principal
  }
}

/**
 * Verifica si un usuario es el último admin de un club
 */
export async function isLastAdmin(userId: string, clubId: string): Promise<boolean> {
  const adminCount = await prisma.user.count({
    where: {
      clubId,
      rol: "admin",
      activo: true,
      id: { not: userId },
    },
  });

  return adminCount === 0;
}

/**
 * Valida que se pueda eliminar un usuario
 * Previene la eliminación del último admin
 */
export async function canDeleteUser(
  userId: string,
  clubId: string,
): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { rol: true, activo: true, clubId: true },
  });

  if (!user) {
    return { allowed: false, reason: "Usuario no encontrado" };
  }

  if (user.clubId !== clubId) {
    return { allowed: false, reason: "Usuario no pertenece a este club" };
  }

  // Si es admin, verificar que no sea el último
  if (user.rol === "admin" && user.activo) {
    const lastAdmin = await isLastAdmin(userId, clubId);
    if (lastAdmin) {
      return {
        allowed: false,
        reason:
          "No puedes eliminar el último administrador del club. Crea otro administrador primero.",
      };
    }
  }

  return { allowed: true };
}

/**
 * Valida que se pueda cambiar el rol de un usuario
 * Previene quitar el rol admin al último admin
 */
export async function canChangeRole(
  userId: string,
  clubId: string,
  newRole: string,
): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { rol: true, activo: true, clubId: true },
  });

  if (!user) {
    return { allowed: false, reason: "Usuario no encontrado" };
  }

  if (user.clubId !== clubId) {
    return { allowed: false, reason: "Usuario no pertenece a este club" };
  }

  // Si el usuario actual es admin y se quiere cambiar a otro rol
  if (user.rol === "admin" && newRole !== "admin" && user.activo) {
    const lastAdmin = await isLastAdmin(userId, clubId);
    if (lastAdmin) {
      return {
        allowed: false,
        reason: "No puedes quitar el rol de administrador al último admin del club.",
      };
    }
  }

  return { allowed: true };
}

/**
 * Valida que se pueda desactivar un usuario
 */
export async function canDeactivateUser(
  userId: string,
  clubId: string,
): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { rol: true, activo: true, clubId: true },
  });

  if (!user) {
    return { allowed: false, reason: "Usuario no encontrado" };
  }

  if (!user.activo) {
    return { allowed: false, reason: "El usuario ya está desactivado" };
  }

  if (user.clubId !== clubId) {
    return { allowed: false, reason: "Usuario no pertenece a este club" };
  }

  // Si es admin activo, verificar que no sea el último
  if (user.rol === "admin") {
    const lastAdmin = await isLastAdmin(userId, clubId);
    if (lastAdmin) {
      return {
        allowed: false,
        reason: "No puedes desactivar al último administrador activo del club.",
      };
    }
  }

  return { allowed: true };
}

/**
 * Extrae la IP del request
 */
export function getIpFromRequest(request: Request): string | undefined {
  // Intentar obtener IP real detrás de proxies
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return undefined;
}

/**
 * Extrae el User-Agent del request
 */
export function getUserAgentFromRequest(request: Request): string | undefined {
  return request.headers.get("user-agent") || undefined;
}
