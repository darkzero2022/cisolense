import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../lib/jwt";
export interface AuthRequest extends Request { user?: TokenPayload; }

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.cookies?.access_token;
  if (!token) { res.status(401).json({ error: "Authentication required" }); return; }
  try { req.user = verifyAccessToken(token); next(); }
  catch { res.status(401).json({ error: "Invalid or expired token" }); }
};

export const requireRole = (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) { res.status(403).json({ error: "Insufficient permissions" }); return; }
    next();
  };
