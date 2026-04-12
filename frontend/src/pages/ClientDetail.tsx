import { useNavigate, useParams } from "react-router-dom";
import { useClient } from "@/hooks/useClients";
import { useAssessments } from "@/hooks/useAssessments";
import { useActions } from "@/hooks/useActions";
import { useEvidence, useInvalidateEvidence } from "@/hooks/useEvidence";
import EvidencePanel from "@/components/EvidencePanel";
import { getScoreColor, getRiskLevel, getRiskLabel, fmtDate } from "@/lib/utils";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import Pill from "@/components/Pill";
import ScoreBar from "@/components/ScoreBar";
import Card from "@/components/Card";
import styles from "./ClientDetail.module.css";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client } = useClient(id!);
  const { data: assessments = [] } = useAssessments(id);
  const { data: actions = [] } = useActions(id);
  const { data: evidenceFiles = [] } = useEvidence(id);
  const invalidateEvidence = useInvalidateEvidence(id);

  if (!client) return <div className={styles.loading}>Loading...</div>;

  const latestAssessment = assessments.find((a) => a.overallScore);
  const overallScore = latestAssessment?.overallScore || 0;
  const radarData = latestAssessment?.domainScores?.map((d) => ({ subject: d.domainName, A: Math.round(d.score), fullMark: 100 })) || [];
  const openActions = actions.filter((a) => a.status !== "DONE" && a.status !== "WONT_FIX");

  return (
    <div className="fade-up">
      <button className={styles.backBtn} onClick={() => navigate("/clients")}>← Back to Clients</button>

      <div className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <div className={styles.orgBadge} style={{ background: `${client.logoColor}20`, color: client.logoColor }}>{client.shortCode}</div>
          <div>
            <div className={styles.clientName}>{client.name}</div>
            <div className={styles.clientMeta}>{client.sector} · {client.country}{client.contactName && ` · ${client.contactName}`}</div>
            <div className={styles.fwList}>{(client.orgFrameworks || []).map((of) => <span key={of.id} className={styles.fwTag}>{of.framework.shortName}</span>)}</div>
          </div>
        </div>
        <div className={styles.heroRight}>
          {overallScore > 0 && (
            <div className={styles.scoreBlock}>
              <div className={styles.scoreLabel}>Avg Compliance</div>
              <div className={styles.scoreHero} style={{ color: getScoreColor(overallScore) }}>{overallScore}%</div>
              <Pill variant={getRiskLevel(overallScore)}>{getRiskLabel(overallScore)}</Pill>
            </div>
          )}
          <div className={styles.heroActions}>
            {(client.orgFrameworks || []).slice(0, 3).map((of) => (
              <button key={of.framework.id} className={styles.btnCyan} onClick={() => navigate(`/assess/${client.id}/${of.framework.id}`)}>+ Assess {of.framework.shortName}</button>
            ))}
            <button className={styles.btnSm} onClick={() => navigate(`/reports?clientOrgId=${client.id}`)}>📊 Analytics</button>
            <button className={styles.btnSm} onClick={() => navigate(`/scans?clientOrgId=${client.id}`)}>🔍 Scanner</button>
          </div>
        </div>
      </div>

      <div className={styles.grid2}>
        {radarData.length > 0 ? (
          <Card>
            <div className={styles.cardHeader}><span className={styles.cardTitle}>Framework Posture</span></div>
            <div style={{ padding: "16px 0" }}>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.07)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="A" stroke="var(--cyan)" fill="var(--cyan)" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 8, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ) : (
          <Card>
            <div className={styles.cardHeader}><span className={styles.cardTitle}>Framework Posture</span></div>
            <div className={styles.emptyState}>No assessments completed yet.<br /><button className={styles.link} onClick={() => navigate(`/assess/${client.id}/${client.orgFrameworks?.[0]?.framework?.id}`)}>Start your first assessment →</button></div>
          </Card>
        )}

        <Card>
          <div className={styles.cardHeader}><span className={styles.cardTitle}>Open Actions</span><Pill variant="amber">{openActions.length}</Pill></div>
          <div>
            {openActions.slice(0, 5).map((a) => (
              <div key={a.id} className={styles.actionRow}>
                <span className={styles.effortTag} style={{ background: a.effort === "LOW" ? "var(--emerald-dim)" : a.effort === "MEDIUM" ? "var(--amber-dim)" : "var(--red-dim)", color: a.effort === "LOW" ? "var(--emerald)" : a.effort === "MEDIUM" ? "var(--amber)" : "var(--red)" }}>{a.effort}</span>
                <div className={styles.actionText}>
                  <div className={styles.actionRef}>{a.frameworkRef}</div>
                  <div>{a.title}</div>
                </div>
                {a.isCritical && <Pill variant="red">Critical</Pill>}
              </div>
            ))}
            {openActions.length === 0 && <div className={styles.emptyState}>No open actions 🎉</div>}
          </div>
        </Card>
      </div>

      <Card>
        <div className={styles.cardHeader}><span className={styles.cardTitle}>Assessment History</span></div>
        <table className={styles.table}>
          <thead><tr><th>Framework</th><th>Score</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>
            {assessments.map((a) => (
              <tr key={a.id}>
                <td><span className={styles.fwTag}>{a.framework.shortName}</span></td>
                <td>{a.overallScore ? <ScoreBar score={a.overallScore} /> : <span className={styles.muted}>In progress</span>}</td>
                <td><Pill variant={a.status === "COMPLETE" ? "green" : "amber"}>{a.status}</Pill></td>
                <td className={styles.muted}>{fmtDate(a.createdAt)}</td>
                <td>{a.status === "COMPLETE" && <button className={styles.btnSm} onClick={() => navigate(`/results/${a.id}`)}>View →</button>}</td>
              </tr>
            ))}
            {assessments.length === 0 && <tr><td colSpan={5} className={styles.muted} style={{ textAlign: "center", padding: "24px" }}>No assessments yet</td></tr>}
          </tbody>
        </table>
      </Card>

      <Card>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Evidence Vault</span>
          <Pill variant={evidenceFiles.filter(f => f.status === "SUBMITTED").length > 0 ? "amber" : "green"}>
            {evidenceFiles.filter(f => f.status === "SUBMITTED").length > 0
              ? `${evidenceFiles.filter(f => f.status === "SUBMITTED").length} pending review`
              : `${evidenceFiles.length} files`}
          </Pill>
        </div>
        <EvidencePanel
          clientOrgId={id!}
          files={evidenceFiles}
          onUploaded={invalidateEvidence}
        />
      </Card>
    </div>
  );
}
