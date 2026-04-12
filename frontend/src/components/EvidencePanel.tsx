import { useRef, useState } from "react";
import { api } from "@/lib/api";
import type { EvidenceFile } from "@/types";
import styles from "./EvidencePanel.module.css";

interface Props {
  clientOrgId: string;
  controlRef?: string;
  frameworkRef?: string;
  files: EvidenceFile[];
  onUploaded: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  SUBMITTED: "var(--amber)",
  ACCEPTED:  "var(--emerald)",
  REJECTED:  "var(--red)",
};

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function EvidencePanel({ clientOrgId, controlRef, frameworkRef, files, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = controlRef
    ? files.filter((f) => f.controlRef?.toUpperCase() === controlRef.toUpperCase())
    : files;

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("clientOrgId", clientOrgId);
      if (controlRef)   form.append("controlRef",   controlRef);
      if (frameworkRef) form.append("frameworkRef", frameworkRef);
      await api.post("/evidence", form);
      onUploaded();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setError(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleReview = async (id: string, status: "ACCEPTED" | "REJECTED") => {
    await api.patch(`/evidence/${id}/review`, { status });
    onUploaded();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/evidence/${id}`);
    onUploaded();
  };

  const handleResubmit = async (id: string) => {
    await api.patch(`/evidence/${id}/resubmit`);
    onUploaded();
  };

  const isExpiringSoon = (expiresAt?: string | null) => {
    if (!expiresAt) return false;
    const now = Date.now();
    const expiry = new Date(expiresAt).getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return expiry > now && expiry - now <= thirtyDays;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Evidence</span>
        <span className={styles.count}>{filtered.length}</span>
        <button
          className={styles.uploadBtn}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : "+ Attach"}
        </button>
        <input
          ref={inputRef}
          type="file"
          style={{ display: "none" }}
          accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {filtered.length === 0 ? (
        <div className={styles.empty}>No evidence attached yet</div>
      ) : (
        <div className={styles.list}>
          {filtered.map((f) => (
            <div key={f.id} className={styles.item}>
              <div className={styles.itemLeft}>
                <span className={styles.fileIcon}>{f.mimeType === "application/pdf" ? "📄" : f.mimeType.startsWith("image/") ? "🖼️" : "📎"}</span>
                <div>
                  <a
                    className={styles.fileName}
                    href={`/api/evidence/${f.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >{f.fileName}</a>
                  <div className={styles.fileMeta}>
                    {fmtSize(f.fileSize)}
                    {f.controlRef && ` · ${f.controlRef}`}
                    {f.version > 1 && ` · v${f.version}`}
                    {isExpiringSoon(f.expiresAt) && " · Expiring <30d"}
                  </div>
                  {f.reviewNote && <div className={styles.reviewNote}>{f.reviewNote}</div>}
                </div>
              </div>
              <div className={styles.itemRight}>
                <span className={styles.status} style={{ color: STATUS_COLOR[f.status] || "var(--muted)" }}>{f.status}</span>
                {f.status === "SUBMITTED" && (
                  <>
                    <button className={styles.btnAccept} onClick={() => handleReview(f.id, "ACCEPTED")}>✓</button>
                    <button className={styles.btnReject} onClick={() => handleReview(f.id, "REJECTED")}>✗</button>
                  </>
                )}
                {f.status === "REJECTED" && (
                  <button className={styles.btnResubmit} onClick={() => handleResubmit(f.id)}>↩</button>
                )}
                <button className={styles.btnDelete} onClick={() => handleDelete(f.id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
