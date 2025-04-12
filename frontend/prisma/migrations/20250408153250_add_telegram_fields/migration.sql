/*
  Warnings:

  - You are about to drop the `CompletedQuest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "CompletedQuest_userId_questId_key";

-- DropIndex
DROP INDEX "CompletedQuest_userId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CompletedQuest";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "QuestCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "questId" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "referredBy" TEXT,
    "inviteCode" TEXT,
    "hasPurchasedNft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "twitterUsername" TEXT,
    "telegramId" TEXT,
    "telegramUsername" TEXT,
    "name" TEXT
);
INSERT INTO "new_User" ("createdAt", "hasPurchasedNft", "id", "inviteCode", "points", "referredBy", "twitterUsername", "updatedAt", "walletAddress") SELECT "createdAt", "hasPurchasedNft", "id", "inviteCode", "points", "referredBy", "twitterUsername", "updatedAt", "walletAddress" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");
CREATE UNIQUE INDEX "User_inviteCode_key" ON "User"("inviteCode");
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "QuestCompletion_userId_idx" ON "QuestCompletion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestCompletion_userId_questId_key" ON "QuestCompletion"("userId", "questId");
