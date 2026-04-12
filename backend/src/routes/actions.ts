import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { clientOrgId, status } = req.query;
  const where: Record<string, unknown> = { clientOrg: { vcisoId: req.user!.userId } };
  if (clientOrgId) where.clientOrgId = clientOrgId;
  if (status) where.status = status;
  const actions = await prisma.action.findMany({ where, orderBy: [{ priority: "asc" }, { createdAt: "desc" }] });
  res.json({ actions });
});

router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const r = z.object({
    clientOrgId: z.string(), title: z.string().min(1), description: z.string().optional(),
    frameworkRef: z.string().optional(), effort: z.enum(["LOW","MEDIUM","HIGH"]).default("MEDIUM"),
    impact: z.enum(["LOW","MEDIUM","HIGH"]).default("MEDIUM"), isCritical: z.boolean().default(false),
    dueDate: z.string().datetime().optional(), assignedTo: z.string().optional(),
  }).safeParse(req.body);
  if (!r.success) { res.status(400).json({ error: "Validation failed" }); return; }
  const org = await prisma.clientOrg.findFirst({ where: { id: r.data.clientOrgId, vcisoId: req.user!.userId } });
  if (!org) { res.status(403).json({ error: "Access denied" }); return; }
  const action = await prisma.action.create({ data: { ...r.data, dueDate: r.data.dueDate ? new Date(r.data.dueDate) : undefined } });
  res.status(201).json({ action });
});

router.patch("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const r = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    frameworkRef: z.string().optional(),
    effort: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    impact: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    isCritical: z.boolean().optional(),
    dueDate: z.string().datetime().optional(),
    assignedTo: z.string().optional(),
  }).safeParse(req.body);
  if (!r.success) { res.status(400).json({ error: "Validation failed" }); return; }
  const action = await prisma.action.findFirst({ where: { id: req.params.id, clientOrg: { vcisoId: req.user!.userId } } });
  if (!action) { res.status(404).json({ error: "Action not found" }); return; }
  const updated = await prisma.action.update({ where: { id: req.params.id }, data: { ...r.data, dueDate: r.data.dueDate ? new Date(r.data.dueDate) : undefined } });
  res.json({ action: updated });
});

router.patch("/:id/status", async (req: AuthRequest, res: Response): Promise<void> => {
  const r = z.object({ status: z.enum(["TODO","IN_PROGRESS","DONE","WONT_FIX"]) }).safeParse(req.body);
  if (!r.success) { res.status(400).json({ error: "Invalid status" }); return; }
  const action = await prisma.action.findFirst({ where: { id: req.params.id, clientOrg: { vcisoId: req.user!.userId } } });
  if (!action) { res.status(404).json({ error: "Action not found" }); return; }
  const updated = await prisma.action.update({ where: { id: req.params.id }, data: { status: r.data.status } });
  res.json({ action: updated });
});

router.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const action = await prisma.action.findFirst({ where: { id: req.params.id, clientOrg: { vcisoId: req.user!.userId } } });
  if (!action) { res.status(404).json({ error: "Action not found" }); return; }
  await prisma.action.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
