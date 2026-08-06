-- CreateTable
CREATE TABLE "Bounty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractType" TEXT NOT NULL,
    "onChainIssueId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "githubOwner" TEXT NOT NULL,
    "githubRepo" TEXT NOT NULL,
    "githubIssueNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'funded',
    "fundedTxHash" TEXT,
    "releaseTxHash" TEXT,
    "createdByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Bounty_githubOwner_githubRepo_githubIssueNumber_status_idx" ON "Bounty"("githubOwner", "githubRepo", "githubIssueNumber", "status");
