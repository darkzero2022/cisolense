import { doubleCsrf } from "csrf-csrf";
import type { Request } from "express";

const csrfSecret = process.env.CSRF_SECRET || process.env.JWT_ACCESS_SECRET || "csrf_dev_secret_change_me";

const getSessionIdentifier = (req: Request): string => {
  const refresh = req.cookies?.refresh_token as string | undefined;
  const access = req.cookies?.access_token as string | undefined;
  return refresh || access || req.ip || "anonymous";
};

const csrf = doubleCsrf({
  getSecret: () => csrfSecret,
  getSessionIdentifier,
  cookieName: process.env.NODE_ENV === "production" ? "__Host-psifi.x-csrf-token" : "x-csrf-token",
  cookieOptions: {
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  },
  getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"],
  skipCsrfProtection: (req) => {
    if (process.env.NODE_ENV === "test") return true;
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return true;
    const p = req.path;
    return p === "/api/auth/login" || p === "/api/auth/register" || p === "/api/auth/refresh";
  },
});

export const doubleCsrfProtection = csrf.doubleCsrfProtection;
export const generateCsrfToken = csrf.generateCsrfToken;
export const isInvalidCsrfError = (err: unknown): boolean => {
  const message = (err as { message?: string })?.message || "";
  return message.toLowerCase().includes("invalid csrf token");
};
