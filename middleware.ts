// Middleware para proteger rutas de admin
import { NextRequest, NextResponse } from "next/server";

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  // Permitir acceso a login sin protección
  if (request.nextUrl.pathname === "/login") {
    return NextResponse.next();
  }

  // Proteger rutas de admin
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const cookieToken = request.cookies.get("token")?.value;
    const adminToken = request.cookies.get("token_admin")?.value;
    const adminScopedToken = request.cookies
      .getAll()
      .find((cookie) => cookie.name.startsWith("token_admin_"))?.value;
    const token = adminToken || adminScopedToken || cookieToken;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const payload = parseJwt(token);

      if (!payload) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      // Verificar si el usuario tiene rol de admin
      if (payload.rol !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Verificar expiración del token
      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000);
        if (expDate < new Date()) {
          return NextResponse.redirect(new URL("/login", request.url));
        }
      }
    } catch (error) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
