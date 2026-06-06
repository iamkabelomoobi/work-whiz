-- Better Auth and the dash plugin use string IDs. Keep domain entity IDs as UUIDs,
-- but allow Users.id and user foreign keys to store Better Auth string IDs.
ALTER TABLE "Admins" DROP CONSTRAINT IF EXISTS "Admins_userId_fkey";
ALTER TABLE "Candidates" DROP CONSTRAINT IF EXISTS "Candidates_userId_fkey";
ALTER TABLE "Employers" DROP CONSTRAINT IF EXISTS "Employers_userId_fkey";
ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_userId_fkey";
ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_userId_fkey";

ALTER TABLE "Users" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "Users" ALTER COLUMN "id" TYPE TEXT USING "id"::TEXT;
ALTER TABLE "Admins" ALTER COLUMN "userId" TYPE TEXT USING "userId"::TEXT;
ALTER TABLE "Candidates" ALTER COLUMN "userId" TYPE TEXT USING "userId"::TEXT;
ALTER TABLE "Employers" ALTER COLUMN "userId" TYPE TEXT USING "userId"::TEXT;
ALTER TABLE "session" ALTER COLUMN "userId" TYPE TEXT USING "userId"::TEXT;
ALTER TABLE "account" ALTER COLUMN "userId" TYPE TEXT USING "userId"::TEXT;

ALTER TABLE "Admins" ADD CONSTRAINT "Admins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Candidates" ADD CONSTRAINT "Candidates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Employers" ADD CONSTRAINT "Employers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
