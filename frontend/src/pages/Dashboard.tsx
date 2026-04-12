import { useNavigate } from "react-router-dom";
import { useClients } from "@/hooks/useClients";
import { useActions } from "@/hooks/useActions";
import { useAssessments } from "@/hooks/useAssessments";
import { getRiskLevel, getRiskLabel, fmtDate } from "@/lib/utils";
import Pill from "@/components/Pill";
import ScoreBar from "@/components/ScoreBar";
import Card from "@/components/Card";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: clients = [] } = useClients();
  const { data: actions = [] } = useActions();
  const { data: assessments = [] } = useAssessments();

  const totalActions = actions.filter((a) => a.status === "TODO" || a.status === "IN_PROGRESS").length;
  const criticalCount = actions.filter((a) => a.isCritical && a.status !== "DONE").length;
  const avgCompliance = clients.length
    ? Math.round(assessments.filter((a) => a.overallScore).reduce((sum, a) => sum + (a.overallScore || 0), 0) / Math.max(assessments.filter((a) => a.overallScore).length, 1))
    : 0;

  const stats = [
    { label: "Active Clients", value: clients.length, delta: "", accent: "var(--cyan)", cls: "cyan" },
    { label: "Avg Compliance", value: `${avgCompliance}%`, delta: "", accent: "var(--emerald)", cls: "emerald" },
    { label: "Open Actions", value: totalActions, delta: "", accent: "var(--amber)", cls: "amber" },
    { label: "Critical Findings", value: criticalCount, delta: "Needs attention", accent: "var(--red)", cls: "red" },
  ];

  return (
    <div className="fade-up">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Command Center</h1>
          <p className={styles.subtitle}>// {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <button className={styles.btnCyan} onClick={() => navigate("/clients")}>+ New Client</button>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statCard} style={{ "--accent": s.accent } as React.CSSProperties}>
            <div className={styles.accentLine} />
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statValue}>{s.value}</div>
            {s.delta && <div className={styles.statDelta}>{s.delta}</div>}
          </div>
        ))}
      </div>

      <div className={styles.grid2}>
        <Card>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Client Portfolio</span>
            <button className={styles.btnSm} onClick={() => navigate("/clients")}>View All →</button>
          </div>
          <table className={styles.table}>
            <thead><tr><th>Client</th><th>Sector</th><th>Risk</th><th>Actions</th></tr></thead>
            <tbody>
              {clients.slice(0, 5).map((c) => {
                const latestAssessment = assessments.find((a) => a.clientOrgId === c.id && a.overallScore);
                const score = latestAssessment?.overallScore || 0;
                return (
                  <tr key={c.id} onClick={() => navigate(`/clients/${c.id}`)}>
                    <td>
                      <div className={styles.clientCell}>
                        <div className={styles.orgBadge} style={{ background: `${c.logoColor}20`, color: c.logoColor }}>{c.shortCode}</div>
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td className={styles.muted}>{c.sector}</td>
                    <td>{score > 0 ? <Pill variant={getRiskLevel(score)}>{getRiskLabel(score)}</Pill> : <span className={styles.muted}>—</span>}</td>
                    <td className={styles.muted}>{c._count?.actions || 0} open</td>
                  </tr>
                );
              })}
              {clients.length === 0 && <tr><td colSpan={4} className={styles.empty}>No clients yet — <button className={styles.link} onClick={() => navigate("/clients")}>add your first</button></td></tr>}
            </tbody>
          </table>
        </Card>

        <Card>
          <div className={styles.cardHeader}><span className={styles.cardTitle}>Critical Actions</span></div>
          <div>
            {actions.filter((a) => a.isCritical && a.status !== "DONE").slice(0, 5).map((a) => (
              <div key={a.id} className={styles.actionRow}>
                <div className={styles.critDot} />
                <div>
                  <div className={styles.actionFw}>{a.frameworkRef}</div>
                  <div className={styles.actionTitle}>{a.title}</div>
                </div>
              </div>
            ))}
            {actions.filter((a) => a.isCritical && a.status !== "DONE").length === 0 && (
              <div className={styles.empty} style={{ padding: "32px 20px" }}>No critical actions 🎉</div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className={styles.cardHeader}><span className={styles.cardTitle}>Recent Assessments</span></div>
        <table className={styles.table}>
          <thead><tr><th>Client</th><th>Framework</th><th>Score</th><th>Date</th></tr></thead>
          <tbody>
            {assessments.filter((a) => a.status === "COMPLETE").slice(0, 6).map((a) => (
              <tr key={a.id} onClick={() => navigate(`/results/${a.id}`)}>
                <td>{a.clientOrg?.name || "—"}</td>
                <td><span className={styles.fwTag}>{a.framework.shortName}</span></td>
                <td>{a.overallScore ? <ScoreBar score={a.overallScore} /> : "—"}</td>
                <td className={styles.muted}>{fmtDate(a.createdAt)}</td>
              </tr>
            ))}
            {assessments.length === 0 && <tr><td colSpan={4} className={styles.empty}>No assessments yet</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
