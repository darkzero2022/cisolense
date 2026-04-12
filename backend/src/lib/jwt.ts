import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_in_prod";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_in_prod";
export interface TokenPayload { userId: string; email: string; role: string; }
export const signAccessToken = (p: TokenPayload) => jwt.sign(p, ACCESS_SECRET, { expiresIn: "15m" });
export const signRefreshToken = (p: TokenPayload) => jwt.sign(p, REFRESH_SECRET, { expiresIn: "7d", jwtid: randomUUID() });
export const verifyAccessToken = (t: string) => jwt.verify(t, ACCESS_SECRET) as TokenPayload;
export const verifyRefreshToken = (t: string) => jwt.verify(t, REFRESH_SECRET) as TokenPayload;
