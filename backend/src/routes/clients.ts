import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// GET /api/clients — list all orgs for this vCISO
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const orgs = await prisma.clientOrg.findMany({
    where: { vcisoId: req.user!.userId, isActive: true },
    include: {
      orgFrameworks: { include: { framework: true } },
      _count: { select: { assessments: true, actions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ orgs });
});

// POST /api/clients
router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({
    name: z.string().min(1),
    shortCode: z.string().min(1).max(4).toUpperCase(),
    sector: z.string().min(1),
    country: z.string().optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().email().optional(),
    logoColor: z.string().optional(),
    frameworkIds: z.array(z.string()).optional(),
  });
  const r = schema.safeParse(req.body);
  if (!r.success) { res.status(400).json({ error: "Validation failed", issues: r.error.issues }); return; }
  const { frameworkIds, ...data } = r.data;
  const org = await prisma.clientOrg.create({
    data: {
      ...data,
      vcisoId: req.user!.userId,
      orgFrameworks: frameworkIds?.length
        ? { create: frameworkIds.map((fId) => ({ frameworkId: fId })) }
        : undefined,
    },
    include: { orgFrameworks: { include: { framework: true } } },
  });
  res.status(201).json({ org });
});

// GET /api/clients/:id
router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const org = await prisma.clientOrg.findFirst({
    where: { id: req.params.id, vcisoId: req.user!.userId },
    include: {
      orgFrameworks: { include: { framework: true } },
      assessments: { orderBy: { createdAt: "desc" }, take: 5, include: { framework: true, domainScores: true } },
      actions: { where: { status: { not: "DONE" } }, orderBy: { priority: "asc" }, take: 10 },
      _count: { select: { assessments: true, actions: true, evidenceFiles: true } },
    },
  });
  if (!org) { res.status(404).json({ error: "Client not found" }); return; }
  res.json({ org });
});

// PATCH /api/clients/:id
router.patch("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const r = z.object({
    name: z.string().min(1).optional(),
    shortCode: z.string().min(1).max(4).toUpperCase().optional(),
    sector: z.string().min(1).optional(),
    country: z.string().optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().email().optional(),
    logoColor: z.string().optional(),
  }).safeParse(req.body);
  if (!r.success) { res.status(400).json({ error: "Validation failed", issues: r.error.issues }); return; }
  const org = await prisma.clientOrg.findFirst({ where: { id: req.params.id, vcisoId: req.user!.userId } });
  if (!org) { res.status(404).json({ error: "Client not found" }); return; }
  const updated = await prisma.clientOrg.update({ where: { id: req.params.id }, data: r.data });
  res.json({ org: updated });
});

// DELETE /api/clients/:id (soft delete)
router.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const org = await prisma.clientOrg.findFirst({ where: { id: req.params.id, vcisoId: req.user!.userId } });
  if (!org) { res.status(404).json({ error: "Client not found" }); return; }
  await prisma.clientOrg.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ ok: true });
});

export default router;
