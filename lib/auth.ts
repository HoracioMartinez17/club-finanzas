import jwt, { SignOptions } from "jsonwebtoken";

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
