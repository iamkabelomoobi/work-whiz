import { graphql } from 'graphql';
import { schema } from '@work-whiz/graphql';
import { Context } from '@work-whiz/app/context';
import { Role } from '@work-whiz/types/roles.type';
import {
  adminService,
  candidateService,
  employerService,
  userService,
} from '@work-whiz/services';

jest.mock('@work-whiz/libs', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock('@work-whiz/services', () => ({
  adminService: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
  candidateService: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
  employerService: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
  userService: {
    updateContact: jest.fn(),
    deleteAccount: jest.fn(),
  },
}));

jest.mock('@work-whiz/validators', () => ({
  adminValidator: jest.fn(() => null),
  candidateValidator: jest.fn(() => null),
  employerValidator: jest.fn(() => null),
  emailValidator: jest.fn(() => null),
  phoneValidator: jest.fn(() => null),
}));

const mockedCandidateService = jest.mocked(candidateService);
const mockedEmployerService = jest.mocked(employerService);
const mockedUserService = jest.mocked(userService);

const contextWithUser = (user: { id: string; role: Role; email?: string }) =>
  Context.internal({
    user,
    session: {},
  });

describe('profile GraphQL schema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves me from the authenticated session user', async () => {
    const result = await graphql({
      schema,
      source: '{ me { id email role } }',
      contextValue: contextWithUser({
        id: 'user-1',
        email: 'candidate@example.com',
        role: Role.CANDIDATE,
      }),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      me: {
        id: 'user-1',
        email: 'candidate@example.com',
        role: 'candidate',
      },
    });
  });

  it('resolves the current candidate profile by session user id', async () => {
    mockedCandidateService.findOne.mockResolvedValue({
      id: 'candidate-profile-1',
      userId: 'user-1',
      title: 'Mr',
      skills: ['typescript'],
      user: {
        id: 'user-1',
        name: 'Candidate User',
        email: 'candidate@example.com',
      },
    });

    const result = await graphql({
      schema,
      source: '{ candidateProfile { id userId title skills user { id email } } }',
      contextValue: contextWithUser({
        id: 'user-1',
        role: Role.CANDIDATE,
      }),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      candidateProfile: {
        id: 'candidate-profile-1',
        userId: 'user-1',
        title: 'Mr',
        skills: ['typescript'],
        user: {
          id: 'user-1',
          email: 'candidate@example.com',
        },
      },
    });
    expect(mockedCandidateService.findOne).toHaveBeenCalledWith({
      userId: 'user-1',
    });
  });

  it('updates contact details through the shared user service', async () => {
    mockedUserService.updateContact.mockResolvedValue(undefined);

    const result = await graphql({
      schema,
      source: `
        mutation {
          updateContact(input: { email: "new@example.com", phone: "+27821234567" }) {
            message
          }
        }
      `,
      contextValue: contextWithUser({
        id: 'user-1',
        role: Role.CANDIDATE,
      }),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      updateContact: {
        message: 'Contact information updated successfully',
      },
    });
    expect(mockedUserService.updateContact).toHaveBeenCalledWith('user-1', {
      email: 'new@example.com',
      phone: '+27821234567',
    });
  });

  it('blocks employer profile updates for candidate users', async () => {
    const result = await graphql({
      schema,
      source: `
        mutation {
          updateEmployerProfile(input: { industry: "Technology" }) {
            message
          }
        }
      `,
      contextValue: contextWithUser({
        id: 'user-1',
        role: Role.CANDIDATE,
      }),
    });

    expect(result.errors?.[0].message).toBe(
      'Not authorized to resolve Mutation.updateEmployerProfile',
    );
    expect(mockedEmployerService.update).not.toHaveBeenCalled();
  });
});
