-- CreateTable
CREATE TABLE "export_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientOrgId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PDF',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "filePath" TEXT,
    "error" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "export_jobs_clientOrgId_fkey" FOREIGN KEY ("clientOrgId") REFERENCES "client_orgs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "export_jobs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
