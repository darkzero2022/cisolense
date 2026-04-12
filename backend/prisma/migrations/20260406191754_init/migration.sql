-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VCISO',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "clientOrgId" TEXT,
    CONSTRAINT "users_clientOrgId_fkey" FOREIGN KEY ("clientOrgId") REFERENCES "client_orgs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "client_orgs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Unknown',
    "contactName" TEXT,
    "contactEmail" TEXT,
    "logoColor" TEXT NOT NULL DEFAULT '#00d4ff',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "vcisoId" TEXT NOT NULL,
    CONSTRAINT "client_orgs_vcisoId_fkey" FOREIGN KEY ("vcisoId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "org_frameworks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientOrgId" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nextDueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "org_frameworks_clientOrgId_fkey" FOREIGN KEY ("clientOrgId") REFERENCES "client_orgs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "org_frameworks_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "frameworks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "frameworks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'Global',
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "domains" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "frameworkId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "domains_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "frameworks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "controls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domainId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "controls_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "controlId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "helpText" TEXT,
    "order" INTEGER NOT NULL,
    "options" TEXT NOT NULL,
    CONSTRAINT "questions_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "controls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientOrgId" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "overallScore" REAL,
    "aiSummary" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assessments_clientOrgId_fkey" FOREIGN KEY ("clientOrgId") REFERENCES "client_orgs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessments_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "frameworks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "assessments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assessment_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assessment_answers_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessment_answers_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "controls" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "assessment_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "domain_scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "domainCode" TEXT NOT NULL,
    "domainName" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "aiAnalysis" TEXT,
    CONSTRAINT "domain_scores_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientOrgId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frameworkRef" TEXT,
    "effort" TEXT NOT NULL DEFAULT 'MEDIUM',
    "impact" TEXT NOT NULL DEFAULT 'MEDIUM',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "dueDate" DATETIME,
    "assignedTo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "actions_clientOrgId_fkey" FOREIGN KEY ("clientOrgId") REFERENCES "client_orgs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "actions_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "evidence_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientOrgId" TEXT NOT NULL,
    "controlRef" TEXT,
    "frameworkRef" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "reviewNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evidence_files_clientOrgId_fkey" FOREIGN KEY ("clientOrgId") REFERENCES "client_orgs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "org_frameworks_clientOrgId_frameworkId_key" ON "org_frameworks"("clientOrgId", "frameworkId");

-- CreateIndex
CREATE UNIQUE INDEX "frameworks_slug_key" ON "frameworks"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_answers_assessmentId_questionId_key" ON "assessment_answers"("assessmentId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "domain_scores_assessmentId_domainCode_key" ON "domain_scores"("assessmentId", "domainCode");
