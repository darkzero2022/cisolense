export type Role = "PLATFORM_ADMIN" | "VCISO" | "CLIENT_ADMIN" | "CLIENT_USER";
export type ActionStatus = "TODO" | "IN_PROGRESS" | "DONE" | "WONT_FIX";
export type EffortLevel = "LOW" | "MEDIUM" | "HIGH";
export type AssessmentStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETE" | "ARCHIVED";

export interface User { id: string; email: string; firstName: string; lastName: string; role: Role; }
export interface Framework { id: string; slug: string; name: string; shortName: string; version: string; region: string; description: string; }
export interface Domain { id: string; code: string; name: string; order: number; controls: Control[]; }
export interface Control { id: string; controlId: string; title: string; description: string; order: number; questions: Question[]; }
export interface Question { id: string; text: string; helpText?: string; options: string; order: number; controlId: string; }
export interface QuestionOption { value: number; label: string; }

export interface ClientOrg {
  id: string; name: string; shortCode: string; sector: string; country: string;
  contactName?: string; contactEmail?: string; logoColor: string; isActive: boolean;
  createdAt: string; updatedAt: string;
  orgFrameworks?: OrgFramework[];
  assessments?: Assessment[];
  actions?: Action[];
  _count?: { assessments: number; actions: number; evidenceFiles: number };
}
export interface OrgFramework { id: string; frameworkId: string; framework: Framework; isActive: boolean; nextDueDate?: string; }
export interface Assessment {
  id: string; clientOrgId: string; status: AssessmentStatus;
  overallScore?: number; aiSummary?: string; startedAt?: string; completedAt?: string; createdAt: string;
  framework: Framework;
  clientOrg?: { name: string; shortCode: string };
  answers?: AssessmentAnswer[];
  domainScores?: DomainScore[];
  actions?: Action[];
}
export interface AssessmentAnswer { id: string; questionId: string; controlId: string; value: number; note?: string; }
export interface DomainScore { id: string; domainCode: string; domainName: string; score: number; aiAnalysis?: string; }
export interface Action {
  id: string; clientOrgId: string; assessmentId?: string; title: string; description?: string;
  frameworkRef?: string; effort: EffortLevel; impact: EffortLevel; priority: number;
  isCritical: boolean; status: ActionStatus; dueDate?: string; assignedTo?: string;
  createdAt: string; updatedAt: string;
}

export interface EvidenceFile {
  id: string;
  clientOrgId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  controlRef: string | null;
  frameworkRef: string | null;
  status: string;
  reviewNote: string | null;
  expiresAt?: string | null;
  version: number;
  previousId?: string | null;
  requestId?: string | null;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type ScanStatus = "QUEUED" | "RUNNING" | "COMPLETE" | "FAILED";
export type ScanType = "basic" | "full";

export interface Scan {
  id: string;
  clientOrgId: string;
  target: string;
  scanType: ScanType;
  status: ScanStatus;
  summary?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface ScanFinding {
  id: string;
  scanId: string;
  key: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  details: string;
  controls: string;
  createdAt: string;
}

export interface GapAnalysisItem {
  controlId: string;
  title: string;
  value: number;
  actionCount: number;
}

export interface ComplianceMatrixRow {
  assessmentId: string;
  framework: string;
  completedAt?: string | null;
  overallScore?: number | null;
  domainScores: Array<{ code: string; name: string; score: number }>;
}

export interface EvidenceCoverageItem {
  domainCode: string;
  totalControls: number;
  coveredControls: number;
  percent: number;
}

export interface ExportJob { id: string; assessmentId: string; type: string; status: string; fileName?: string; }
