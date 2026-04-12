import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useClients } from "@/hooks/useClients";
import { useScans, useScan, useCreateScan } from "@/hooks/useScans";
import { useToast } from "@/components/Toast";
import Card from "@/components/Card";
import styles from "./Scans.module.css";

const STATUS_COLOR: Record<string, string> = {
  QUEUED: "var(--muted)",
  RUNNING: "var(--amber)",
  COMPLETE: "var(--emerald)",
  FAILED: "var(--red)",
};

const SEVERITY_COLOR: Record<string, string> = {
  LOW: "var(--emerald)",
  MEDIUM: "var(--amber)",
  HIGH: "var(--red)",
};

export default function Scans() {
  const [searchParams, setSearchParams] = useSearchParams();
  const clientOrgId = searchParams.get("clientOrgId") || "";
  const addToast = useToast();

  const { data: clients = [] } = useClients();
  const { data: scans = [] } = useScans(clientOrgId || undefined);
  const createScan = useCreateScan();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [scanType, setScanType] = useState<"basic" | "full">("basic");
  const [submitting, setSubmitting] = useState(false);

  const { data: expandedScan } = useScan(expandedId || undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientOrgId || !target.trim()) {
      addToast("Select a client and enter a target IP/hostname", "error");
      return;
    }
    setSubmitting(true);
    try {
      await createScan.mutateAsync({ clientOrgId, target: target.trim(), scanType });
      addToast("Scan queued successfully", "success");
      setTarget("");
    } catch {
      addToast("Failed to queue scan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-up">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Network Scanner</h1>
          <p className={styles.subtitle}>// Automated discovery and control mapping</p>
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

      {clientOrgId && (
        <Card className={styles.triggerCard}>
          <div className={styles.cardTitle}>New Scan</div>
          <form onSubmit={handleSubmit} className={styles.triggerForm}>
            <input
              className={styles.input}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 192.168.1.0/24 or hostname.domain.com"
            />
            <select
              className={styles.select}
              value={scanType}
              onChange={(e) => setScanType(e.target.value as "basic" | "full")}
            >
              <option value="basic">Basic (port scan)</option>
              <option value="full">Full (version + OS detection)</option>
            </select>
            <button
              type="submit"
              className={styles.btnScan}
              disabled={submitting || !target.trim()}
            >
              {submitting ? "Queuing..." : "Launch Scan"}
            </button>
          </form>
        </Card>
      )}

      {clientOrgId && (
        <Card>
          <div className={styles.cardHeader}><span className={styles.cardTitle}>Scan History</span></div>
          {scans.length === 0 ? (
            <div className={styles.empty}>No scans yet — launch your first scan above.</div>
          ) : (
            <div className={styles.scanList}>
              {scans.map((scan) => (
                <div key={scan.id} className={styles.scanRow}>
                  <div
                    className={styles.scanToggle}
                    onClick={() => setExpandedId(expandedId === scan.id ? null : scan.id)}
                  >
                    <span className={styles.scanTarget}>{scan.target}</span>
                    <span className={styles.scanMeta}>{scan.scanType} · {new Date(scan.createdAt).toLocaleDateString()}</span>
                    <span className={styles.scanStatus} style={{ color: STATUS_COLOR[scan.status] }}>
                      {scan.status}
                    </span>
                    <span className={styles.expandIcon}>{expandedId === scan.id ? "▲" : "▼"}</span>
                  </div>

                  {expandedId === scan.id && expandedScan && (
                    <div className={styles.findingsPanel}>
                      {expandedScan.findings && expandedScan.findings.length > 0 ? (
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Severity</th>
                              <th>Finding</th>
                              <th>Mapped Controls</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expandedScan.findings.map((f) => (
                              <tr key={f.id}>
                                <td>
                                  <span
                                    className={styles.severityBadge}
                                    style={{ background: SEVERITY_COLOR[f.severity] + "20", color: SEVERITY_COLOR[f.severity] }}
                                  >
                                    {f.severity}
                                  </span>
                                </td>
                                <td>{f.details}</td>
                                <td className={styles.mono}>
                                  {JSON.parse(f.controls || "[]").map((c: string) => (
                                    <span key={c} className={styles.controlChip}>{c}</span>
                                  ))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className={styles.empty}>
                          {scan.status === "RUNNING" ? "Scan in progress..." : scan.status === "FAILED" ? "Scan failed — check target address" : "No findings."}
                        </div>
                      )}
                      {scan.summary && <div className={styles.scanSummary}>{scan.summary}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {!clientOrgId && (
        <div className={styles.emptyState}>Select a client to launch a network scan.</div>
      )}
    </div>
  );
}
