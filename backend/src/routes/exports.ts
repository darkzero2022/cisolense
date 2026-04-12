import { Router, Response } from "express";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { generateReportPdf, ReportData } from "../services/pdf";

const router = Router();
router.use(requireAuth);

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "reports");

router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const r = z.object({ assessmentId: z.string() }).safeParse(req.body);
  if (!r.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const assessment = await prisma.assessment.findFirst({
    where: {
      id: r.data.assessmentId,
      clientOrg: { vcisoId: req.user!.userId },
    },
    include: {
      clientOrg: true,
      framework: true,
      domainScores: true,
      answers: { include: { control: true } },
      actions: true,
    },
  });

  if (!assessment) { res.status(404).json({ error: "Assessment not found" }); return; }

  const job = await prisma.exportJob.create({
    data: {
      clientOrgId: assessment.clientOrgId,
      assessmentId: assessment.id,
      type: "PDF",
      status: "PENDING",
      createdById: req.user!.userId,
    },
  });

  const data: ReportData = {
    clientOrg: {
      name: assessment.clientOrg.name,
      sector: assessment.clientOrg.sector,
      country: assessment.clientOrg.country,
    },
    framework: {
      name: assessment.framework.name,
      shortName: assessment.framework.shortName,
    },
    overallScore: assessment.overallScore ?? 0,
    aiSummary: assessment.aiSummary,
    completedAt: assessment.completedAt?.toISOString() ?? null,
    createdAt: assessment.createdAt.toISOString(),
    domainScores: assessment.domainScores.map((d) => ({
      domainCode: d.domainCode,
      domainName: d.domainName,
      score: d.score,
      aiAnalysis: d.aiAnalysis,
    })),
    answers: assessment.answers.map((a) => ({
      controlId: a.control.controlId,
      value: a.value,
    })),
    actions: assessment.actions.map((a) => ({
      title: a.title,
      priority: a.priority,
      effort: a.effort,
      impact: a.impact,
      status: a.status,
      isCritical: a.isCritical,
    })),
  };

  const fileName = `report_${assessment.clientOrg.shortCode.toLowerCase()}_${assessment.framework.shortName.replace(/[^a-z0-9]/gi, "")}_${assessment.id}.pdf`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  try {
    await generateReportPdf(data, filePath);
    await prisma.exportJob.update({
      where: { id: job.id },
      data: { status: "COMPLETE", filePath, completedAt: new Date() },
    });
    res.status(200).json({ jobId: job.id, status: "COMPLETE", fileName });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "PDF generation failed";
    await prisma.exportJob.update({
      where: { id: job.id },
      data: { status: "FAILED", error: errorMessage, completedAt: new Date() },
    });
    res.status(500).json({ error: errorMessage });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const job = await prisma.exportJob.findFirst({
    where: { id: req.params.id, createdById: req.user!.userId },
  });

  if (!job) { res.status(404).json({ error: "Export job not found" }); return; }

  if (job.status === "COMPLETE" && job.filePath) {
    if (!fs.existsSync(job.filePath)) {
      res.status(404).json({ error: "File not found" });
      return;
    }
    res.download(job.filePath);
    return;
  }

  res.json({ id: job.id, status: job.status, error: job.error });
});

export default router;
