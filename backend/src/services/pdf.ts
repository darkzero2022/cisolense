import { chromium, Browser } from "playwright";
import fs from "fs";
import path from "path";
import { mkdir } from "fs/promises";

export interface ReportData {
  clientOrg: { name: string; sector: string; country: string };
  framework: { name: string; shortName: string };
  overallScore: number;
  aiSummary: string | null;
  completedAt: string | null;
  createdAt: string;
  domainScores: Array<{
    domainCode: string;
    domainName: string;
    score: number;
    aiAnalysis: string | null;
  }>;
  answers: Array<{
    controlId: string;
    value: number;
  }>;
  actions: Array<{
    title: string;
    priority: number;
    effort: string;
    impact: string;
    status: string;
    isCritical: boolean;
  }>;
}

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Low Risk";
  if (score >= 60) return "Moderate Risk";
  if (score >= 40) return "High Risk";
  return "Critical Risk";
}

function getScoreBar(score: number): string {
  return scoreColor(score);
}

function generateHtml(data: ReportData): string {
  const completedDate = data.completedAt ? new Date(data.completedAt).toLocaleDateString("en-GB") : "In Progress";
  const createdDate = new Date(data.createdAt).toLocaleDateString("en-GB");
  const overallColor = scoreColor(data.overallScore);
  const overallLabel = scoreLabel(data.overallScore);

  const domainRows = data.domainScores.map((d) => `
    <tr>
      <td><strong>${d.domainCode}</strong></td>
      <td>${d.domainName}</td>
      <td style="text-align:center">${Math.round(d.score)}%</td>
      <td>
        <div style="background:#e5e7eb;border-radius:4px;height:8px;width:100px;overflow:hidden">
          <div style="background:${scoreColor(d.score)};height:8px;width:${d.score}%"></div>
        </div>
      </td>
      <td style="color:${scoreColor(d.score)};font-weight:bold">${scoreLabel(d.score)}</td>
      <td style="font-size:12px;color:#6b7280;max-width:200px">${d.aiAnalysis ? d.aiAnalysis.substring(0, 120) + (d.aiAnalysis.length > 120 ? "…" : "") : "—"}</td>
    </tr>
  `).join("");

  const actionRows = data.actions.map((a, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td>${a.title}</td>
      <td style="text-align:center"><span style="background:${a.isCritical ? "#ef4444" : "#3b82f6"};color:white;border-radius:10px;padding:2px 8px;font-size:11px">${a.isCritical ? "CRITICAL" : "NORMAL"}</span></td>
      <td style="text-align:center">${a.effort}</td>
      <td style="text-align:center">${a.impact}</td>
      <td style="text-align:center"><span style="background:#f3f4f6;color:#374151;border-radius:4px;padding:2px 8px;font-size:11px">${a.status}</span></td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CISOLens Compliance Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13px; color: #111827; background: #fff; }
  .page { padding: 40px 50px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
  .logo { font-size: 24px; font-weight: 800; color: #0ea5e9; }
  .logo span { color: #111827; }
  .header-meta { text-align: right; font-size: 12px; color: #6b7280; line-height: 1.8; }
  .section { margin-bottom: 35px; }
  .section-title { font-size: 16px; font-weight: 700; color: #0ea5e9; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; border-left: 4px solid #0ea5e9; padding-left: 10px; }
  .hero { display: flex; gap: 30px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 30px; }
  .score-block { text-align: center; }
  .score-big { font-size: 56px; font-weight: 800; line-height: 1; color: ${overallColor}; }
  .score-big small { font-size: 24px; }
  .score-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-top: 4px; }
  .risk-badge { display: inline-block; background: ${overallColor}20; color: ${overallColor}; border: 1px solid ${overallColor}; border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 600; margin-top: 8px; }
  .meta-block { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .meta-item { }
  .meta-key { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; }
  .meta-val { font-size: 14px; font-weight: 600; margin-top: 2px; }
  .exec-summary { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; font-size: 13px; line-height: 1.7; color: #0c4a6e; }
  .exec-summary p { margin-bottom: 10px; }
  .exec-summary p:last-child { margin-bottom: 0; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead tr { background: #f1f5f9; }
  th { padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; }
  th[align="center"] { text-align: center; }
  td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fafafa; }
  .footer { margin-top: 50px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="logo">CISOL<span>ens</span></div>
      <div style="font-size:12px;color:#6b7280;margin-top:4px">vCISO Compliance Platform</div>
    </div>
    <div class="header-meta">
      <div><strong>${data.clientOrg.name}</strong></div>
      <div>${data.clientOrg.sector} · ${data.clientOrg.country}</div>
      <div>Framework: ${data.framework.name}</div>
      <div>Assessment Date: ${createdDate}</div>
      <div>Report Generated: ${new Date().toLocaleDateString("en-GB")}</div>
    </div>
  </div>

  <div class="hero">
    <div class="score-block">
      <div class="score-big">${Math.round(data.overallScore)}<small>%</small></div>
      <div class="score-label">Overall Score</div>
      <div class="risk-badge">${overallLabel}</div>
    </div>
    <div class="meta-block">
      <div class="meta-item">
        <div class="meta-key">Client Organisation</div>
        <div class="meta-val">${data.clientOrg.name}</div>
      </div>
      <div class="meta-item">
        <div class="meta-key">Framework</div>
        <div class="meta-val">${data.framework.name}</div>
      </div>
      <div class="meta-item">
        <div class="meta-key">Assessment Date</div>
        <div class="meta-val">${createdDate}</div>
      </div>
      <div class="meta-item">
        <div class="meta-key">Completed</div>
        <div class="meta-val">${completedDate}</div>
      </div>
      <div class="meta-item">
        <div class="meta-key">Domains Assessed</div>
        <div class="meta-val">${data.domainScores.length}</div>
      </div>
      <div class="meta-item">
        <div class="meta-key">Remediation Actions</div>
        <div class="meta-val">${data.actions.length} <span style="font-weight:400;font-size:12px;color:#ef4444">(${data.actions.filter(a => a.isCritical).length} critical)</span></div>
      </div>
    </div>
  </div>

  ${data.aiSummary ? `
  <div class="section">
    <div class="section-title">Executive Summary</div>
    <div class="exec-summary">${data.aiSummary.split("\n").map(p => p.trim() ? `<p>${p}</p>` : "").join("")}</div>
  </div>
  ` : ""}

  <div class="section">
    <div class="section-title">Domain Scores</div>
    <table>
      <thead>
        <tr>
          <th>Code</th>
          <th>Domain Name</th>
          <th align="center">Score</th>
          <th>Progress</th>
          <th>Risk Level</th>
          <th>AI Analysis</th>
        </tr>
      </thead>
      <tbody>${domainRows}</tbody>
    </table>
  </div>

  ${data.actions.length > 0 ? `
  <div class="section">
    <div class="section-title">Remediation Action Plan</div>
    <table>
      <thead>
        <tr>
          <th align="center">#</th>
          <th>Action Title</th>
          <th align="center">Priority</th>
          <th align="center">Effort</th>
          <th align="center">Impact</th>
          <th align="center">Status</th>
        </tr>
      </thead>
      <tbody>${actionRows}</tbody>
    </table>
  </div>
  ` : ""}

  <div class="footer">
    Generated by CISOLens vCISO Platform · ${data.framework.name} · Confidential — ${data.clientOrg.name}
  </div>
</div>
</body>
</html>`;
}

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

export async function generateReportPdf(data: ReportData, outputPath: string): Promise<string> {
  const html = generateHtml(data);
  const dir = path.dirname(outputPath);
  await mkdir(dir, { recursive: true });

  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });
  } finally {
    await page.close();
  }

  return outputPath;
}
