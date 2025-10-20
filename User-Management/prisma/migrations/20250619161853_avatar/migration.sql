/*
  Warnings:

  - You are about to alter the column `avatar` on the `Profile` table. The data in that column could be lost. The data in that column will be cast from `String` to `Binary`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'OFFLINE',
    "avatar" BLOB,
    "bio" TEXT,
    "gender" TEXT,
    "nickName" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "language" TEXT DEFAULT 'ENGLISH',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userUsername" TEXT NOT NULL,
    CONSTRAINT "Profile_userUsername_fkey" FOREIGN KEY ("userUsername") REFERENCES "User" ("username") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("avatar", "bio", "createdAt", "firstName", "gender", "id", "language", "lastName", "nickName", "status", "updatedAt", "userUsername") SELECT "avatar", "bio", "createdAt", "firstName", "gender", "id", "language", "lastName", "nickName", "status", "updatedAt", "userUsername" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_nickName_key" ON "Profile"("nickName");
CREATE UNIQUE INDEX "Profile_userUsername_key" ON "Profile"("userUsername");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
