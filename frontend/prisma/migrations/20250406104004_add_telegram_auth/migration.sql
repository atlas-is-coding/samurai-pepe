/*
  Warnings:

  - You are about to drop the `TelegramVerification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "TelegramVerification_verificationCode_idx";

-- DropIndex
DROP INDEX "TelegramVerification_userId_idx";

-- DropIndex
DROP INDEX "TelegramVerification_verificationCode_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TelegramVerification";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "TelegramAuth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "telegramUserId" BIGINT,
    "telegramUsername" TEXT,
    "questId" INTEGER,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "referredBy" TEXT,
    "hasPurchasedNft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "twitterUsername" TEXT,
    "telegramId" TEXT,
    "telegramUsername" TEXT
);
INSERT INTO "new_User" ("createdAt", "hasPurchasedNft", "id", "points", "referredBy", "twitterUsername", "updatedAt", "walletAddress") SELECT "createdAt", "hasPurchasedNft", "id", "points", "referredBy", "twitterUsername", "updatedAt", "walletAddress" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TelegramAuth_token_key" ON "TelegramAuth"("token");
