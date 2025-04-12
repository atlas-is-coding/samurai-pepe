/*
  Warnings:

  - You are about to drop the `TelegramAuth` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `walletAddress` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "TelegramAuth_token_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TelegramAuth";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "TelegramAuthSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isAuthorized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "TelegramAuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "referredBy" TEXT,
    "hasPurchasedNft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "twitterUsername" TEXT,
    "telegramId" TEXT,
    "telegramUsername" TEXT
);
INSERT INTO "new_User" ("createdAt", "hasPurchasedNft", "id", "points", "referredBy", "telegramId", "telegramUsername", "twitterUsername", "updatedAt", "walletAddress") SELECT "createdAt", "hasPurchasedNft", "id", "points", "referredBy", "telegramId", "telegramUsername", "twitterUsername", "updatedAt", "walletAddress" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TelegramAuthSession_token_key" ON "TelegramAuthSession"("token");

-- CreateIndex
CREATE INDEX "TelegramAuthSession_userId_idx" ON "TelegramAuthSession"("userId");

-- CreateIndex
CREATE INDEX "TelegramAuthSession_token_idx" ON "TelegramAuthSession"("token");
