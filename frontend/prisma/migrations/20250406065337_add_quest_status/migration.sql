-- AlterTable
ALTER TABLE "User" ADD COLUMN "twitterUsername" TEXT;

-- CreateTable
CREATE TABLE "CompletedQuest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "questId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompletedQuest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CompletedQuest_userId_idx" ON "CompletedQuest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompletedQuest_userId_questId_key" ON "CompletedQuest"("userId", "questId");
