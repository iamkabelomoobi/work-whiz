import { jobRepository } from './job.repository';
import { elasticsearch, prisma } from '@work-whiz/libs';

jest.mock('@work-whiz/errors', () => ({
  RepositoryError: class RepositoryError extends Error {
    constructor(message: string) {
      super(message);
    }
  },
}));

jest.mock('@work-whiz/libs', () => ({
  elasticsearch: {
    indices: {
      exists: jest.fn(),
      create: jest.fn(),
    },
    index: jest.fn(),
    search: jest.fn(),
    delete: jest.fn(),
  },
  prisma: {
    job: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@work-whiz/utils', () => ({
  Pagination: class Pagination {
    public page: number;
    public limit: number;

    constructor(options: { page?: number; limit?: number }) {
      this.page = options.page ?? 1;
      this.limit = options.limit ?? 10;
    }

    getOffset(): number {
      return (this.page - 1) * this.limit;
    }

    getTotalPages(total: number): number {
      return Math.ceil(total / this.limit);
    }
  },
}));

const mockedElasticsearch = jest.mocked(elasticsearch);
const mockedPrisma = jest.mocked(prisma);

describe('JobRepository Elasticsearch integration', () => {
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    mockedElasticsearch.indices.exists.mockResolvedValue(false);
    mockedElasticsearch.indices.create.mockResolvedValue({} as never);
    mockedElasticsearch.index.mockResolvedValue({} as never);
  });

  afterEach(() => {
    consoleDebugSpy.mockRestore();
  });

  it('creates the jobs index and indexes a complete searchable job document', async () => {
    mockedPrisma.job.create.mockResolvedValue({
      id: 'job-1',
      title: 'Senior TypeScript Engineer',
      description: 'Build reliable APIs',
      responsibilities: ['Build APIs'],
      requirements: ['TypeScript'],
      benefits: ['Remote work'],
      location: 'Cape Town',
      type: 'full_time',
      vacancy: 2,
      deadline: new Date('2027-01-01T00:00:00.000Z'),
      tags: ['TypeScript', 'Node.js'],
      employerId: 'employer-1',
      views: 12,
      isPublic: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      employer: {
        id: 'employer-1',
        industry: 'Software',
        websiteUrl: 'https://example.com',
        location: 'Cape Town',
        description: 'A software company',
        size: 50,
        foundedIn: 2020,
        isVerified: true,
        userId: 'user-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        user: {
          id: 'user-1',
          name: 'Acme Jobs',
          email: 'jobs@example.com',
          phone: '+27000000001',
          image: null,
          emailVerified: true,
          role: 'employer',
          isVerified: true,
          isActive: true,
          isLocked: false,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        },
      },
    } as never);

    await jobRepository.create({
      title: 'Senior TypeScript Engineer',
      description: 'Build reliable APIs',
      responsibilities: ['Build APIs'],
      requirements: ['TypeScript'],
      benefits: ['Remote work'],
      location: 'Cape Town',
      type: 'Full-time',
      deadline: new Date('2027-01-01T00:00:00.000Z'),
      tags: ['TypeScript', 'Node.js'],
      employerId: 'employer-1',
    });

    expect(mockedElasticsearch.indices.create).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 'jobs',
        mappings: expect.objectContaining({
          properties: expect.objectContaining({
            title: expect.objectContaining({ type: 'text' }),
            tags: expect.objectContaining({ type: 'keyword' }),
            type: expect.objectContaining({ type: 'keyword' }),
          }),
        }),
      }),
    );
    expect(mockedElasticsearch.index).toHaveBeenCalledWith({
      index: 'jobs',
      id: 'job-1',
      document: expect.objectContaining({
        id: 'job-1',
        title: 'Senior TypeScript Engineer',
        responsibilities: ['Build APIs'],
        requirements: ['TypeScript'],
        benefits: ['Remote work'],
        deadline: new Date('2027-01-01T00:00:00.000Z'),
        employerId: 'employer-1',
        employerName: 'Acme Jobs',
        type: 'Full-time',
      }),
    });
  });
});
