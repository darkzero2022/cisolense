-- CreateTable
CREATE TABLE "scans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientOrgId" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "scanType" TEXT NOT NULL DEFAULT 'basic',
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "scans_clientOrgId_fkey" FOREIGN KEY ("clientOrgId") REFERENCES "client_orgs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "scan_findings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "controls" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scan_findings_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "scans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
