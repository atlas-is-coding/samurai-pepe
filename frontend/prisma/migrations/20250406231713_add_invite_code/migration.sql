/*
  Warnings:

  - You are about to drop the `TelegramAuthSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `telegramId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `telegramUsername` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "TelegramAuthSession_token_idx";

-- DropIndex
DROP INDEX "TelegramAuthSession_userId_idx";

-- DropIndex
DROP INDEX "TelegramAuthSession_token_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TelegramAuthSession";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "referredBy" TEXT,
    "inviteCode" TEXT,
    "hasPurchasedNft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "twitterUsername" TEXT
);
INSERT INTO "new_User" ("createdAt", "hasPurchasedNft", "id", "points", "referredBy", "twitterUsername", "updatedAt", "walletAddress") SELECT "createdAt", "hasPurchasedNft", "id", "points", "referredBy", "twitterUsername", "updatedAt", "walletAddress" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");
CREATE UNIQUE INDEX "User_inviteCode_key" ON "User"("inviteCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
