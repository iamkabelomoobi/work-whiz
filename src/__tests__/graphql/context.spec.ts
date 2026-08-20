import { GraphQLError } from 'graphql';
import { Context, createContext } from '@work-whiz/app/context';
import { auth } from '@work-whiz/libs';
import { Role } from '@work-whiz/types/roles.type';

jest.mock('@work-whiz/libs', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

const mockedAuth = jest.mocked(auth);

describe('GraphQL context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the Better Auth session from request headers', async () => {
    const session = {
      user: {
        id: 'user-1',
        role: Role.CANDIDATE,
        name: 'Candidate User',
        email: 'candidate@example.com',
      },
      session: {
        id: 'session-1',
      },
    };

    mockedAuth.api.getSession.mockResolvedValue(session as never);

    const context = await createContext({
      req: {
        headers: {
          cookie: 'better-auth.session_token=token',
        },
      } as never,
    });

    expect(context.session).toEqual(session);
    expect(context.user).toEqual(session.user);
    expect(context.isAuthenticated).toBe(true);
    expect(mockedAuth.api.getSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
    });
  });

  it('returns an unauthenticated context when no session exists', async () => {
    mockedAuth.api.getSession.mockResolvedValue(null);

    const context = await createContext({
      req: {
        headers: {},
      } as never,
    });

    expect(context.session).toBeNull();
    expect(context.user).toBeNull();
    expect(context.isAuthenticated).toBe(false);
  });

  it('throws UNAUTHENTICATED when auth is required without a session', () => {
    expect(() =>
      Context.internal().assertAuth(),
    ).toThrow(GraphQLError);

    try {
      Context.internal().assertAuth();
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      expect((error as GraphQLError).extensions.code).toBe('UNAUTHENTICATED');
    }
  });

  it('throws FORBIDDEN when the user role is not allowed', () => {
    const context = Context.internal({
      user: {
        id: 'user-1',
        role: Role.CANDIDATE,
      },
      session: {},
    });

    expect(() => context.assertRole(['admin'])).toThrow(GraphQLError);

    try {
      context.assertRole(['admin']);
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      expect((error as GraphQLError).extensions.code).toBe('FORBIDDEN');
    }
  });
});
