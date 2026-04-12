import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth";
import clientRoutes from "./routes/clients";
import frameworkRoutes from "./routes/frameworks";
import assessmentRoutes from "./routes/assessments";
import actionRoutes from "./routes/actions";
import evidenceRoutes from "./routes/evidence";
import reportRoutes from "./routes/reports";
import scanRoutes from "./routes/scans";
import exportRoutes from "./routes/exports";
import { prisma } from "./lib/prisma";
import { doubleCsrfProtection, isInvalidCsrfError } from "./lib/csrf";

export const app = express();
const PORT = process.env.PORT || 3001;

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(doubleCsrfProtection);

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 20 : 200,
  message: { error: "Too many requests" },
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/frameworks", frameworkRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/actions", actionRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/scans", scanRoutes);
app.use("/api/exports", exportRoutes);

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

// 404
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (isInvalidCsrfError(err)) {
    res.status(403).json({ error: "Invalid CSRF token" });
    return;
  }
  console.error(err.stack);
  res.status(500).json({ error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message });
});

if (require.main === module) {
  void (async () => {
    try {
      await prisma.assessment.updateMany({
        where: { aiSummary: "AI_ANALYZING" },
        data: { aiSummary: null },
      });

      await prisma.scan.updateMany({
        where: { status: "QUEUED" },
        data: { status: "FAILED", summary: "Server restarted before scan could complete", completedAt: new Date() },
      });
    } catch (error) {
      console.error("Startup recovery failed", error);
    }
  })();

  app.listen(PORT, () => {
    console.log(`\n🚀 CISOLens API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || "development"}\n`);
  });
}

if (require.main === module) {
  const DAY_MS = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    try {
      await prisma.evidenceFile.updateMany({
        where: {
          status: "ACCEPTED",
          expiresAt: { lt: new Date() },
          deletedAt: null,
        },
        data: { status: "EXPIRED" },
      });
    } catch (error) {
      console.error("Evidence expiry job failed", error);
    }
  }, DAY_MS);
}
