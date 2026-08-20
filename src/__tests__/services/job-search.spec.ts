import { jobService } from '../../services/job.service';
import { jobRepository } from '@work-whiz/repositories';
import { cacheUtil } from '@work-whiz/utils';

jest.mock('@work-whiz/errors', () => ({
  ServiceError: class ServiceError extends Error {
    public statusCode: number;

    constructor(statusCode: number, options: { message: string }) {
      super(options.message);
      this.statusCode = statusCode;
    }
  },
}));

jest.mock('@work-whiz/repositories', () => ({
  jobRepository: {
    search: jest.fn(),
    readAll: jest.fn(),
  },
}));

jest.mock('@work-whiz/utils', () => ({
  cacheUtil: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    deletePattern: jest.fn(),
  },
}));

const mockedJobRepository = jest.mocked(jobRepository);
const mockedCacheUtil = jest.mocked(cacheUtil);

describe('JobService Elasticsearch search', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockedCacheUtil.get.mockResolvedValue(null);
    mockedCacheUtil.set.mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('uses Elasticsearch search for job listings', async () => {
    const payload = {
      jobs: [
        {
          id: 'job-1',
          title: 'TypeScript Engineer',
          description: 'Build APIs',
          responsibilities: ['Build APIs'],
          requirements: ['TypeScript'],
          benefits: ['Remote work'],
          location: 'Cape Town',
          type: 'Full-time' as const,
          deadline: new Date('2027-01-01T00:00:00.000Z'),
          tags: ['TypeScript'],
        },
      ],
      total: 1,
      totalPages: 1,
      currentPage: 1,
      perPage: 10,
    };

    mockedJobRepository.search.mockResolvedValue(payload);

    const result = await jobService.findJobs(
      { title: 'typescript' },
      { page: 1, limit: 10 },
    );

    expect(result).toBe(payload);
    expect(mockedJobRepository.search).toHaveBeenCalledWith(
      { title: 'typescript' },
      { page: 1, limit: 10 },
    );
    expect(mockedJobRepository.readAll).not.toHaveBeenCalled();
  });

  it('falls back to Prisma listings when Elasticsearch search fails', async () => {
    const fallbackPayload = {
      jobs: [
        {
          id: 'job-2',
          title: 'Backend Engineer',
          description: 'Build services',
          responsibilities: ['Build services'],
          requirements: ['Node.js'],
          benefits: ['Training budget'],
          location: 'Johannesburg',
          type: 'Contract' as const,
          deadline: new Date('2027-02-01T00:00:00.000Z'),
          tags: ['Node.js'],
        },
      ],
      total: 1,
      totalPages: 1,
      currentPage: 1,
      perPage: 10,
    };

    mockedJobRepository.search.mockRejectedValue(new Error('ES unavailable'));
    mockedJobRepository.readAll.mockResolvedValue(fallbackPayload);

    const result = await jobService.findJobs({}, { page: 1, limit: 10 });

    expect(result).toBe(fallbackPayload);
    expect(mockedJobRepository.search).toHaveBeenCalledWith(
      {},
      { page: 1, limit: 10 },
    );
    expect(mockedJobRepository.readAll).toHaveBeenCalledWith(
      {},
      { page: 1, limit: 10 },
    );
  });
});
