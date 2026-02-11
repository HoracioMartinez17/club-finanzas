import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const clubId = searchParams.get("clubId");
  const response = NextResponse.json({
    success: true,
    message: "Sesión cerrada exitosamente",
  });

  const adminCookies = req.cookies
    .getAll()
    .map((cookie) => cookie.name)
    .filter((name) => name.startsWith("token_admin_"));

  const cookiesToClear =
    role === "superadmin"
      ? ["token_superadmin"]
      : role === "admin"
        ? [clubId ? `token_admin_${clubId}` : "", "token_admin", ...adminCookies].filter(
            Boolean,
          )
        : ["token_admin", "token_superadmin", "token", ...adminCookies];

  cookiesToClear.forEach((cookieName) => {
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
    });
  });

  return response;
}
