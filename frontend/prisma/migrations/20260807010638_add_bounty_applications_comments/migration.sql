-- CreateTable
CREATE TABLE "BountyApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bountyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BountyApplication_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "Bounty" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BountyApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BountyComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bountyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BountyComment_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "Bounty" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BountyComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bounty" (
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
    "updatedAt" DATETIME NOT NULL,
    "assignedUserId" TEXT,
    CONSTRAINT "Bounty_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Bounty" ("contractType", "createdAt", "createdByUserId", "fundedTxHash", "githubIssueNumber", "githubOwner", "githubRepo", "id", "milestoneId", "onChainIssueId", "releaseTxHash", "status", "updatedAt") SELECT "contractType", "createdAt", "createdByUserId", "fundedTxHash", "githubIssueNumber", "githubOwner", "githubRepo", "id", "milestoneId", "onChainIssueId", "releaseTxHash", "status", "updatedAt" FROM "Bounty";
DROP TABLE "Bounty";
ALTER TABLE "new_Bounty" RENAME TO "Bounty";
CREATE INDEX "Bounty_githubOwner_githubRepo_githubIssueNumber_status_idx" ON "Bounty"("githubOwner", "githubRepo", "githubIssueNumber", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "BountyApplication_bountyId_status_idx" ON "BountyApplication"("bountyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BountyApplication_bountyId_userId_key" ON "BountyApplication"("bountyId", "userId");

-- CreateIndex
CREATE INDEX "BountyComment_bountyId_idx" ON "BountyComment"("bountyId");
