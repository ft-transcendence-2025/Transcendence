-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Friendship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterUsername" TEXT NOT NULL,
    "addresseeUsername" TEXT NOT NULL,
    "blockedByUsername" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" DATETIME NOT NULL,
    CONSTRAINT "Friendship_requesterUsername_fkey" FOREIGN KEY ("requesterUsername") REFERENCES "User" ("username") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Friendship_addresseeUsername_fkey" FOREIGN KEY ("addresseeUsername") REFERENCES "User" ("username") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Friendship_blockedByUsername_fkey" FOREIGN KEY ("blockedByUsername") REFERENCES "User" ("username") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Friendship" ("addresseeUsername", "createdAt", "id", "requesterUsername", "status", "updateAt") SELECT "addresseeUsername", "createdAt", "id", "requesterUsername", "status", "updateAt" FROM "Friendship";
DROP TABLE "Friendship";
ALTER TABLE "new_Friendship" RENAME TO "Friendship";
CREATE INDEX "Friendship_requesterUsername_idx" ON "Friendship"("requesterUsername");
CREATE INDEX "Friendship_addresseeUsername_idx" ON "Friendship"("addresseeUsername");
CREATE UNIQUE INDEX "Friendship_requesterUsername_addresseeUsername_key" ON "Friendship"("requesterUsername", "addresseeUsername");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
