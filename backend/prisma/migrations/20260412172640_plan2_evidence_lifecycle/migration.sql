/*
  Warnings:

  - Added the required column `updatedAt` to the `evidence_files` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "evidence_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientOrgId" TEXT NOT NULL,
    "controlRef" TEXT NOT NULL,
    "frameworkRef" TEXT,
    "requestNote" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fulfilledAt" DATETIME,
    CONSTRAINT "evidence_requests_clientOrgId_fkey" FOREIGN KEY ("clientOrgId") REFERENCES "client_orgs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_evidence_files" (
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
    "expiresAt" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousId" TEXT,
    "requestId" TEXT,
    "reviewedAt" DATETIME,
    "reviewedById" TEXT,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "evidence_files_clientOrgId_fkey" FOREIGN KEY ("clientOrgId") REFERENCES "client_orgs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "evidence_files_previousId_fkey" FOREIGN KEY ("previousId") REFERENCES "evidence_files" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "evidence_files_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "evidence_requests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_evidence_files" ("clientOrgId", "controlRef", "createdAt", "fileName", "fileSize", "frameworkRef", "id", "mimeType", "reviewNote", "status", "storagePath", "uploadedById") SELECT "clientOrgId", "controlRef", "createdAt", "fileName", "fileSize", "frameworkRef", "id", "mimeType", "reviewNote", "status", "storagePath", "uploadedById" FROM "evidence_files";
DROP TABLE "evidence_files";
ALTER TABLE "new_evidence_files" RENAME TO "evidence_files";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
