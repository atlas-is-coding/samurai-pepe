-- CreateTable
CREATE TABLE "TelegramVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "telegramChatId" INTEGER,
    "telegramUsername" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TelegramVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramVerification_verificationCode_key" ON "TelegramVerification"("verificationCode");

-- CreateIndex
CREATE INDEX "TelegramVerification_userId_idx" ON "TelegramVerification"("userId");

-- CreateIndex
CREATE INDEX "TelegramVerification_verificationCode_idx" ON "TelegramVerification"("verificationCode");
