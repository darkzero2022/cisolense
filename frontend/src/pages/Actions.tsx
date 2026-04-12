import { useActions, useUpdateActionStatus } from "@/hooks/useActions";
import type { Action, ActionStatus } from "@/types";
import Pill from "@/components/Pill";
import styles from "./Actions.module.css";

const COLUMNS: { status: ActionStatus; label: string }[] = [
  { status: "TODO", label: "To Do" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "DONE", label: "Done" },
  { status: "WONT_FIX", label: "Won't Fix" },
];

const effortColor = (e: string) => e === "LOW" ? { bg: "var(--emerald-dim)", color: "var(--emerald)" } : e === "MEDIUM" ? { bg: "var(--amber-dim)", color: "var(--amber)" } : { bg: "var(--red-dim)", color: "var(--red)" };

export default function Actions() {
  const { data: actions = [] } = useActions();
  const updateStatus = useUpdateActionStatus();

  const move = (action: Action, status: ActionStatus) => updateStatus.mutate({ id: action.id, status });
  const byStatus = (s: ActionStatus) => actions.filter((a) => a.status === s);
  const total = actions.filter((a) => a.status === "TODO" || a.status === "IN_PROGRESS").length;
  const critical = actions.filter((a) => a.isCritical && (a.status === "TODO" || a.status === "IN_PROGRESS")).length;

  return (
    <div className="fade-up">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Remediation Actions</h1>
          <p className={styles.subtitle}>// {total} open · {critical} critical across all clients</p>
        </div>
      </div>

      <div className={styles.kanban}>
        {COLUMNS.map((col) => {
          const colActions = byStatus(col.status);
          return (
            <div key={col.status} className={styles.column}>
              <div className={styles.colHeader}>
                <span className={styles.colLabel}>{col.label}</span>
                <span className={styles.colCount}>{colActions.length}</span>
              </div>
              <div className={styles.colBody}>
                {colActions.map((a) => {
                  const ec = effortColor(a.effort);
                  return (
                    <div key={a.id} className={styles.actionCard}>
                      <div className={styles.cardTop}>
                        <span className={styles.effortBadge} style={{ background: ec.bg, color: ec.color }}>{a.effort}</span>
                        {a.isCritical && <Pill variant="red">Critical</Pill>}
                      </div>
                      {a.frameworkRef && <div className={styles.fwRef}>{a.frameworkRef}</div>}
                      <div className={styles.actionTitle}>{a.title}</div>
                      {a.description && <p className={styles.actionDesc}>{a.description}</p>}
                      <div className={styles.cardMeta}>
                        <span className={styles.impactTag} style={{ background: "var(--cyan-dim)", color: "var(--cyan)" }}>{a.impact} IMPACT</span>
                        {a.assignedTo && <span className={styles.assignee}>{a.assignedTo}</span>}
                      </div>
                      <div className={styles.cardActions}>
                        {col.status !== "TODO" && <button className={styles.moveBtn} onClick={() => move(a, "TODO")}>← To Do</button>}
                        {col.status !== "IN_PROGRESS" && <button className={styles.moveBtn} onClick={() => move(a, "IN_PROGRESS")}>In Progress</button>}
                        {col.status !== "DONE" && <button className={styles.moveBtnDone} onClick={() => move(a, "DONE")}>✓ Done</button>}
                        {col.status !== "WONT_FIX" && <button className={styles.moveBtn} onClick={() => move(a, "WONT_FIX")}>✕ Won't Fix</button>}
                      </div>
                    </div>
                  );
                })}
                {colActions.length === 0 && (
                  <div className={styles.emptyCol}>
                    {col.status === "DONE" ? "No completed actions yet" : col.status === "WONT_FIX" ? "No dismissed actions" : `No ${col.label.toLowerCase()} actions`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
