-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_frameworks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'Global',
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "frameworks_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_frameworks" ("createdAt", "description", "id", "isActive", "name", "region", "shortName", "slug", "version") SELECT "createdAt", "description", "id", "isActive", "name", "region", "shortName", "slug", "version" FROM "frameworks";
DROP TABLE "frameworks";
ALTER TABLE "new_frameworks" RENAME TO "frameworks";
CREATE UNIQUE INDEX "frameworks_slug_key" ON "frameworks"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
