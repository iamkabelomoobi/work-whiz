import { StatusCodes } from 'http-status-codes';
import {
  adminRepository,
  candidateRepository,
  employerRepository,
} from '@work-whiz/repositories';
import { cacheUtil } from '@work-whiz/utils';
import { adminService } from '@work-whiz/services/admin.service';
import { candidateService } from '@work-whiz/services/candidate.service';
import { employerService } from '@work-whiz/services/employer.service';

jest.mock('@work-whiz/errors', () => ({
  ServiceError: class ServiceError extends Error {
    public readonly statusCode: number;

    constructor(statusCode: number, details: { message: string }) {
      super(details.message);
      this.name = 'ServiceError';
      this.statusCode = statusCode;
    }
  },
}));

jest.mock('@work-whiz/configs/config', () => ({
  config: {
    logger: {
      logtail: {
        accessToken: '',
      },
    },
  },
}));

jest.mock('@work-whiz/repositories', () => ({
  adminRepository: {
    read: jest.fn(),
    readAll: jest.fn(),
  },
  candidateRepository: {
    read: jest.fn(),
    readAll: jest.fn(),
  },
  employerRepository: {
    read: jest.fn(),
    readAll: jest.fn(),
  },
}));

jest.mock('@work-whiz/utils', () => ({
  cacheUtil: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedAdminRepository = jest.mocked(adminRepository);
const mockedCandidateRepository = jest.mocked(candidateRepository);
const mockedEmployerRepository = jest.mocked(employerRepository);
const mockedCacheUtil = jest.mocked(cacheUtil);

describe('fetch user profiles', () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockedCacheUtil.get.mockResolvedValue(null);
    mockedCacheUtil.set.mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('fetches the current candidate profile by user id', async () => {
    const candidate = {
      id: 'candidate-profile-id',
      userId: 'candidate-user-id',
      title: 'Mr',
      skills: ['typescript'],
      user: {
        id: 'candidate-user-id',
        name: 'Candidate User',
        email: 'candidate@example.com',
      },
    };

    mockedCandidateRepository.read.mockResolvedValue(candidate);

    await expect(
      candidateService.findOne({ userId: candidate.userId }),
    ).resolves.toEqual(candidate);

    expect(mockedCacheUtil.get).toHaveBeenCalledWith(
      `candidate:${candidate.userId}`,
    );
    expect(mockedCandidateRepository.read).toHaveBeenCalledWith({
      userId: candidate.userId,
    });
  });

  it('fetches paginated candidate profiles', async () => {
    const candidate = {
      id: 'candidate-profile-id',
      userId: 'candidate-user-id',
      title: 'Mr',
    };

    mockedCandidateRepository.readAll.mockResolvedValue({
      candidates: [candidate],
      total: 1,
      totalPages: 1,
      currentPage: 1,
      perPage: 10,
    });

    await expect(
      candidateService.findAll({}, { page: 1, limit: 10 }),
    ).resolves.toEqual({
      candidates: [candidate],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
      },
    });
  });

  it('fetches the current employer profile by user id and caches it', async () => {
    const employer = {
      id: 'employer-profile-id',
      userId: 'employer-user-id',
      industry: 'Technology',
      user: {
        id: 'employer-user-id',
        name: 'Employer User',
        email: 'employer@example.com',
      },
    };

    mockedEmployerRepository.read.mockResolvedValue(employer);

    await expect(
      employerService.findOne({ userId: employer.userId }),
    ).resolves.toEqual(employer);

    expect(mockedCacheUtil.get).toHaveBeenCalledWith(
      `employer:${employer.userId}`,
    );
    expect(mockedEmployerRepository.read).toHaveBeenCalledWith({
      userId: employer.userId,
    });
    expect(mockedCacheUtil.set).toHaveBeenCalledWith(
      `employer:${employer.userId}`,
      employer,
      3600,
    );
  });

  it('fetches paginated employer profiles', async () => {
    const employer = {
      id: 'employer-profile-id',
      userId: 'employer-user-id',
      industry: 'Technology',
    };

    mockedEmployerRepository.readAll.mockResolvedValue({
      employers: [employer],
      total: 1,
      totalPages: 1,
      currentPage: 1,
      perPage: 10,
    });

    await expect(
      employerService.findAll({}, { page: 1, limit: 10 }),
    ).resolves.toEqual({
      employers: [employer],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
      },
    });
  });

  it('fetches the current admin profile by user id and caches it', async () => {
    const admin = {
      id: 'admin-profile-id',
      userId: 'admin-user-id',
      permissions: [],
      user: {
        id: 'admin-user-id',
        name: 'Admin User',
        email: 'admin@example.com',
      },
    };

    mockedAdminRepository.read.mockResolvedValue(admin);

    await expect(adminService.findOne({ userId: admin.userId })).resolves.toEqual(
      admin,
    );

    expect(mockedCacheUtil.get).toHaveBeenCalledWith(`admin:${admin.userId}`);
    expect(mockedAdminRepository.read).toHaveBeenCalledWith({
      userId: admin.userId,
    });
    expect(mockedCacheUtil.set).toHaveBeenCalledWith(
      `admin:${admin.userId}`,
      admin,
      3600,
    );
  });

  it('fetches paginated admin profiles', async () => {
    const admin = {
      id: 'admin-profile-id',
      userId: 'admin-user-id',
      permissions: [],
    };

    mockedAdminRepository.readAll.mockResolvedValue({
      admins: [admin],
      total: 1,
      totalPages: 1,
      currentPage: 1,
      perPage: 10,
    });

    await expect(
      adminService.findAll({}, { page: 1, limit: 10 }),
    ).resolves.toEqual({
      admins: [admin],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
      },
    });
  });

  it('throws a not found service error when no candidate profiles match', async () => {
    mockedCandidateRepository.readAll.mockResolvedValue({
      candidates: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
      perPage: 10,
    });

    await expect(
      candidateService.findAll({}, { page: 1, limit: 10 }),
    ).rejects.toMatchObject({
      statusCode: StatusCodes.NOT_FOUND,
      message: 'No candidates found matching the provided query.',
    });
  });
});
