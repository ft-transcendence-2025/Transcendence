/*
  Warnings:

  - You are about to drop the column `role` on the `Friendship` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Friendship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterUsername" TEXT NOT NULL,
    "addresseeUsername" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" DATETIME NOT NULL,
    CONSTRAINT "Friendship_requesterUsername_fkey" FOREIGN KEY ("requesterUsername") REFERENCES "User" ("username") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Friendship_addresseeUsername_fkey" FOREIGN KEY ("addresseeUsername") REFERENCES "User" ("username") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Friendship" ("addresseeUsername", "createdAt", "id", "requesterUsername", "status", "updateAt") SELECT "addresseeUsername", "createdAt", "id", "requesterUsername", "status", "updateAt" FROM "Friendship";
DROP TABLE "Friendship";
ALTER TABLE "new_Friendship" RENAME TO "Friendship";
CREATE INDEX "Friendship_requesterUsername_idx" ON "Friendship"("requesterUsername");
CREATE INDEX "Friendship_addresseeUsername_idx" ON "Friendship"("addresseeUsername");
CREATE UNIQUE INDEX "Friendship_requesterUsername_addresseeUsername_key" ON "Friendship"("requesterUsername", "addresseeUsername");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("active", "createdAt", "email", "id", "password", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "username") SELECT "active", "createdAt", "email", "id", "password", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
