-- CreateTable
CREATE TABLE "BountyRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractType" TEXT NOT NULL,
    "githubOwner" TEXT NOT NULL,
    "githubRepo" TEXT NOT NULL,
    "githubIssueNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "suggestedAmount" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "requestedByUserId" TEXT NOT NULL,
    "fundedBountyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BountyRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BountyRequest_fundedBountyId_fkey" FOREIGN KEY ("fundedBountyId") REFERENCES "Bounty" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BountyRequest_fundedBountyId_key" ON "BountyRequest"("fundedBountyId");

-- CreateIndex
CREATE INDEX "BountyRequest_githubOwner_githubRepo_status_idx" ON "BountyRequest"("githubOwner", "githubRepo", "status");
