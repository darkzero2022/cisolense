import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/gap-analysis", async (req: AuthRequest, res: Response): Promise<void> => {
  const clientOrgId = String(req.query.clientOrgId || "");
  if (!clientOrgId) { res.status(400).json({ error: "clientOrgId is required" }); return; }

  const assessment = await prisma.assessment.findFirst({
    where: { clientOrgId, status: "COMPLETE", clientOrg: { vcisoId: req.user!.userId } },
    orderBy: { completedAt: "desc" },
    include: {
      answers: { include: { control: true } },
      actions: true,
    },
  });

  if (!assessment) { res.json({ items: [] }); return; }

  const items = assessment.answers
    .filter((a) => a.value < 2)
    .map((a) => ({
      controlId: a.control.controlId,
      title: a.control.title,
      value: a.value,
      actionCount: assessment.actions.filter((x) => x.frameworkRef === a.control.controlId && x.status !== "DONE").length,
    }))
    .sort((a, b) => a.value - b.value || b.actionCount - a.actionCount);

  res.json({ items });
});

router.get("/compliance-matrix", async (req: AuthRequest, res: Response): Promise<void> => {
  const clientOrgId = String(req.query.clientOrgId || "");
  if (!clientOrgId) { res.status(400).json({ error: "clientOrgId is required" }); return; }

  const assessments = await prisma.assessment.findMany({
    where: { clientOrgId, status: "COMPLETE", clientOrg: { vcisoId: req.user!.userId } },
    orderBy: { completedAt: "asc" },
    include: { domainScores: true, framework: true },
  });

  const matrix = assessments.map((a) => ({
    assessmentId: a.id,
    framework: a.framework.shortName,
    completedAt: a.completedAt,
    overallScore: a.overallScore,
    domainScores: a.domainScores.map((d) => ({ code: d.domainCode, name: d.domainName, score: d.score })),
  }));

  res.json({ matrix });
});

router.get("/evidence-coverage", async (req: AuthRequest, res: Response): Promise<void> => {
  const clientOrgId = String(req.query.clientOrgId || "");
  if (!clientOrgId) { res.status(400).json({ error: "clientOrgId is required" }); return; }

  const org = await prisma.clientOrg.findFirst({
    where: { id: clientOrgId, vcisoId: req.user!.userId },
    include: { orgFrameworks: { include: { framework: { include: { domains: { include: { controls: true } } } } } } },
  });

  if (!org) { res.status(404).json({ error: "Client not found" }); return; }

  const accepted = await prisma.evidenceFile.findMany({
    where: { clientOrgId, status: "ACCEPTED", deletedAt: null, controlRef: { not: null } },
    select: { controlRef: true },
  });
  const acceptedSet = new Set(
    accepted
      .map((f) => f.controlRef)
      .filter((v): v is string => Boolean(v))
      .map((v) => v.trim().toUpperCase())
  );

  const controls = org.orgFrameworks.flatMap((of) => of.framework.domains.flatMap((d) => d.controls.map((c) => ({ domainCode: d.code, controlId: c.controlId }))));
  const grouped = new Map<string, { total: number; covered: number }>();

  for (const c of controls) {
    const current = grouped.get(c.domainCode) || { total: 0, covered: 0 };
    current.total += 1;
    if (acceptedSet.has(c.controlId.trim().toUpperCase())) current.covered += 1;
    grouped.set(c.domainCode, current);
  }

  const coverage = Array.from(grouped.entries()).map(([domainCode, v]) => ({
    domainCode,
    totalControls: v.total,
    coveredControls: v.covered,
    percent: v.total ? Math.round((v.covered / v.total) * 100) : 0,
  }));

  res.json({ coverage });
});

router.get("/executive-summary/:assessmentId", async (req: AuthRequest, res: Response): Promise<void> => {
  const assessment = await prisma.assessment.findFirst({
    where: { id: req.params.assessmentId, clientOrg: { vcisoId: req.user!.userId } },
    include: { domainScores: true, actions: true, clientOrg: { select: { name: true } }, framework: true },
  });

  if (!assessment) { res.status(404).json({ error: "Assessment not found" }); return; }

  res.json({
    assessmentId: assessment.id,
    client: assessment.clientOrg.name,
    framework: assessment.framework.shortName,
    overallScore: assessment.overallScore,
    aiSummary: assessment.aiSummary,
    domainScores: assessment.domainScores,
    actionSummary: {
      total: assessment.actions.length,
      critical: assessment.actions.filter((a) => a.isCritical).length,
      open: assessment.actions.filter((a) => a.status === "TODO" || a.status === "IN_PROGRESS").length,
    },
  });
});

export default router;
