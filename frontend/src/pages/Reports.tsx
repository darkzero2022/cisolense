import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useClients } from "@/hooks/useClients";
import { useGapAnalysis, useComplianceMatrix, useEvidenceCoverage } from "@/hooks/useReports";
import Card from "@/components/Card";
import { getScoreColor } from "@/lib/utils";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import styles from "./Reports.module.css";

type Tab = "gap" | "matrix" | "coverage";

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const clientOrgId = searchParams.get("clientOrgId") || "";
  const [tab, setTab] = useState<Tab>("gap");

  const { data: clients = [] } = useClients();
  const { data: gapItems = [] } = useGapAnalysis(clientOrgId || undefined);
  const { data: matrix = [] } = useComplianceMatrix(clientOrgId || undefined);
  const { data: coverage = [] } = useEvidenceCoverage(clientOrgId || undefined);

  const selectedClient = clients.find((c) => c.id === clientOrgId);

  const matrixChartData = matrix.flatMap((row) =>
    row.domainScores.map((d) => ({
      assessment: row.framework + " " + (row.completedAt ? new Date(row.completedAt).getFullYear().toString() : ""),
      [d.name]: Math.round(d.score),
    }))
  );

  const severityColor = (v: number) => {
    if (v === 0) return "var(--red)";
    if (v === 1) return "var(--amber)";
    return "var(--emerald)";
  };

  return (
    <div className="fade-up">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics &amp; Reports</h1>
          <p className={styles.subtitle}>// {selectedClient ? `${selectedClient.name} — ` : ""}Compliance intelligence</p>
        </div>
        <select
          className={styles.clientSelect}
          value={clientOrgId}
          onChange={(e) => setSearchParams({ clientOrgId: e.target.value })}
        >
          <option value="">— Select Client —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.tabs}>
        {(["gap", "matrix", "coverage"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "gap" ? "Gap Analysis" : t === "matrix" ? "Compliance Matrix" : "Evidence Coverage"}
          </button>
        ))}
      </div>

      {!clientOrgId && (
        <div className={styles.emptyState}>Select a client to view reports.</div>
      )}

      {clientOrgId && tab === "gap" && (
        <Card>
          <div className={styles.cardHeader}><span className={styles.cardTitle}>Controls Below Target Maturity</span></div>
          {gapItems.length === 0 ? (
            <div className={styles.empty}>No gap data — complete an assessment first.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Control</th>
                  <th>Title</th>
                  <th>Score</th>
                  <th>Open Actions</th>
                </tr>
              </thead>
              <tbody>
                {gapItems.map((item) => (
                  <tr key={item.controlId}>
                    <td className={styles.mono}>{item.controlId}</td>
                    <td>{item.title}</td>
                    <td>
                      <span style={{ color: severityColor(item.value) }}>
                        {item.value}/3 ({Math.round((item.value / 3) * 100)}%)
                      </span>
                    </td>
                    <td className={styles.mono}>{item.actionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {clientOrgId && tab === "matrix" && (
        <Card>
          <div className={styles.cardHeader}><span className={styles.cardTitle}>Compliance Score Trend</span></div>
          {matrixChartData.length === 0 ? (
            <div className={styles.empty}>Complete multiple assessments to see trends.</div>
          ) : (
            <div style={{ padding: "16px 0" }}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={matrixChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="assessment" tick={{ fill: "var(--muted)", fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 8 }}
                  />
                  {matrix[0]?.domainScores.map((d) => (
                    <Line
                      key={d.code}
                      type="monotone"
                      dataKey={d.name}
                      stroke={getScoreColor(d.score)}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      {clientOrgId && tab === "coverage" && (
        <Card>
          <div className={styles.cardHeader}><span className={styles.cardTitle}>Evidence Coverage by Domain</span></div>
          {coverage.length === 0 ? (
            <div className={styles.empty}>No coverage data — upload evidence first.</div>
          ) : (
            <div style={{ padding: "16px 0" }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={coverage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                  <YAxis type="category" dataKey="domainCode" tick={{ fill: "var(--muted)", fontSize: 11 }} width={80} />
                  <Tooltip
                    contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 8 }}
                    formatter={(v: number, _: string, props: { payload?: { totalControls?: number; coveredControls?: number } }) => [
                      `${props.payload?.coveredControls}/${props.payload?.totalControls} controls`,
                      `${v}%`,
                    ]}
                  />
                  <Bar dataKey="percent" radius={[0, 4, 4, 0]}>
                    {coverage.map((entry) => (
                      <Cell key={entry.domainCode} fill={getScoreColor(entry.percent)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className={styles.coverageTable}>
                {coverage.map((c) => (
                  <div key={c.domainCode} className={styles.coverageRow}>
                    <span className={styles.mono}>{c.domainCode}</span>
                    <div className={styles.coverageBar}>
                      <div
                        className={styles.coverageFill}
                        style={{ width: `${c.percent}%`, background: getScoreColor(c.percent) }}
                      />
                    </div>
                    <span className={styles.mono}>{c.percent}%</span>
                    <span className={styles.coverageMeta}>{c.coveredControls}/{c.totalControls}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
