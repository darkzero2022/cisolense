import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { computeDomainScores, computeOverallScore, computePriority } from "../services/scoring";
import { generateDomainAnalysis, generateExecutiveSummary } from "../services/ai";

const router = Router();
router.use(requireAuth);

// Action templates per control ID
const ACTION_TEMPLATES: Record<string, { title: string; effort: string; impact: string }> = {
  "GV.OC-01": { title: "Establish and document a formal cybersecurity policy", effort: "MEDIUM", impact: "HIGH" },
  "GV.RM-01": { title: "Implement a formal cybersecurity risk management process", effort: "MEDIUM", impact: "HIGH" },
  "ID.AM-01": { title: "Create and maintain a complete hardware asset inventory", effort: "LOW", impact: "HIGH" },
  "ID.AM-02": { title: "Establish software inventory with version tracking", effort: "LOW", impact: "MEDIUM" },
  "PR.AC-01": { title: "Enforce MFA on all privileged and remote access accounts", effort: "LOW", impact: "HIGH" },
  "PR.DS-01": { title: "Implement encryption at rest for all sensitive data stores", effort: "MEDIUM", impact: "HIGH" },
  "DE.CM-01": { title: "Deploy SIEM or MDR service for continuous security monitoring", effort: "HIGH", impact: "HIGH" },
  "RS.RP-01": { title: "Develop and test an Incident Response Plan via tabletop exercise", effort: "MEDIUM", impact: "HIGH" },
  "RC.RP-01": { title: "Define and validate RTO/RPO for critical systems with tested recovery plans", effort: "MEDIUM", impact: "HIGH" },
  "R1.1": { title: "Define and approve firewall/network security policies", effort: "LOW", impact: "HIGH" },
  "R1.2": { title: "Restrict inbound/outbound traffic to authorized services only", effort: "MEDIUM", impact: "HIGH" },
  "R1.3": { title: "Segment cardholder data environment from untrusted networks", effort: "HIGH", impact: "HIGH" },
  "R2.1": { title: "Remove default credentials and insecure vendor settings", effort: "LOW", impact: "HIGH" },
  "R2.2": { title: "Implement hardened security baselines for systems", effort: "MEDIUM", impact: "HIGH" },
  "R2.3": { title: "Establish configuration inventory and drift monitoring", effort: "MEDIUM", impact: "MEDIUM" },
  "R3.1": { title: "Reduce retained account data to minimum required", effort: "MEDIUM", impact: "HIGH" },
  "R3.3": { title: "Mask PAN in all user interfaces and reports", effort: "LOW", impact: "HIGH" },
  "R3.5": { title: "Secure cryptographic key management lifecycle", effort: "MEDIUM", impact: "HIGH" },
  "R4.1": { title: "Enforce strong cryptography for data in transit", effort: "LOW", impact: "HIGH" },
  "R4.2": { title: "Disable weak TLS protocols and ciphers", effort: "LOW", impact: "HIGH" },
  "R4.3": { title: "Implement certificate management and renewal process", effort: "MEDIUM", impact: "MEDIUM" },
  "R5.1": { title: "Deploy anti-malware controls across in-scope systems", effort: "LOW", impact: "HIGH" },
  "R5.2": { title: "Automate anti-malware signature and engine updates", effort: "LOW", impact: "MEDIUM" },
  "R5.3": { title: "Schedule regular malware scanning and alert review", effort: "LOW", impact: "MEDIUM" },
  "R6.1": { title: "Formalize secure SDLC governance and checkpoints", effort: "MEDIUM", impact: "HIGH" },
  "R6.2": { title: "Require code review for custom software changes", effort: "MEDIUM", impact: "HIGH" },
  "R6.4": { title: "Deploy WAF protection for public-facing applications", effort: "MEDIUM", impact: "HIGH" },
  "R7.1": { title: "Define least-privilege access policy and ownership", effort: "LOW", impact: "HIGH" },
  "R7.2": { title: "Enforce role-based need-to-know access controls", effort: "MEDIUM", impact: "HIGH" },
  "R7.3": { title: "Centralize access approval and periodic recertification", effort: "MEDIUM", impact: "MEDIUM" },
  "R8.1": { title: "Implement account lifecycle controls for all identities", effort: "LOW", impact: "HIGH" },
  "R8.2": { title: "Enforce unique IDs for every user and admin", effort: "LOW", impact: "HIGH" },
  "R8.3": { title: "Enforce MFA for administrative and remote access", effort: "LOW", impact: "HIGH" },
  "R9.1": { title: "Strengthen physical security controls for sensitive areas", effort: "MEDIUM", impact: "MEDIUM" },
  "R9.3": { title: "Implement badge-based access restrictions and logs", effort: "MEDIUM", impact: "MEDIUM" },
  "R9.4": { title: "Formalize visitor access, escort, and sign-in procedures", effort: "LOW", impact: "MEDIUM" },
  "R10.1": { title: "Enable centralized audit logging on critical systems", effort: "MEDIUM", impact: "HIGH" },
  "R10.2": { title: "Capture required PCI event categories in logs", effort: "MEDIUM", impact: "HIGH" },
  "R10.5": { title: "Protect log integrity and implement retention/review", effort: "MEDIUM", impact: "HIGH" },
  "R11.1": { title: "Perform periodic wireless security testing", effort: "MEDIUM", impact: "MEDIUM" },
  "R11.2": { title: "Run routine vulnerability scanning with remediation", effort: "MEDIUM", impact: "HIGH" },
  "R11.3": { title: "Conduct regular penetration testing and follow-up fixes", effort: "HIGH", impact: "HIGH" },
  "R12.1": { title: "Establish and maintain a PCI security policy framework", effort: "MEDIUM", impact: "HIGH" },
  "R12.3": { title: "Implement recurring cyber risk assessment process", effort: "MEDIUM", impact: "HIGH" },
  "R12.6": { title: "Deliver role-based security awareness training", effort: "LOW", impact: "MEDIUM" },
  "A.5.1": { title: "Establish and communicate an information security policy signed by leadership", effort: "LOW", impact: "HIGH" },
  "A.5.2": { title: "Review the information security policy at planned intervals or following significant changes", effort: "LOW", impact: "MEDIUM" },
  "A.6.1": { title: "Define information security roles and responsibilities across the organisation", effort: "MEDIUM", impact: "HIGH" },
  "A.6.2": { title: "Implement security controls for mobile devices and remote working arrangements", effort: "MEDIUM", impact: "HIGH" },
  "A.6.3": { title: "Integrate information security into project management lifecycle", effort: "MEDIUM", impact: "MEDIUM" },
  "A.7.1": { title: "Conduct background verification checks on candidates prior to employment", effort: "LOW", impact: "HIGH" },
  "A.7.2": { title: "Deliver ongoing security awareness and acceptable use training to all employees", effort: "LOW", impact: "HIGH" },
  "A.7.3": { title: "Formalise offboarding and access revocation procedures for role changes and departures", effort: "LOW", impact: "HIGH" },
  "A.8.1": { title: "Define and assign ownership for all information assets and classification scheme", effort: "LOW", impact: "HIGH" },
  "A.8.2": { title: "Establish and enforce an information classification and handling policy", effort: "LOW", impact: "MEDIUM" },
  "A.8.3": { title: "Implement media handling procedures including secure disposal and transfer controls", effort: "MEDIUM", impact: "HIGH" },
  "A.8.5": { title: "Establish a formal information transfer policy and agreement process", effort: "LOW", impact: "HIGH" },
  "N20.1": { title: "Conduct structured risk analysis and document cybersecurity policies aligned to NIS2 Article 20", effort: "MEDIUM", impact: "HIGH" },
  "N20.2": { title: "Implement an incident handling process with clear reporting obligations per NIS2 Article 20", effort: "HIGH", impact: "HIGH" },
  "N20.3": { title: "Define and test business continuity and crisis management plans covering critical functions", effort: "HIGH", impact: "HIGH" },
  "N21.1": { title: "Deploy appropriate and proportionate technical and organisational security measures", effort: "MEDIUM", impact: "HIGH" },
  "N21.2": { title: "Assess and manage security risks across the supply chain and third-party relationships", effort: "HIGH", impact: "HIGH" },
  "N21.3": { title: "Classify assets and apply encryption and access controls to protect sensitive information", effort: "MEDIUM", impact: "HIGH" },
  "N30.1": { title: "Establish communication channels and reporting procedures with national competent authorities", effort: "LOW", impact: "MEDIUM" },
  "N30.2": { title: "Maintain documentation to demonstrate compliance readiness for supervisory activities", effort: "LOW", impact: "MEDIUM" },
};

// POST /api/assessments — start new
router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const r = z.object({ clientOrgId: z.string(), frameworkId: z.string() }).safeParse(req.body);
  if (!r.success) { res.status(400).json({ error: "Validation failed" }); return; }
  const org = await prisma.clientOrg.findFirst({ where: { id: r.data.clientOrgId, vcisoId: req.user!.userId } });
  if (!org) { res.status(403).json({ error: "Client not found or access denied" }); return; }

  const existing = await prisma.assessment.findFirst({
    where: {
      clientOrgId: r.data.clientOrgId,
      frameworkId: r.data.frameworkId,
      status: "IN_PROGRESS",
      clientOrg: { vcisoId: req.user!.userId },
    },
    include: { framework: true },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    res.status(200).json({ assessment: existing, reused: true });
    return;
  }

  const assessment = await prisma.assessment.create({
    data: { clientOrgId: r.data.clientOrgId, frameworkId: r.data.frameworkId, createdById: req.user!.userId, status: "IN_PROGRESS", startedAt: new Date() },
    include: { framework: true },
  });
  res.status(201).json({ assessment });
});

// GET /api/assessments?clientOrgId=x
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { clientOrgId } = req.query;
  const where: Record<string, unknown> = { clientOrg: { vcisoId: req.user!.userId } };
  if (clientOrgId) where.clientOrgId = clientOrgId;
  const assessments = await prisma.assessment.findMany({
    where,
    include: { framework: true, domainScores: true, clientOrg: { select: { name: true, shortCode: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ assessments });
});

// GET /api/assessments/:id
router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const assessment = await prisma.assessment.findFirst({
    where: { id: req.params.id, clientOrg: { vcisoId: req.user!.userId } },
    include: {
      framework: { include: { domains: { orderBy: { order: "asc" }, include: { controls: { orderBy: { order: "asc" }, include: { questions: { orderBy: { order: "asc" } } } } } } } },
      answers: { include: { question: true, control: { include: { domain: true } } } },
      domainScores: { orderBy: { domainCode: "asc" } },
      actions: { orderBy: { priority: "asc" } },
    },
  });
  if (!assessment) { res.status(404).json({ error: "Assessment not found" }); return; }
  res.json({ assessment });
});

// POST /api/assessments/:id/answer — save single answer (auto-save)
router.post("/:id/answer", async (req: AuthRequest, res: Response): Promise<void> => {
  const r = z.object({ questionId: z.string(), controlId: z.string(), value: z.number().min(0).max(3), note: z.string().optional() }).safeParse(req.body);
  if (!r.success) { res.status(400).json({ error: "Validation failed" }); return; }
  const assessment = await prisma.assessment.findFirst({ where: { id: req.params.id, clientOrg: { vcisoId: req.user!.userId } } });
  if (!assessment) { res.status(404).json({ error: "Assessment not found" }); return; }
  const answer = await prisma.assessmentAnswer.upsert({
    where: { assessmentId_questionId: { assessmentId: req.params.id, questionId: r.data.questionId } },
    update: { value: r.data.value, note: r.data.note },
    create: { assessmentId: req.params.id, questionId: r.data.questionId, controlId: r.data.controlId, value: r.data.value, note: r.data.note },
  });
  res.json({ answer });
});

// POST /api/assessments/:id/complete — score + generate actions
router.post("/:id/complete", async (req: AuthRequest, res: Response): Promise<void> => {
  const assessment = await prisma.assessment.findFirst({
    where: { id: req.params.id, clientOrg: { vcisoId: req.user!.userId } },
    include: { answers: { include: { control: { include: { domain: true } } } } },
  });
  if (!assessment) { res.status(404).json({ error: "Assessment not found" }); return; }
  if (assessment.status === "COMPLETE") { res.status(400).json({ error: "Assessment already complete" }); return; }

  // Compute scores
  const answerInputs = assessment.answers.map((a) => ({
    value: a.value,
    domainCode: a.control.domain.code,
    domainName: a.control.domain.name,
    controlId: a.control.controlId,
  }));
  const domainScores = computeDomainScores(answerInputs);
  const overallScore = computeOverallScore(domainScores);

  // Generate actions for answers with value < 2
  const lowAnswers = assessment.answers.filter((a) => a.value < 2);
  const actionData = lowAnswers
    .filter((a) => ACTION_TEMPLATES[a.control.controlId])
    .map((a) => {
      const tpl = ACTION_TEMPLATES[a.control.controlId];
      return {
        clientOrgId: assessment.clientOrgId,
        assessmentId: assessment.id,
        title: tpl.title,
        effort: tpl.effort,
        impact: tpl.impact,
        priority: computePriority(tpl.effort, tpl.impact),
        isCritical: tpl.effort === "LOW" && tpl.impact === "HIGH",
        frameworkRef: a.control.controlId,
      };
    });

  const completed = await prisma.$transaction(async (tx) => {
    await tx.domainScore.deleteMany({ where: { assessmentId: req.params.id } });
    await tx.domainScore.createMany({
      data: Object.entries(domainScores).map(([code, { name, score }]) => ({
        assessmentId: req.params.id,
        domainCode: code,
        domainName: name,
        score,
      })),
    });

    await tx.action.deleteMany({ where: { assessmentId: req.params.id } });
    if (actionData.length > 0) {
      await tx.action.createMany({ data: actionData });
    }

    return tx.assessment.update({
      where: { id: req.params.id },
      data: { status: "COMPLETE", overallScore, completedAt: new Date() },
      include: { domainScores: true, actions: { orderBy: { priority: "asc" } } },
    });
  });

  res.json({ assessment: completed, overallScore });
});

router.post("/:id/analyze", async (req: AuthRequest, res: Response): Promise<void> => {
  const force = req.query.force === "true";
  const assessment = await prisma.assessment.findFirst({
    where: { id: req.params.id, clientOrg: { vcisoId: req.user!.userId } },
    include: {
      clientOrg: { select: { name: true, sector: true } },
      domainScores: { orderBy: { domainCode: "asc" } },
      answers: { include: { question: true, control: { include: { domain: true } } } },
    },
  });

  if (!assessment) { res.status(404).json({ error: "Assessment not found" }); return; }
  if (assessment.status !== "COMPLETE") { res.status(400).json({ error: "Assessment must be COMPLETE" }); return; }

  if (assessment.aiSummary && !force) {
    res.json({ queued: false, aiSummary: assessment.aiSummary });
    return;
  }

  await prisma.assessment.update({
    where: { id: assessment.id },
    data: { aiSummary: "AI_ANALYZING" },
  });

  res.status(202).json({ queued: true });

  void (async () => {
    try {
      const analyses: Array<{ domain: string; score: number; analysis: string }> = [];

      for (const ds of assessment.domainScores) {
        const controlAnswers = assessment.answers
          .filter((a) => a.control.domain.code === ds.domainCode)
          .map((a) => ({
            controlId: a.control.controlId,
            question: a.question.text,
            value: a.value,
          }));

        const aiAnalysis = await generateDomainAnalysis(
          ds.domainName,
          ds.score,
          controlAnswers,
          assessment.clientOrg.sector || "General"
        );

        await prisma.domainScore.update({
          where: { assessmentId_domainCode: { assessmentId: assessment.id, domainCode: ds.domainCode } },
          data: { aiAnalysis },
        });

        analyses.push({ domain: ds.domainName, score: ds.score, analysis: aiAnalysis });
      }

      const executive = await generateExecutiveSummary(
        assessment.clientOrg.name,
        assessment.clientOrg.sector || "General",
        assessment.overallScore || 0,
        analyses
      );

      await prisma.assessment.update({
        where: { id: assessment.id },
        data: { aiSummary: executive },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown AI failure";
      await prisma.assessment.update({
        where: { id: assessment.id },
        data: { aiSummary: `AI_ERROR: ${msg}` },
      });
    }
  })();
});

// DELETE /api/assessments/:id
router.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const assessment = await prisma.assessment.findFirst({ where: { id: req.params.id, clientOrg: { vcisoId: req.user!.userId } } });
  if (!assessment) { res.status(404).json({ error: "Assessment not found" }); return; }
  await prisma.assessment.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
