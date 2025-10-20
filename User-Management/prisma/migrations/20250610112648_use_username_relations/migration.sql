/*
  Warnings:

  - You are about to drop the column `addresseeId` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `requesterId` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Profile` table. All the data in the column will be lost.
  - Added the required column `addresseeUsername` to the `Friendship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requesterUsername` to the `Friendship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userUsername` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

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
INSERT INTO "new_Friendship" ("createdAt", "id", "status", "updateAt") SELECT "createdAt", "id", "status", "updateAt" FROM "Friendship";
DROP TABLE "Friendship";
ALTER TABLE "new_Friendship" RENAME TO "Friendship";
CREATE INDEX "Friendship_requesterUsername_idx" ON "Friendship"("requesterUsername");
CREATE INDEX "Friendship_addresseeUsername_idx" ON "Friendship"("addresseeUsername");
CREATE UNIQUE INDEX "Friendship_requesterUsername_addresseeUsername_key" ON "Friendship"("requesterUsername", "addresseeUsername");
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'OFFLINE',
    "avatar" TEXT,
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
INSERT INTO "new_Profile" ("avatar", "bio", "createdAt", "firstName", "gender", "id", "language", "lastName", "nickName", "status", "updatedAt") SELECT "avatar", "bio", "createdAt", "firstName", "gender", "id", "language", "lastName", "nickName", "status", "updatedAt" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_nickName_key" ON "Profile"("nickName");
CREATE UNIQUE INDEX "Profile_userUsername_key" ON "Profile"("userUsername");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("active", "createdAt", "email", "id", "password", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "username") SELECT "active", "createdAt", "email", "id", "password", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
