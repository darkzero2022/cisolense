import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFrameworkQuestions } from "@/hooks/useFrameworks";
import { useAssessments, useStartAssessment, useCompleteAssessment } from "@/hooks/useAssessments";
import { useEvidence, useInvalidateEvidence } from "@/hooks/useEvidence";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/api";
import EvidencePanel from "@/components/EvidencePanel";
import type { Domain, Question, QuestionOption } from "@/types";
import styles from "./Assessment.module.css";

interface FlatQuestion {
  question: Question;
  control: { id: string; controlId: string; title: string };
  domain: Domain;
}

export default function Assessment() {
  const { clientId, frameworkId } = useParams<{ clientId: string; frameworkId: string }>();
  const navigate = useNavigate();
  const addToast = useToast();
  
  const { data: framework, isLoading: loadingFramework } = useFrameworkQuestions(frameworkId!);
  const { data: assessments = [] } = useAssessments(clientId);
  const startAssessment = useStartAssessment();
  const completeAssessment = useCompleteAssessment();
  const { data: evidenceFiles = [] } = useEvidence(clientId);
  const invalidateEvidence = useInvalidateEvidence(clientId);
  const hasStarted = useRef(false);

  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const flatQuestions: FlatQuestion[] = framework?.domains?.flatMap((domain: Domain) =>
    domain.controls.flatMap((control) =>
      control.questions.map((q) => ({
        question: q,
        control: { id: control.id, controlId: control.controlId, title: control.title },
        domain,
      }))
    )
  ) || [];

  useEffect(() => {
    if (framework && !assessmentId && !hasStarted.current) {
      hasStarted.current = true;
      const existing = assessments.find(
        (a) => a.status === "IN_PROGRESS" && a.clientOrgId === clientId && a.framework?.id === frameworkId
      );

      if (existing) {
        setAssessmentId(existing.id);
        addToast("Resumed existing in-progress assessment", "info");
        return;
      }

      setStarting(true);
      startAssessment.mutateAsync({ clientOrgId: clientId!, frameworkId: frameworkId! })
        .then((res) => {
          setAssessmentId(res.data.assessment.id);
          addToast("Assessment started successfully", "success");
        })
        .catch((err: Error) => {
          addToast(err.message || "Failed to start assessment", "error");
        })
        .finally(() => setStarting(false));
    }
  }, [framework, assessmentId, assessments, clientId, frameworkId, startAssessment, addToast]);

  const current = flatQuestions[currentIdx];
  const total = flatQuestions.length;
  const progress = total > 0 ? Math.round((currentIdx / total) * 100) : 0;

  const handleSaveAnswer = async () => {
    if (selected === null || !assessmentId || !current) {
      setSaveError("Please select an answer");
      return;
    }

    setSaveError(null);
    try {
      await api.post(`/assessments/${assessmentId}/answer`, {
        questionId: current.question.id,
        controlId: current.control.id,
        value: selected,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save answer";
      setSaveError(msg);
      addToast(msg, "error");
    }
  };

  const handleNext = async () => {
    await handleSaveAnswer();
    if (selected === null || !assessmentId || !current) return;

    setAnswers((prev) => ({ ...prev, [current.question.id]: selected }));

    if (currentIdx + 1 >= total) {
      setCompleting(true);
      try {
        const { data } = await completeAssessment.mutateAsync(assessmentId);
        addToast("Assessment complete! Calculating scores...", "success");
        setTimeout(() => navigate(`/results/${data.assessment.id}`), 1000);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to complete assessment";
        addToast(msg, "error");
        setCompleting(false);
        setSaveError(msg);
      }
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
      setSelected(answers[flatQuestions[currentIdx - 1]?.question.id] ?? null);
    }
  };

  if (loadingFramework) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <div>Loading framework...</div>
      </div>
    );
  }

  if (!framework || !current) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <div>{starting ? "Starting assessment..." : "Loading assessment..."}</div>
      </div>
    );
  }

  const options: QuestionOption[] = JSON.parse(current.question.options);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← Cancel</button>

        <div className={styles.header}>
          <div className={styles.frameworkBadge}>{framework.shortName} {framework.version}</div>
          <h1 className={styles.title}>{framework.name}</h1>
        </div>

        <div className={styles.progressCard}>
          <div className={styles.progressTop}>
            <span className={styles.progressLabel}>Question {currentIdx + 1} of {total}</span>
            <span className={styles.progressPct}>{progress}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.domainPills}>
            {framework.domains?.map((d: Domain) => (
              <span
                key={d.code}
                className={`${styles.domainPill} ${d.code === current.domain.code ? styles.domainActive : ""}`}
              >
                {d.name}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.questionCard}>
          <div className={styles.controlRef}>{current.domain.code} · {current.control.controlId}</div>
          <div className={styles.controlTitle}>{current.control.title}</div>
          <h2 className={styles.questionText}>{current.question.text}</h2>
          {current.question.helpText && <p className={styles.helpText}>{current.question.helpText}</p>}

          {saveError && <div style={{ background: "var(--red-dim)", color: "var(--red)", padding: "10px", borderRadius: 8, fontSize: 12, marginBottom: "14px" }}>{saveError}</div>}

          <div className={styles.options}>
            {options.map((opt) => (
              <div
                key={opt.value}
                className={`${styles.option} ${selected === opt.value ? styles.optSelected : ""}`}
                onClick={() => setSelected(opt.value)}
              >
                <div className={styles.optDot}>
                  {selected === opt.value && <div className={styles.optDotFill} />}
                </div>
                <div className={styles.optContent}>
                  <div className={styles.optLabel}>{opt.label}</div>
                  <div className={styles.optScore}>Maturity level {opt.value}/3</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {clientId && (
          <EvidencePanel
            clientOrgId={clientId}
            controlRef={current.control.controlId}
            frameworkRef={framework.shortName}
            files={evidenceFiles}
            onUploaded={invalidateEvidence}
          />
        )}

        <div className={styles.navRow}>
          <button className={styles.btnBack} onClick={handlePrev} disabled={currentIdx === 0}>
            ← Previous
          </button>
          <button
            className={styles.btnNext}
            onClick={handleNext}
            disabled={selected === null || completing || saveError !== null}
          >
            {completing ? "Analysing..." : currentIdx + 1 >= total ? "Complete Assessment →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
