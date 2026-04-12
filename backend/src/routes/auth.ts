import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { generateCsrfToken } from "../lib/csrf";

const router = Router();
const OPTS = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/" };

router.get("/csrf", (req: Request, res: Response): void => {
  const csrfToken = generateCsrfToken(req, res);
  res.json({ csrfToken });
});

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const r = z.object({ email: z.string().email(), password: z.string().min(8), firstName: z.string().min(1), lastName: z.string().min(1) }).safeParse(req.body);
  if (!r.success) { res.status(400).json({ error: "Validation failed" }); return; }
  const { email, password, firstName, lastName } = r.data;
  if (await prisma.user.findUnique({ where: { email } })) { res.status(409).json({ error: "Email already registered" }); return; }
  const user = await prisma.user.create({ data: { email, passwordHash: await bcrypt.hash(password, 12), firstName, lastName } });
  const p = { userId: user.id, email: user.email, role: user.role };
  const [at, rt] = [signAccessToken(p), signRefreshToken(p)];
  await prisma.refreshToken.create({ data: { token: rt, userId: user.id, expiresAt: new Date(Date.now() + 7*86400000) } });
  res.cookie("access_token", at, { ...OPTS, maxAge: 900000 }).cookie("refresh_token", rt, { ...OPTS, maxAge: 604800000 });
  res.status(201).json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const r = z.object({ email: z.string().email(), password: z.string() }).safeParse(req.body);
  if (!r.success) { res.status(400).json({ error: "Invalid credentials" }); return; }
  const user = await prisma.user.findUnique({ where: { email: r.data.email } });
  if (!user || !user.isActive || !(await bcrypt.compare(r.data.password, user.passwordHash))) { res.status(401).json({ error: "Invalid email or password" }); return; }
  const p = { userId: user.id, email: user.email, role: user.role };
  const [at, rt] = [signAccessToken(p), signRefreshToken(p)];
  await prisma.refreshToken.create({ data: { token: rt, userId: user.id, expiresAt: new Date(Date.now() + 7*86400000) } });
  res.cookie("access_token", at, { ...OPTS, maxAge: 900000 }).cookie("refresh_token", rt, { ...OPTS, maxAge: 604800000 });
  res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
});

router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refresh_token;
  if (!token) { res.status(401).json({ error: "No refresh token" }); return; }
  try {
    const p = verifyRefreshToken(token);
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) { res.status(401).json({ error: "Token invalid" }); return; }
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const np = { userId: p.userId, email: p.email, role: p.role };
    const [at, rt] = [signAccessToken(np), signRefreshToken(np)];
    await prisma.refreshToken.create({ data: { token: rt, userId: p.userId, expiresAt: new Date(Date.now() + 7*86400000) } });
    res.cookie("access_token", at, { ...OPTS, maxAge: 900000 }).cookie("refresh_token", rt, { ...OPTS, maxAge: 604800000 });
    res.json({ ok: true });
  } catch { res.status(401).json({ error: "Invalid refresh token" }); }
});

router.post("/logout", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const token = req.cookies?.refresh_token;
  if (token) await prisma.refreshToken.updateMany({ where: { token, revokedAt: null }, data: { revokedAt: new Date() } });
  res.clearCookie("access_token").clearCookie("refresh_token").json({ ok: true });
});

router.get("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { id: true, email: true, firstName: true, lastName: true, role: true } });
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ user });
});

export default router;
