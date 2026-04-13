import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// ── GET / — list frameworks visible to this user ────────────────────────────
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const frameworks = await prisma.framework.findMany({
    where: {
      isActive: true,
      OR: [
        { isCustom: false },
        { isCustom: true, ownerId: req.user!.userId },
      ],
    },
    orderBy: { name: "asc" },
  });
  res.json({ frameworks });
});

// ── GET /:id/questions — full framework tree ────────────────────────────────
router.get("/:id/questions", async (req: AuthRequest, res: Response): Promise<void> => {
  const fw = await prisma.framework.findFirst({
    where: {
      id: req.params.id,
      OR: [{ isCustom: false }, { isCustom: true, ownerId: req.user!.userId }],
    },
    include: {
      domains: {
        orderBy: { order: "asc" },
        include: {
          controls: {
            orderBy: { order: "asc" },
            include: { questions: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });
  if (!fw) { res.status(404).json({ error: "Framework not found" }); return; }
  res.json({ framework: fw });
});

// ── POST / — create custom framework ───────────────────────────────────────
const createFrameworkSchema = z.object({
  name:        z.string().min(2).max(120),
  shortName:   z.string().min(1).max(20),
  version:     z.string().min(1).max(20).default("1.0"),
  region:      z.string().max(60).default("Global"),
  description: z.string().max(500).default(""),
});

router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const r = createFrameworkSchema.safeParse(req.body);
  if (!r.success) { res.status(400).json({ error: r.error.flatten() }); return; }

  const slug = `custom-${r.data.shortName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;

  const framework = await prisma.framework.create({
    data: { ...r.data, slug, isCustom: true, ownerId: req.user!.userId },
  });
  res.status(201).json({ framework });
});

// ── PATCH /:id — update custom framework metadata ──────────────────────────
router.patch("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const fw = await prisma.framework.findFirst({ where: { id: req.params.id, ownerId: req.user!.userId } });
  if (!fw) { res.status(404).json({ error: "Framework not found" }); return; }

  const r = createFrameworkSchema.partial().safeParse(req.body);
  if (!r.success) { res.status(400).json({ error: r.error.flatten() }); return; }

  const updated = await prisma.framework.update({ where: { id: req.params.id }, data: r.data });
  res.json({ framework: updated });
});

// ── DELETE /:id — delete custom framework (no active assessments) ───────────
router.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const fw = await prisma.framework.findFirst({ where: { id: req.params.id, ownerId: req.user!.userId } });
  if (!fw) { res.status(404).json({ error: "Framework not found" }); return; }

  const active = await prisma.assessment.count({
    where: { frameworkId: req.params.id, status: { in: ["IN_PROGRESS", "COMPLETE"] } },
  });
  if (active > 0) { res.status(409).json({ error: "Cannot delete — framework has active assessments" }); return; }

  await prisma.framework.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ── POST /:id/domains — add domain ──────────────────────────────────────────
const domainSchema = z.object({
  code:  z.string().min(1).max(20),
  name:  z.string().min(1).max(120),
  order: z.number().int().min(1).default(1),
});

router.post("/:id/domains", async (req: AuthRequest, res: Response): Promise<void> => {
  const fw = await prisma.framework.findFirst({ where: { id: req.params.id, ownerId: req.user!.userId } });
  if (!fw) { res.status(404).json({ error: "Framework not found" }); return; }

  const r = domainSchema.safeParse(req.body);
  if (!r.success) { res.status(400).json({ error: r.error.flatten() }); return; }

  const domain = await prisma.domain.create({ data: { ...r.data, frameworkId: req.params.id } });
  res.status(201).json({ domain });
});

// ── PATCH /:fid/domains/:did — update domain ────────────────────────────────
router.patch("/:fid/domains/:did", async (req: AuthRequest, res: Response): Promise<void> => {
  const fw = await prisma.framework.findFirst({ where: { id: req.params.fid, ownerId: req.user!.userId } });
  if (!fw) { res.status(404).json({ error: "Framework not found" }); return; }

  const r = domainSchema.partial().safeParse(req.body);
  if (!r.success) { res.status(400).json({ error: r.error.flatten() }); return; }

  const domain = await prisma.domain.update({ where: { id: req.params.did }, data: r.data });
  res.json({ domain });
});

// ── DELETE /:fid/domains/:did ────────────────────────────────────────────────
router.delete("/:fid/domains/:did", async (req: AuthRequest, res: Response): Promise<void> => {
  const fw = await prisma.framework.findFirst({ where: { id: req.params.fid, ownerId: req.user!.userId } });
  if (!fw) { res.status(404).json({ error: "Framework not found" }); return; }

  await prisma.domain.delete({ where: { id: req.params.did } });
  res.status(204).send();
});

// ── POST /:fid/domains/:did/controls — add control + question ───────────────
const controlSchema = z.object({
  controlId:   z.string().min(1).max(40),
  title:       z.string().min(1).max(200),
  description: z.string().max(500).default(""),
  order:       z.number().int().min(1).default(1),
  question:    z.string().min(1).max(500),
  helpText:    z.string().max(500).default(""),
});

router.post("/:fid/domains/:did/controls", async (req: AuthRequest, res: Response): Promise<void> => {
  const fw = await prisma.framework.findFirst({ where: { id: req.params.fid, ownerId: req.user!.userId } });
  if (!fw) { res.status(404).json({ error: "Framework not found" }); return; }

  const r = controlSchema.safeParse(req.body);
  if (!r.success) { res.status(400).json({ error: r.error.flatten() }); return; }

  const { question, helpText, ...controlData } = r.data;
  const control = await prisma.control.create({
    data: {
      ...controlData,
      domainId: req.params.did,
      questions: {
        create: [{
          order: 1,
          text: question,
          helpText,
          options: JSON.stringify([
            { value: 3, label: "Fully implemented and regularly reviewed" },
            { value: 2, label: "Partially implemented with gaps" },
            { value: 1, label: "Ad-hoc or inconsistently applied" },
            { value: 0, label: "Not implemented" },
          ]),
        }],
      },
    },
    include: { questions: true },
  });
  res.status(201).json({ control });
});

// ── PATCH /:fid/domains/:did/controls/:cid ───────────────────────────────────
router.patch("/:fid/domains/:did/controls/:cid", async (req: AuthRequest, res: Response): Promise<void> => {
  const fw = await prisma.framework.findFirst({ where: { id: req.params.fid, ownerId: req.user!.userId } });
  if (!fw) { res.status(404).json({ error: "Framework not found" }); return; }

  const r = controlSchema.partial().safeParse(req.body);
  if (!r.success) { res.status(400).json({ error: r.error.flatten() }); return; }

  const { question, helpText, ...controlData } = r.data;
  const control = await prisma.control.update({ where: { id: req.params.cid }, data: controlData });

  if (question) {
    const existing = await prisma.question.findFirst({
      where: { controlId: req.params.cid },
      orderBy: { order: "asc" },
    });
    if (existing) {
      await prisma.question.update({
        where: { id: existing.id },
        data: { text: question, helpText: helpText ?? existing.helpText },
      });
    }
  }
  res.json({ control });
});

// ── DELETE /:fid/domains/:did/controls/:cid ──────────────────────────────────
router.delete("/:fid/domains/:did/controls/:cid", async (req: AuthRequest, res: Response): Promise<void> => {
  const fw = await prisma.framework.findFirst({ where: { id: req.params.fid, ownerId: req.user!.userId } });
  if (!fw) { res.status(404).json({ error: "Framework not found" }); return; }

  await prisma.control.delete({ where: { id: req.params.cid } });
  res.status(204).send();
});

export default router;
