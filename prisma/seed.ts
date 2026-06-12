import 'dotenv/config';
import { faker } from '@faker-js/faker';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

import { buildSeedData } from '../src/scripts/seed-data';

const connectionString = process.env['DATABASE_URL'];

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearDatabase(): Promise<void> {
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.employer.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
}

async function main(): Promise<void> {
  const seedData = buildSeedData(faker);

  await clearDatabase();

  await prisma.user.createMany({ data: seedData.users });
  await prisma.admin.createMany({ data: seedData.admins });
  await prisma.candidate.createMany({ data: seedData.candidates });
  await prisma.employer.createMany({ data: seedData.employers });
  await prisma.job.createMany({ data: seedData.jobs });
  await prisma.application.createMany({ data: seedData.applications });

  console.log({
    users: seedData.users.length,
    admins: seedData.admins.length,
    candidates: seedData.candidates.length,
    employers: seedData.employers.length,
    jobs: seedData.jobs.length,
    applications: seedData.applications.length,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
