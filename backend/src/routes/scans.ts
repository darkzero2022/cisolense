import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { computePriority } from "../services/scoring";
import { FINDING_TO_CONTROLS, runNetworkScan } from "../services/scanner";

const router = Router();
router.use(requireAuth);

const ipv4Regex = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const cidrRegex = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}\/(3[0-2]|[12]?\d)$/;
const hostnameRegex = /^(?=.{1,253}$)(?!-)[A-Za-z0-9.-]+(?<!-)$/;
const isValidScanTarget = (value: string): boolean => ipv4Regex.test(value) || cidrRegex.test(value) || hostnameRegex.test(value);

let workerRunning = false;

const executeScan = async (scanId: string): Promise<void> => {
  const scan = await prisma.scan.findUnique({ where: { id: scanId } });
  if (!scan) return;

  try {
    const findings = await runNetworkScan(scan.target, scan.scanType as "basic" | "full");

    await prisma.scanFinding.createMany({
      data: findings.map((f) => ({
        scanId: scan.id,
        key: f.key,
        severity: f.severity,
        details: f.details,
        controls: JSON.stringify(FINDING_TO_CONTROLS[f.key] || []),
      })),
    });

    const actionData = findings
      .filter((f) => f.severity === "HIGH")
      .flatMap((f) => (FINDING_TO_CONTROLS[f.key] || []).map((control) => ({
        clientOrgId: scan.clientOrgId,
        title: `Scanner finding remediation: ${f.key}`,
        description: f.details,
        frameworkRef: control,
        effort: "MEDIUM",
        impact: "HIGH",
        priority: computePriority("MEDIUM", "HIGH"),
        isCritical: true,
        status: "TODO",
      })));

    if (actionData.length) {
      await prisma.action.createMany({ data: actionData });
    }

    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: "COMPLETE",
        summary: `${findings.length} findings generated for target ${scan.target}`,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: "FAILED",
        summary: error instanceof Error ? error.message : "Scan failed",
        completedAt: new Date(),
      },
    });
  }
};

const processQueue = async (): Promise<void> => {
  if (workerRunning) return;
  workerRunning = true;

  try {
    while (true) {
      const next = await prisma.scan.findFirst({
        where: { status: "QUEUED" },
        orderBy: { createdAt: "asc" },
      });

      if (!next) break;

      const claimed = await prisma.scan.updateMany({
        where: { id: next.id, status: "QUEUED" },
        data: { status: "RUNNING" },
      });

      if (claimed.count === 0) continue;
      await executeScan(next.id);
    }
  } finally {
    workerRunning = false;
  }
};

router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const r = z.object({
    clientOrgId: z.string(),
    target: z.string().min(3).refine((v) => isValidScanTarget(v), "Invalid target format"),
    scanType: z.enum(["basic", "full"]).default("basic"),
  }).safeParse(req.body);

  if (!r.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const org = await prisma.clientOrg.findFirst({ where: { id: r.data.clientOrgId, vcisoId: req.user!.userId } });
  if (!org) { res.status(404).json({ error: "Client not found" }); return; }

  const duplicate = await prisma.scan.findFirst({
    where: {
      clientOrgId: r.data.clientOrgId,
      target: r.data.target,
      status: { in: ["QUEUED", "RUNNING"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (duplicate) {
    res.status(409).json({ error: "A scan for this target is already queued/running", scan: duplicate });
    return;
  }

  const scan = await prisma.scan.create({
    data: {
      clientOrgId: r.data.clientOrgId,
      target: r.data.target,
      scanType: r.data.scanType,
      status: "QUEUED",
    },
  });

  res.status(202).json({ scan });

  void processQueue();
});

router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const clientOrgId = String(req.query.clientOrgId || "");
  const where: Record<string, unknown> = { clientOrg: { vcisoId: req.user!.userId } };
  if (clientOrgId) where.clientOrgId = clientOrgId;

  const scans = await prisma.scan.findMany({ where, orderBy: { createdAt: "desc" } });
  res.json({ scans });
});

router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const scan = await prisma.scan.findFirst({
    where: { id: req.params.id, clientOrg: { vcisoId: req.user!.userId } },
    include: { findings: true },
  });

  if (!scan) { res.status(404).json({ error: "Scan not found" }); return; }
  res.json({ scan });
});

export default router;
