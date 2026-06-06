-- Drop duplicated profile-level name columns. User.name is the canonical name.
ALTER TABLE "Admins" DROP COLUMN IF EXISTS "firstName";
ALTER TABLE "Admins" DROP COLUMN IF EXISTS "lastName";
ALTER TABLE "Candidates" DROP COLUMN IF EXISTS "firstName";
ALTER TABLE "Candidates" DROP COLUMN IF EXISTS "lastName";
ALTER TABLE "Employers" DROP COLUMN IF EXISTS "name";
