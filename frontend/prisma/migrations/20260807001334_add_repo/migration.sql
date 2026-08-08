-- CreateTable
CREATE TABLE "Repo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "githubOwner" TEXT NOT NULL,
    "githubRepo" TEXT NOT NULL,
    "description" TEXT,
    "primaryLanguage" TEXT,
    "topics" TEXT,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "avatarUrl" TEXT,
    "addedByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Repo_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Repo_githubOwner_githubRepo_idx" ON "Repo"("githubOwner", "githubRepo");

-- CreateIndex
CREATE UNIQUE INDEX "Repo_githubOwner_githubRepo_key" ON "Repo"("githubOwner", "githubRepo");
