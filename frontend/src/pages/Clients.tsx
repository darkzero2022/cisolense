import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { useFrameworks } from "@/hooks/useFrameworks";
import { useAssessments } from "@/hooks/useAssessments";
import { useToast } from "@/components/Toast";
import { getRiskLevel, getRiskLabel, validateEmail } from "@/lib/utils";
import Pill from "@/components/Pill";
import styles from "./Clients.module.css";

export default function Clients() {
  const navigate = useNavigate();
  const addToast = useToast();
  const { data: clients = [] } = useClients();
  const { data: frameworks = [] } = useFrameworks();
  const { data: assessments = [] } = useAssessments();
  const createClient = useCreateClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    name: "",
    shortCode: "",
    sector: "",
    country: "",
    contactName: "",
    contactEmail: "",
  });
  const [frameworkIds, setFrameworkIds] = useState<string[]>([]);

  const resetForm = () => {
    setForm({ name: "", shortCode: "", sector: "", country: "", contactName: "", contactEmail: "" });
    setFrameworkIds([]);
    setShowModal(false);
  };

  const validateForm = (): boolean => {
    const validationErrors: string[] = [];

    if (!form.name.trim()) validationErrors.push("Organisation name is required");
    if (!form.shortCode.trim()) validationErrors.push("Short code is required");
    else if (form.shortCode.length > 4)
      validationErrors.push("Short code must be 4 characters or less");
    
    if (!form.sector.trim()) validationErrors.push("Sector is required");
    if (form.contactEmail && !validateEmail(form.contactEmail))
      validationErrors.push("Please enter a valid email");

    if (validationErrors.length > 0) {
      validationErrors.forEach((err) => addToast(err, "error"));
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    const payload = {
      name: form.name.trim(),
      shortCode: form.shortCode.trim(),
      sector: form.sector.trim(),
      country: form.country.trim() || undefined,
      contactName: form.contactName.trim() || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
      logoColor: "#00d4ff",
      frameworkIds,
    };

    createClient.mutateAsync(payload)
      .then(() => {
        addToast("Client organisation created successfully", "success");
        resetForm();
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to create client";
        addToast(msg, "error");
      });
  };

  const toggleFw = (id: string) =>
    setFrameworkIds((p) =>
      p.includes(id)
        ? p.filter((f) => f !== id)
        : [...p, id]
    );

  return (
    <div className="fade-up">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Clients</h1>
          <p className={styles.subtitle}>// {clients.length} organisations under management</p>
        </div>
        <button className={styles.btnCyan} onClick={() => setShowModal(true)}>
          + New Client
        </button>
      </div>

      <div className={styles.grid}>
        {clients.map((c) => {
          const score = assessments.find((a) => a.clientOrgId === c.id && a.overallScore)?.overallScore || 0;
          return (
            <div
              key={c.id}
              className={styles.clientCard}
              onClick={() => navigate(`/clients/${c.id}`)}
            >
              <div className={styles.cardTop}>
                <div
                  className={styles.orgBadge}
                  style={{ background: `${c.logoColor}20`, color: c.logoColor }}
                >
                  {c.shortCode}
                </div>
                <div className={styles.cardInfo}>
                  <div className={styles.clientName}>{c.name}</div>
                  <div className={styles.clientSector}>{c.sector}</div>
                </div>
                {score > 0 && (
                  <Pill variant={getRiskLevel(score)}>
                    {getRiskLabel(score)}
                  </Pill>
                )}
              </div>
              <div className={styles.fwList}>
                {(c.orgFrameworks || []).map((of) => (
                  <span key={of.id} className={styles.fwTag}>
                    {of.framework.shortName}
                  </span>
                ))}
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.muted}>
                  {c._count?.actions || 0} actions
                </span>
                <button
                  className={styles.btnSm}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    navigate(`/clients/${c.id}`);
                  }}
                >
                  View →
                </button>
              </div>
            </div>
          );
        })}
        <div className={styles.addCard} onClick={() => setShowModal(true)}>
          <div className={styles.addIcon}>+</div>
          <div className={styles.addLabel}>Add Client</div>
        </div>
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className={styles.modal}>
            <div className={styles.modalTitle}>New Client Organisation</div>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>Organisation Name *</label>
                <input
                  className={styles.input}
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Short Code *</label>
                <input
                  className={styles.input}
                  value={form.shortCode}
                  onChange={(e) => setForm((p) => ({ ...p, shortCode: e.target.value }))}
                  placeholder="e.g. AC"
                  maxLength={4}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Sector *</label>
                <input
                  className={styles.input}
                  value={form.sector}
                  onChange={(e) => setForm((p) => ({ ...p, sector: e.target.value }))}
                  placeholder="e.g. Financial Services"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Country</label>
                <input
                  className={styles.input}
                  value={form.country}
                  onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                  placeholder="e.g. Egypt"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Contact Name</label>
                <input
                  className={styles.input}
                  value={form.contactName}
                  onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Contact Email</label>
                <input
                  className={styles.input}
                  value={form.contactEmail}
                  onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                  type="email"
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Frameworks</label>
              <div className={styles.fwPicker}>
                {frameworks.map((fw) => (
                  <div
                    key={fw.id}
                    className={`${styles.fwChip} ${
                      frameworkIds.includes(fw.id) ? styles.fwActive : ""
                    }`}
                    onClick={() => toggleFw(fw.id)}
                  >
                    {fw.shortName}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnSm} onClick={resetForm}>
                Cancel
              </button>
              {createClient.isPending ? (
                <div className={styles.loader}>Creating...</div>
              ) : (
                <button className={styles.btnCyan} onClick={handleCreate} disabled={!form.name || !form.shortCode || !form.sector}>
                  Create Client
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
