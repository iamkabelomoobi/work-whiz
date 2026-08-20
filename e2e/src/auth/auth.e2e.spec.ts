import axios from 'axios';
import { randomUUID } from 'crypto';
import { prisma } from '../../../src/libs/database';

const baseURL = process.env.E2E_BASE_URL || axios.defaults.baseURL;
const mailBaseURL = process.env.MAILDEV_WEB_URL || 'http://127.0.0.1:1080';

if (!baseURL) {
  throw new Error('E2E base URL is not configured');
}

const api = axios.create({
  baseURL,
  headers: {
    Origin: baseURL,
  },
  validateStatus: () => true,
});

const mailApi = axios.create({
  baseURL: mailBaseURL,
  validateStatus: () => true,
});

const runId = randomUUID();
const emailPrefix = `e2e-auth-${runId}`;
const password = 'AuthTest!12345';
const newPassword = 'AuthTest!67890';

type SignupRole = 'admin' | 'candidate' | 'employer';
type GraphQLResponse<TData> = {
  data?: TData;
  errors?: Array<{
    message: string;
    extensions?: Record<string, unknown>;
  }>;
};

const buildEmail = (role: SignupRole): string =>
  `${emailPrefix}.${role}@example.com`;

const cookieHeader = (response: { headers: { 'set-cookie'?: string[] } }): string =>
  (response.headers['set-cookie'] || [])
    .map(value => value.split(';')[0])
    .join('; ');

const sleep = async (ms: number): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, ms));
};

const deleteTestData = async (): Promise<void> => {
  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: emailPrefix,
      },
    },
  });

  await prisma.verification.deleteMany({
    where: {
      identifier: { startsWith: `reset-password:` },
    },
  });
};

const getVerificationTokenFromEmail = async (
  email: string,
): Promise<string> => {
  for (let attempt = 0; attempt < 30; attempt++) {
    const emailsResponse = await mailApi.get('/email', {
      params: { 'to.address': email },
    });

    expect(emailsResponse.status).toBe(200);

    const emails = Array.isArray(emailsResponse.data) ? emailsResponse.data : [];
    const latest = emails[0];

    if (latest?.id) {
      const htmlResponse = await mailApi.get(`/email/${latest.id}/html`);
      expect(htmlResponse.status).toBe(200);

      const html = String(htmlResponse.data || '');
      const match = html.match(/verify-email\?token=([^"&]+)/);
      if (match?.[1]) {
        return decodeURIComponent(match[1]);
      }
    }

    await sleep(1000);
  }

  throw new Error(`Timed out waiting for verification email for ${email}`);
};

const signUpUser = async (
  role: SignupRole,
): Promise<{ email: string; cookie: string }> => {
  const email = buildEmail(role);

  const rolePayload =
    role === 'admin'
      ? {}
      : role === 'candidate'
        ? { title: 'Mr' }
        : {
            industry: 'Technology',
            websiteUrl: 'https://example.com',
            location: 'Remote',
            description: 'Test employer',
            size: 25,
            foundedIn: 2020,
          };

  const response = await api.post('/api/auth/sign-up/email', {
    name: `${role} user`,
    email,
    password,
    phone: `+2700000${Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0')}`,
    role,
    ...rolePayload,
  });

  if (response.status !== 200) {
    throw new Error(
      `Expected sign up to return 200, received ${response.status}: ${JSON.stringify(
        response.data,
      )}`,
    );
  }

  return {
    email,
    cookie: cookieHeader(response),
  };
};

const verifyEmail = async (email: string): Promise<void> => {
  const token = await getVerificationTokenFromEmail(email);
  const response = await api.get('/api/auth/verify-email', {
    params: { token },
  });

  expect(response.status).toBe(200);
};

const signInUser = async (
  email: string,
  currentPassword: string,
): Promise<{ cookie: string }> => {
  const response = await api.post('/api/auth/sign-in/email', {
    email,
    password: currentPassword,
  });

  expect(response.status).toBe(200);
  expect(response.headers['set-cookie']).toBeDefined();

  return { cookie: cookieHeader(response) };
};

const graphQLRequest = async <TData>(
  cookie: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<GraphQLResponse<TData>> => {
  const response = await api.post(
    '/graphql',
    { query, variables },
    {
      headers: {
        Cookie: cookie,
      },
    },
  );

  expect(response.status).toBe(200);

  return response.data as GraphQLResponse<TData>;
};

const requestPasswordResetToken = async (email: string): Promise<string> => {
  const response = await api.post('/api/auth/request-password-reset', {
    email,
    redirectTo: 'http://localhost:4200/reset-password',
  });

  expect(response.status).toBe(200);

  for (let attempt = 0; attempt < 30; attempt++) {
    const verification = await prisma.verification.findFirst({
      where: {
        identifier: {
          startsWith: 'reset-password:',
        },
        value: {
          not: '',
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (verification?.identifier) {
      return verification.identifier.replace('reset-password:', '');
    }

    await sleep(1000);
  }

  throw new Error(`Timed out waiting for password reset token for ${email}`);
};

describe('Auth e2e', () => {
  beforeAll(async () => {
    await deleteTestData();
  });

  afterAll(async () => {
    await deleteTestData();
    await prisma.$disconnect();
  });

  it.each<SignupRole>(['candidate', 'admin', 'employer'])(
    'creates a %s user through Better Auth and authorizes GraphQL profile access',
    async role => {
      const { email } = await signUpUser(role);
      await verifyEmail(email);

      const session = await signInUser(email, password);
      const meResult = await graphQLRequest<{
        me: {
          email: string;
          role: SignupRole;
        };
      }>(
        session.cookie,
        `
          query Me {
            me {
              email
              role
            }
          }
        `,
      );

      expect(meResult.errors).toBeUndefined();
      expect(meResult.data?.me).toMatchObject({ email, role });

      const user = await prisma.user.findFirst({
        where: { email },
      });
      expect(user).toBeTruthy();
      expect(user?.emailVerified).toBe(true);
      expect(user?.isVerified).toBe(true);
      expect(user?.role).toBe(role);

      if (role === 'candidate') {
        const profileResult = await graphQLRequest<{
          candidateProfile: {
            title: string;
            user: {
              email: string;
              role: SignupRole;
            };
          };
        }>(
          session.cookie,
          `
            query CandidateProfile {
              candidateProfile {
                title
                user {
                  email
                  role
                }
              }
            }
          `,
        );

        expect(profileResult.errors).toBeUndefined();
        expect(profileResult.data?.candidateProfile).toMatchObject({
          title: 'Mr',
          user: { email, role },
        });

        const profile = await prisma.candidate.findFirst({
          where: { userId: user!.id },
        });
        expect(profile).toMatchObject({
          title: 'Mr',
        });
      }

      if (role === 'admin') {
        const profileResult = await graphQLRequest<{
          adminProfile: {
            permissions: string[];
            user: {
              email: string;
              role: SignupRole;
            };
          };
        }>(
          session.cookie,
          `
            query AdminProfile {
              adminProfile {
                permissions
                user {
                  email
                  role
                }
              }
            }
          `,
        );

        expect(profileResult.errors).toBeUndefined();
        expect(profileResult.data?.adminProfile?.permissions).toEqual(
          expect.any(Array),
        );
        expect(profileResult.data?.adminProfile?.user).toMatchObject({
          email,
          role,
        });

        const profile = await prisma.admin.findFirst({
          where: { userId: user!.id },
        });
        expect(profile).toBeTruthy();
      }

      if (role === 'employer') {
        const profileResult = await graphQLRequest<{
          employerProfile: {
            industry: string;
            websiteUrl: string;
            location: string;
            description: string;
            size: number;
            foundedIn: number;
            user: {
              email: string;
              role: SignupRole;
            };
          };
        }>(
          session.cookie,
          `
            query EmployerProfile {
              employerProfile {
                industry
                websiteUrl
                location
                description
                size
                foundedIn
                user {
                  email
                  role
                }
              }
            }
          `,
        );

        expect(profileResult.errors).toBeUndefined();
        expect(profileResult.data?.employerProfile).toMatchObject({
          industry: 'Technology',
          websiteUrl: 'https://example.com',
          location: 'Remote',
          description: 'Test employer',
          size: 25,
          foundedIn: 2020,
          user: { email, role },
        });

        const profile = await prisma.employer.findFirst({
          where: { userId: user!.id },
        });
        expect(profile).toMatchObject({
          industry: 'Technology',
        });
      }
    },
  );

  it('resets a password, revokes the old session, and allows the new password', async () => {
    const { email } = await signUpUser('candidate');
    await verifyEmail(email);

    const session = await signInUser(email, password);

    const resetToken = await requestPasswordResetToken(email);
    const resetResponse = await api.post('/api/auth/reset-password', {
      newPassword,
      token: resetToken,
    });

    expect(resetResponse.status).toBe(200);

    const oldSessionResponse = await graphQLRequest<{
      me?: {
        id: string;
      };
    }>(
      session.cookie,
      `
        query Me {
          me {
            id
          }
        }
      `,
    );
    expect(oldSessionResponse.errors?.[0].message).toBe(
      'Not authorized to resolve Query.me',
    );

    const oldPasswordLogin = await api.post('/api/auth/sign-in/email', {
      email,
      password,
    });
    expect(oldPasswordLogin.status).toBe(401);

    const newLogin = await api.post('/api/auth/sign-in/email', {
      email,
      password: newPassword,
    });

    expect(newLogin.status).toBe(200);
    expect(newLogin.headers['set-cookie']).toBeDefined();

    const signedOut = await api.post(
      '/api/auth/sign-out',
      {},
      {
        headers: {
          Cookie: cookieHeader(newLogin),
        },
      },
    );
    expect(signedOut.status).toBe(200);
  });

  it('authenticates with Better Auth and performs candidate profile CRUD through GraphQL', async () => {
    const { email } = await signUpUser('candidate');
    await verifyEmail(email);

    const session = await signInUser(email, password);

    const meResult = await graphQLRequest<{
      me: {
        id: string;
        email: string;
        role: SignupRole;
      };
    }>(
      session.cookie,
      `
        query Me {
          me {
            id
            email
            role
          }
        }
      `,
    );

    expect(meResult.errors).toBeUndefined();
    expect(meResult.data?.me).toMatchObject({
      email,
      role: 'candidate',
    });

    const profileResult = await graphQLRequest<{
      candidateProfile: {
        id: string;
        title: string;
        skills: string[];
        user: {
          email: string;
          role: SignupRole;
        };
      };
    }>(
      session.cookie,
      `
        query CandidateProfile {
          candidateProfile {
            id
            title
            skills
            user {
              email
              role
            }
          }
        }
      `,
    );

    expect(profileResult.errors).toBeUndefined();
    expect(profileResult.data?.candidateProfile).toMatchObject({
      title: 'Mr',
      skills: [],
      user: {
        email,
        role: 'candidate',
      },
    });

    const updateProfileResult = await graphQLRequest<{
      updateCandidateProfile: {
        message: string;
      };
    }>(
      session.cookie,
      `
        mutation UpdateCandidateProfile($input: CandidateProfileInput!) {
          updateCandidateProfile(input: $input) {
            message
          }
        }
      `,
      {
        input: {
          title: 'Dr',
          skills: ['typescript', 'graphql'],
          isEmployed: true,
        },
      },
    );

    expect(updateProfileResult.errors).toBeUndefined();
    expect(updateProfileResult.data?.updateCandidateProfile).toEqual({
      message: 'Candidate account updated successfully.',
    });

    const newEmail = `${emailPrefix}.candidate.updated@example.com`;
    const updateContactResult = await graphQLRequest<{
      updateContact: {
        message: string;
      };
    }>(
      session.cookie,
      `
        mutation UpdateContact($input: ContactInput!) {
          updateContact(input: $input) {
            message
          }
        }
      `,
      {
        input: {
          email: newEmail,
          phone: '+27820000001',
        },
      },
    );

    expect(updateContactResult.errors).toBeUndefined();
    expect(updateContactResult.data?.updateContact).toEqual({
      message: 'Contact information updated successfully',
    });

    const forbiddenEmployerUpdate = await graphQLRequest<{
      updateEmployerProfile?: {
        message: string;
      };
    }>(
      session.cookie,
      `
        mutation ForbiddenEmployerUpdate {
          updateEmployerProfile(input: { industry: "Finance" }) {
            message
          }
        }
      `,
    );

    expect(forbiddenEmployerUpdate.errors?.[0].message).toBe(
      'Not authorized to resolve Mutation.updateEmployerProfile',
    );

    const user = await prisma.user.findFirstOrThrow({
      where: { email: newEmail },
      include: { candidate: true },
    });

    expect(user).toMatchObject({
      email: newEmail,
      phone: '+27820000001',
      role: 'candidate',
    });
    expect(user.candidate).toMatchObject({
      title: 'Dr',
      skills: ['typescript', 'graphql'],
      isEmployed: true,
    });

    const deleteAccountResult = await graphQLRequest<{
      deleteAccount: {
        message: string;
      };
    }>(
      session.cookie,
      `
        mutation DeleteAccount {
          deleteAccount {
            message
          }
        }
      `,
    );

    expect(deleteAccountResult.errors).toBeUndefined();
    expect(deleteAccountResult.data?.deleteAccount).toEqual({
      message: 'User deleted successfully',
    });

    const deletedUser = await prisma.user.findFirst({
      where: { id: user.id },
      include: { candidate: true },
    });

    expect(deletedUser).toBeNull();
  });
});
