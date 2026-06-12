import {
  ApplicationStatus,
  JobType,
  Prisma,
  Role,
  Title,
} from '@prisma/client';

const SEED_COUNT = 10;

const skills = [
  'TypeScript',
  'Node.js',
  'PostgreSQL',
  'React',
  'Prisma',
  'Docker',
  'Redis',
  'Elasticsearch',
  'Jest',
  'REST APIs',
];

const industries = [
  'Software',
  'Finance',
  'Healthcare',
  'Education',
  'Retail',
  'Logistics',
  'Manufacturing',
  'Hospitality',
  'Marketing',
  'Telecommunications',
];

const benefits = [
  'Medical aid',
  'Remote work',
  'Flexible hours',
  'Paid leave',
  'Training budget',
  'Performance bonus',
  'Equipment allowance',
  'Retirement plan',
  'Wellness program',
  'Career coaching',
];

export interface SeedFaker {
  date: {
    future: () => Date;
    past: () => Date;
  };
  helpers: {
    arrayElement: <T>(items: T[]) => T;
    arrayElements: <T>(items: T[], count: number) => T[];
  };
  internet: {
    email: (options: { firstName: string; lastName: string }) => string;
    url: () => string;
  };
  location: {
    city: () => string;
  };
  lorem: {
    paragraph: () => string;
    sentence: () => string;
  };
  number: {
    int: (options: { min: number; max: number }) => number;
  };
  person: {
    firstName: () => string;
    fullName: () => string;
    jobTitle: () => string;
    lastName: () => string;
  };
  phone: {
    number: () => string;
  };
  string: {
    uuid: () => string;
  };
}

export interface SeedData {
  users: Prisma.UserCreateManyInput[];
  admins: Prisma.AdminCreateManyInput[];
  candidates: Prisma.CandidateCreateManyInput[];
  employers: Prisma.EmployerCreateManyInput[];
  jobs: Prisma.JobCreateManyInput[];
  applications: Prisma.ApplicationCreateManyInput[];
}

const seedUuid = (group: number, index: number): string => {
  const suffix = `${group}${index.toString().padStart(11, '0')}`;
  return `00000000-0000-4000-8000-${suffix}`;
};

const seedUserId = (role: Role, index: number): string =>
  `seed-${role}-user-${index.toString().padStart(2, '0')}`;

const seedEmail = (
  faker: SeedFaker,
  role: Role,
  index: number,
  firstName: string,
  lastName: string,
): string => {
  const email = faker.internet
    .email({ firstName, lastName })
    .toLowerCase()
    .replace(/[^a-z0-9@._+-]/g, '');

  return `seed.${role}.${index}.${email}`;
};

const seedPhone = (roleIndex: number, index: number): string =>
  `+270${roleIndex}${index.toString().padStart(8, '0')}`;

const buildUsers = (faker: SeedFaker): Prisma.UserCreateManyInput[] => {
  const roles = [Role.admin, Role.candidate, Role.employer];

  return roles.flatMap((role, roleIndex) =>
    Array.from({ length: SEED_COUNT }, (_, itemIndex) => {
      const index = itemIndex + 1;
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();

      return {
        id: seedUserId(role, index),
        name: `${firstName} ${lastName}`,
        email: seedEmail(faker, role, index, firstName, lastName),
        phone: seedPhone(roleIndex + 1, index),
        password: 'SeedPassword123!',
        role,
        emailVerified: true,
        isVerified: true,
        isActive: true,
        isLocked: false,
      };
    }),
  );
};

export const buildSeedData = (faker: SeedFaker): SeedData => {
  const users = buildUsers(faker);

  const admins: Prisma.AdminCreateManyInput[] = Array.from(
    { length: SEED_COUNT },
    (_, itemIndex) => {
      const index = itemIndex + 1;

      return {
        id: seedUuid(1, index),
        userId: seedUserId(Role.admin, index),
        permissions: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
      };
    },
  );

  const candidates: Prisma.CandidateCreateManyInput[] = Array.from(
    { length: SEED_COUNT },
    (_, itemIndex) => {
      const index = itemIndex + 1;

      return {
        id: seedUuid(2, index),
        title: faker.helpers.arrayElement([
          Title.Mr,
          Title.Mrs,
          Title.Ms,
          Title.Dr,
          Title.Prof,
        ]),
        skills: faker.helpers.arrayElements(skills, 5),
        isEmployed: index % 3 === 0,
        userId: seedUserId(Role.candidate, index),
      };
    },
  );

  const employers: Prisma.EmployerCreateManyInput[] = Array.from(
    { length: SEED_COUNT },
    (_, itemIndex) => {
      const index = itemIndex + 1;

      return {
        id: seedUuid(3, index),
        industry: faker.helpers.arrayElement(industries),
        websiteUrl: faker.internet.url(),
        location: faker.location.city(),
        description: faker.lorem.paragraph(),
        size: faker.number.int({ min: 10, max: 2500 }),
        foundedIn: faker.date.past().getFullYear(),
        isVerified: index % 2 === 0,
        userId: seedUserId(Role.employer, index),
      };
    },
  );

  const jobs: Prisma.JobCreateManyInput[] = Array.from(
    { length: SEED_COUNT },
    (_, itemIndex) => {
      const index = itemIndex + 1;

      return {
        id: seedUuid(4, index),
        title: faker.person.jobTitle(),
        description: faker.lorem.paragraph(),
        responsibilities: Array.from({ length: 3 }, () =>
          faker.lorem.sentence(),
        ),
        requirements: faker.helpers.arrayElements(skills, 4),
        benefits: faker.helpers.arrayElements(benefits, 4),
        location: faker.location.city(),
        type: faker.helpers.arrayElement([
          JobType.full_time,
          JobType.part_time,
          JobType.contract,
          JobType.internship,
        ]),
        vacancy: faker.number.int({ min: 1, max: 8 }),
        deadline: faker.date.future(),
        tags: faker.helpers.arrayElements(skills, 5),
        employerId: seedUuid(3, (itemIndex % employers.length) + 1),
        views: faker.number.int({ min: 0, max: 500 }),
        isPublic: true,
      };
    },
  );

  const applications: Prisma.ApplicationCreateManyInput[] = Array.from(
    { length: SEED_COUNT },
    (_, itemIndex) => {
      const index = itemIndex + 1;

      return {
        id: seedUuid(5, index),
        jobId: seedUuid(4, (itemIndex % jobs.length) + 1),
        candidateId: seedUuid(2, (itemIndex % candidates.length) + 1),
        status: faker.helpers.arrayElement([
          ApplicationStatus.pending,
          ApplicationStatus.accepted,
          ApplicationStatus.rejected,
        ]),
        coverLetter: faker.lorem.paragraph(),
        resumeUrl: faker.internet.url(),
      };
    },
  );

  return {
    users,
    admins,
    candidates,
    employers,
    jobs,
    applications,
  };
};
