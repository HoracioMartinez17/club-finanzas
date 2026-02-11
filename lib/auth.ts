import jwt, { SignOptions } from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET =
  process.env.JWT_SECRET || "tu-secreto-super-seguro-cambiar-en-produccion";

export function verifyAuth(token: string) {
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    return verified as any;
  } catch (err) {
    return null;
  }
}

export function signToken(payload: string | object | Buffer, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn,
  } as jwt.SignOptions);
}

export function parseJwt(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  } catch {
    return null;
  }
}

export function getAuthPayload(req: NextRequest) {
  const headerToken = req.headers.get("authorization")?.replace("Bearer ", "");
  const cookieToken = req.cookies.get("token")?.value;
  const adminToken = req.cookies.get("token_admin")?.value;
  const superToken = req.cookies.get("token_superadmin")?.value;
  const adminScopedToken = req.cookies
    .getAll()
    .find((cookie) => cookie.name.startsWith("token_admin_"))?.value;
  const token =
    headerToken || adminToken || adminScopedToken || superToken || cookieToken;

  if (!token) {
    return null;
  }

  return verifyAuth(token);
}
