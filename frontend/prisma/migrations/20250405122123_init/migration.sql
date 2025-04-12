-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "referredBy" TEXT,
    "hasPurchasedNft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserReferral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "referredAddress" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserReferral_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReferralLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerAddress" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferralLog_referrerAddress_fkey" FOREIGN KEY ("referrerAddress") REFERENCES "User" ("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReferralLog_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "User" ("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "UserReferral_userId_idx" ON "UserReferral"("userId");

-- CreateIndex
CREATE INDEX "ReferralLog_referrerAddress_idx" ON "ReferralLog"("referrerAddress");

-- CreateIndex
CREATE INDEX "ReferralLog_userAddress_idx" ON "ReferralLog"("userAddress");
