import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña requeridos" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        nombre: true,
        password: true,
        rol: true,
        activo: true,
        isSuperAdmin: true,
        clubId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    if (!user.activo) {
      return NextResponse.json({ error: "Usuario inactivo" }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      rol: user.rol,
      isSuperAdmin: user.isSuperAdmin,
      clubId: user.clubId,
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        isSuperAdmin: user.isSuperAdmin,
        clubId: user.clubId,
      },
    });

    const cookieName = user.isSuperAdmin
      ? "token_superadmin"
      : user.clubId
        ? `token_admin_${user.clubId}`
        : "token_admin";

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    // Limpiar cookie legacy si existe
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
