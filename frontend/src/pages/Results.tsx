import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAssessment, useAnalyzeAssessment } from "@/hooks/useAssessments";
import { useExportReport } from "@/hooks/useExports";
import { getScoreColor, getRiskLevel, getRiskLabel, fmtDate } from "@/lib/utils";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import Pill from "@/components/Pill";
import Card from "@/components/Card";
import { useToast } from "@/components/Toast";
import styles from "./Results.module.css";

export default function Results() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const addToast = useToast();
  const { data: assessment, refetch } = useAssessment(assessmentId!);
  const analyze = useAnalyzeAssessment();
  const exportReport = useExportReport();
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (!assessment || assessment.aiSummary !== "AI_ANALYZING") return;
    const timer = setInterval(() => {
      void refetch();
    }, 3000);
    return () => clearInterval(timer);
  }, [assessment, refetch]);

  if (!assessment) return (
    <div className={styles.loading}><div className={styles.spinner} /><div>Loading results...</div></div>
  );

  const score = assessment.overallScore || 0;
  const domainScores = assessment.domainScores || [];
  const actions = assessment.actions || [];
  const radarData = domainScores.map((d) => ({ subject: d.domainName, A: Math.round(d.score), fullMark: 100 }));
  const highestDomain = [...domainScores].sort((a, b) => b.score - a.score)[0];
  const lowestDomain = [...domainScores].sort((a, b) => a.score - b.score)[0];

  const handleAnalyze = async (force = false) => {
    try {
      await analyze.mutateAsync({ id: assessment.id, force });
      addToast("AI analysis queued", "success");
      void refetch();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to queue AI analysis", "error");
    }
  };

  const handleExportPdf = async () => {
    setExportError(null);
    try {
      const result = await exportReport.mutateAsync(assessment.id);
      const base = import.meta.env.VITE_API_URL;
      window.open(`${base}/exports/${result.jobId}`, "_blank");
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>

        <div className={styles.pageHeader}>
          <div>
            <div className={styles.frameworkBadge}>{assessment.framework.shortName} — Assessment Results</div>
            <h1 className={styles.title}>Compliance Report</h1>
            <p className={styles.subtitle}>{assessment.clientOrg?.name} · {fmtDate(assessment.createdAt)}</p>
          </div>
          <div className={styles.exportBtns}>
            <button
              className={styles.btnSm}
              onClick={() => void handleExportPdf()}
              disabled={exportReport.isPending}
            >
              {exportReport.isPending ? "Generating..." : "Export PDF"}
            </button>
            <button className={styles.btnSm} disabled title="Coming soon">Export CSV</button>
            <button className={styles.btnCyan} disabled title="Coming soon">Email to Client</button>
          </div>
          {exportError && <div style={{ color: "var(--red)", fontSize: 12, marginTop: 4 }}>{exportError}</div>}
        </div>

        {/* HERO */}
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <div className={styles.scoreLabel}>Overall Compliance Score</div>
            <div className={styles.scoreHero} style={{ color: getScoreColor(score) }}>{score}<span className={styles.scorePct}>%</span></div>
            <Pill variant={getRiskLevel(score)}>{getRiskLabel(score)}</Pill>
          </div>
          <div className={styles.heroStats}>
            {[
              { label: "Highest Domain", value: highestDomain?.domainName || "—", sub: highestDomain ? `${Math.round(highestDomain.score)}%` : "" },
              { label: "Lowest Domain", value: lowestDomain?.domainName || "—", sub: lowestDomain ? `${Math.round(lowestDomain.score)}%` : "" },
              { label: "Actions Generated", value: String(actions.length), sub: `${actions.filter((a) => a.isCritical).length} critical` },
            ].map((s) => (
              <div key={s.label} className={styles.heroStat}>
                <div className={styles.heroStatLabel}>{s.label}</div>
                <div className={styles.heroStatValue}>{s.value}</div>
                <div className={styles.heroStatSub}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.grid2}>
          {/* DOMAIN SCORES */}
          <Card>
            <div className={styles.cardHeader}><span className={styles.cardTitle}>Domain Scores</span></div>
            <div className={styles.domainList}>
              {domainScores.map((d) => (
                <div key={d.domainCode}>
                  <div className={styles.domainRow}>
                    <div className={styles.domainName}>{d.domainCode} — {d.domainName}</div>
                    <div className={styles.domainBar}>
                      <div className={styles.domainFill} style={{ width: `${d.score}%`, background: getScoreColor(d.score) }} />
                    </div>
                    <div className={styles.domainScore} style={{ color: getScoreColor(d.score) }}>{Math.round(d.score)}%</div>
                  </div>
                  {d.aiAnalysis && (
                    <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, margin: "4px 0 10px 0", borderLeft: "2px solid var(--border2)", paddingLeft: 10 }}>
                      {d.aiAnalysis}
                    </div>
                  )}
                </div>
              ))}
              {domainScores.length === 0 && <div className={styles.empty}>No domain scores available</div>}
            </div>
          </Card>

          {/* RADAR */}
          <Card>
            <div className={styles.cardHeader}><span className={styles.cardTitle}>Posture Map</span></div>
            <div style={{ padding: "12px 0" }}>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.07)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="A" stroke="var(--cyan)" fill="var(--cyan)" fillOpacity={0.15} strokeWidth={2} />
                    <Tooltip contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 8, fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : <div className={styles.empty}>No data</div>}
            </div>
          </Card>
        </div>

        {/* ACTIONS */}
        <Card>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>AI-Prioritised Recommendations</span>
            <Pill variant="cyan">Fix First</Pill>
          </div>
          <div style={{ marginBottom: 14 }}>
            {assessment.aiSummary && assessment.aiSummary !== "AI_ANALYZING" && !assessment.aiSummary.startsWith("AI_ERROR:") && (
              <div className={styles.empty} style={{ textAlign: "left" }}>
                <strong>Executive AI Summary</strong>
                <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{assessment.aiSummary}</div>
              </div>
            )}
            {assessment.aiSummary === "AI_ANALYZING" && (
              <div className={styles.empty} style={{ textAlign: "left" }}>AI analysis in progress...</div>
            )}
            {assessment.aiSummary?.startsWith("AI_ERROR:") && (
              <div className={styles.empty} style={{ textAlign: "left" }}>
                AI analysis failed: {assessment.aiSummary.replace("AI_ERROR:", "").trim()}
              </div>
            )}
            {(!assessment.aiSummary || assessment.aiSummary.startsWith("AI_ERROR:")) && (
              <button className={styles.btnSm} onClick={() => handleAnalyze(assessment.aiSummary?.startsWith("AI_ERROR:") ?? false)} disabled={analyze.isPending}>
                {analyze.isPending ? "Queueing..." : "Generate AI Analysis"}
              </button>
            )}
          </div>
          <div className={styles.actionsList}>
            {actions.sort((a, b) => a.priority - b.priority).map((a) => (
              <div key={a.id} className={styles.actionRow}>
                <div className={styles.actionTags}>
                  <span className={styles.effortTag} style={{ background: a.effort === "LOW" ? "var(--emerald-dim)" : a.effort === "MEDIUM" ? "var(--amber-dim)" : "var(--red-dim)", color: a.effort === "LOW" ? "var(--emerald)" : a.effort === "MEDIUM" ? "var(--amber)" : "var(--red)" }}>{a.effort} EFFORT</span>
                  <span className={styles.effortTag} style={{ background: "var(--cyan-dim)", color: "var(--cyan)" }}>{a.impact} IMPACT</span>
                </div>
                <div className={styles.actionContent}>
                  <div className={styles.actionRef}>{a.frameworkRef}</div>
                  <div className={styles.actionTitle}>{a.title}</div>
                </div>
                {a.isCritical && <Pill variant="red">Critical</Pill>}
              </div>
            ))}
            {actions.length === 0 && <div className={styles.empty}>No actions generated — great compliance posture!</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
