import path from "path";
import fs from "fs";
import { Router, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

// ── Multer setup ──────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png", "image/jpeg", "image/gif", "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "text/csv",
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error("File type not allowed"));
  },
});

// ── Routes ─────────────────────────────────────────────────────────────────────
router.use(requireAuth);

// GET /api/evidence?clientOrgId=x
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { clientOrgId, controlRef } = req.query;
  const where: Record<string, unknown> = { clientOrg: { vcisoId: req.user!.userId }, deletedAt: null };
  if (clientOrgId) where.clientOrgId = clientOrgId as string;
  if (controlRef) where.controlRef = String(controlRef).trim().toUpperCase();
  const files = await prisma.evidenceFile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { clientOrg: { select: { name: true, shortCode: true } } },
  });
  res.json({ files });
});

// POST /api/evidence  (multipart/form-data: file + clientOrgId + controlRef + frameworkRef)
router.post(
  "/",
  upload.single("file"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const r = z.object({
      clientOrgId: z.string().min(1),
      controlRef:  z.string().optional(),
      frameworkRef: z.string().optional(),
      replacesId: z.string().optional(),
      requestId: z.string().optional(),
      expiresAt: z.string().datetime().optional(),
    }).safeParse(req.body);

    if (!r.success || !req.file) {
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(400).json({ error: r.success ? "No file uploaded" : "Validation failed", issues: r.error?.issues });
      return;
    }

    // Verify client belongs to this vCISO
    const org = await prisma.clientOrg.findFirst({
      where: { id: r.data.clientOrgId, vcisoId: req.user!.userId },
    });
    if (!org) {
      fs.unlinkSync(req.file.path);
      res.status(404).json({ error: "Client not found" });
      return;
    }

    const file = await prisma.evidenceFile.create({
      data: {
        clientOrgId:  r.data.clientOrgId,
        controlRef:   r.data.controlRef ? r.data.controlRef.trim().toUpperCase() : null,
        frameworkRef: r.data.frameworkRef || null,
        fileName:     req.file.originalname,
        fileSize:     req.file.size,
        mimeType:     req.file.mimetype,
        storagePath:  req.file.filename,
        uploadedById: req.user!.userId,
        status:       "SUBMITTED",
        expiresAt:    r.data.expiresAt ? new Date(r.data.expiresAt) : null,
        requestId:    r.data.requestId || null,
        version:      1,
      },
    });

    if (r.data.replacesId) {
      const previous = await prisma.evidenceFile.findFirst({
        where: {
          id: r.data.replacesId,
          clientOrg: { vcisoId: req.user!.userId },
          deletedAt: null,
        },
      });

      if (previous) {
        await prisma.evidenceFile.update({
          where: { id: file.id },
          data: {
            version: previous.version + 1,
            previousId: previous.id,
          },
        });
        await prisma.evidenceFile.update({
          where: { id: previous.id },
          data: { deletedAt: new Date(), status: "REPLACED" },
        });
      }
    }

    if (r.data.requestId) {
      await prisma.evidenceRequest.updateMany({
        where: {
          id: r.data.requestId,
          clientOrgId: r.data.clientOrgId,
          status: { in: ["PENDING", "OVERDUE"] },
        },
        data: { status: "FULFILLED", fulfilledAt: new Date() },
      });
    }

    res.status(201).json({ file });
  }
);

router.patch("/bulk-review", async (req: AuthRequest, res: Response): Promise<void> => {
  const r = z.object({
    ids: z.array(z.string()).min(1),
    status: z.enum(["ACCEPTED", "REJECTED"]),
    reviewNote: z.string().optional(),
  }).safeParse(req.body);

  if (!r.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const files = await prisma.evidenceFile.findMany({
    where: {
      id: { in: r.data.ids },
      clientOrg: { vcisoId: req.user!.userId },
      deletedAt: null,
    },
    select: { id: true },
  });

  if (files.length !== r.data.ids.length) {
    res.status(404).json({ error: "One or more files not found" });
    return;
  }

  const updated = await prisma.$transaction(
    r.data.ids.map((id) =>
      prisma.evidenceFile.update({
        where: { id },
        data: {
          status: r.data.status,
          reviewNote: r.data.reviewNote || null,
          reviewedAt: new Date(),
          reviewedById: req.user!.userId,
        },
      })
    )
  );

  res.json({ files: updated });
});

// GET /api/evidence/:id/download  — serve the file
router.get("/:id/download", async (req: AuthRequest, res: Response): Promise<void> => {
  const file = await prisma.evidenceFile.findFirst({
    where: { id: req.params.id, clientOrg: { vcisoId: req.user!.userId }, deletedAt: null },
  });
  if (!file) { res.status(404).json({ error: "File not found" }); return; }
  const filePath = path.join(UPLOAD_DIR, file.storagePath);
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: "File missing from storage" }); return; }
  res.setHeader("Content-Disposition", `inline; filename="${file.fileName}"`);
  res.setHeader("Content-Type", file.mimeType);
  res.sendFile(filePath);
});

// PATCH /api/evidence/:id/review  — accept or reject (vCISO only)
router.patch("/:id/review", async (req: AuthRequest, res: Response): Promise<void> => {
  const r = z.object({
    status:     z.enum(["ACCEPTED", "REJECTED"]),
    reviewNote: z.string().optional(),
  }).safeParse(req.body);
  if (!r.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const file = await prisma.evidenceFile.findFirst({
    where: { id: req.params.id, clientOrg: { vcisoId: req.user!.userId }, deletedAt: null },
  });
  if (!file) { res.status(404).json({ error: "File not found" }); return; }

  const updated = await prisma.evidenceFile.update({
    where: { id: req.params.id },
    data: {
      status: r.data.status,
      reviewNote: r.data.reviewNote || null,
      reviewedAt: new Date(),
      reviewedById: req.user!.userId,
    },
  });
  res.json({ file: updated });
});

router.patch("/:id/resubmit", async (req: AuthRequest, res: Response): Promise<void> => {
  const file = await prisma.evidenceFile.findFirst({
    where: { id: req.params.id, clientOrg: { vcisoId: req.user!.userId }, deletedAt: null },
  });

  if (!file) { res.status(404).json({ error: "File not found" }); return; }
  if (file.status !== "REJECTED") { res.status(400).json({ error: "Only REJECTED files can be resubmitted" }); return; }

  const updated = await prisma.evidenceFile.update({
    where: { id: req.params.id },
    data: { status: "SUBMITTED", reviewNote: null, reviewedAt: null, reviewedById: null },
  });

  res.json({ file: updated });
});

router.post("/requests", async (req: AuthRequest, res: Response): Promise<void> => {
  const r = z.object({
    clientOrgId: z.string(),
    controlRef: z.string().min(1),
    frameworkRef: z.string().optional(),
    requestNote: z.string().min(1),
    dueDate: z.string().datetime().optional(),
  }).safeParse(req.body);

  if (!r.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const org = await prisma.clientOrg.findFirst({ where: { id: r.data.clientOrgId, vcisoId: req.user!.userId } });
  if (!org) { res.status(404).json({ error: "Client not found" }); return; }

  const request = await prisma.evidenceRequest.create({
    data: {
      clientOrgId: r.data.clientOrgId,
      controlRef: r.data.controlRef,
      frameworkRef: r.data.frameworkRef,
      requestNote: r.data.requestNote,
      dueDate: r.data.dueDate ? new Date(r.data.dueDate) : null,
      createdById: req.user!.userId,
    },
  });

  res.status(201).json({ request });
});

router.get("/requests", async (req: AuthRequest, res: Response): Promise<void> => {
  const { clientOrgId } = req.query;
  const where: Record<string, unknown> = {
    clientOrg: { vcisoId: req.user!.userId },
    status: { in: ["PENDING", "OVERDUE"] },
  };
  if (clientOrgId) where.clientOrgId = clientOrgId as string;

  const requests = await prisma.evidenceRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  res.json({ requests });
});

router.patch("/requests/:id/fulfill", async (req: AuthRequest, res: Response): Promise<void> => {
  const request = await prisma.evidenceRequest.findFirst({
    where: { id: req.params.id, clientOrg: { vcisoId: req.user!.userId } },
  });
  if (!request) { res.status(404).json({ error: "Request not found" }); return; }

  const updated = await prisma.evidenceRequest.update({
    where: { id: req.params.id },
    data: { status: "FULFILLED", fulfilledAt: new Date() },
  });

  res.json({ request: updated });
});

// DELETE /api/evidence/:id
router.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const file = await prisma.evidenceFile.findFirst({
    where: { id: req.params.id, clientOrg: { vcisoId: req.user!.userId }, deletedAt: null },
  });
  if (!file) { res.status(404).json({ error: "File not found" }); return; }

  // Remove from disk
  const filePath = path.join(UPLOAD_DIR, file.storagePath);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await prisma.evidenceFile.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
