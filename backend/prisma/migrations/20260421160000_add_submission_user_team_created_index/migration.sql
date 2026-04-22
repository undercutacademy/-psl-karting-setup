-- Compound index to accelerate "last submission for this user on this team" lookup.
-- Matches Prisma's findFirst({ where: { user:{email}, team:{slug} }, orderBy: { createdAt: desc } }).
CREATE INDEX IF NOT EXISTS "Submission_userId_teamId_createdAt_idx"
  ON "Submission" ("userId", "teamId", "createdAt" DESC);
