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

  expect(response.status).toBe(200);

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

  it.each<[
    SignupRole,
    string,
    string,
  ]>([
    ['candidate', '/api/candidates/me', '/api/admins/me'],
    ['admin', '/api/admins/me', '/api/candidates/me'],
    ['employer', '/api/employers/me', '/api/admins/me'],
  ])(
    'creates a %s user through Better Auth and authorizes protected routes',
    async (role, allowedRoute, forbiddenRoute) => {
      const { email } = await signUpUser(role);
      await verifyEmail(email);

      const session = await signInUser(email, password);

      const allowedResponse = await api.get(allowedRoute, {
        headers: {
          Cookie: session.cookie,
        },
      });
      expect(allowedResponse.status).toBe(200);

      const forbiddenResponse = await api.get(forbiddenRoute, {
        headers: {
          Cookie: session.cookie,
        },
      });
      expect(forbiddenResponse.status).toBe(403);

      const user = await prisma.user.findFirst({
        where: { email },
      });
      expect(user).toBeTruthy();
      expect(user?.emailVerified).toBe(true);
      expect(user?.isVerified).toBe(true);
      expect(user?.role).toBe(role);

      if (role === 'candidate') {
        const profile = await prisma.candidate.findFirst({
          where: { userId: user!.id },
        });
        expect(profile).toMatchObject({
          title: 'Mr',
        });
      }

      if (role === 'admin') {
        const profile = await prisma.admin.findFirst({
          where: { userId: user!.id },
        });
        expect(profile).toBeTruthy();
      }

      if (role === 'employer') {
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

    const oldSessionResponse = await api.get('/api/candidates/me', {
      headers: {
        Cookie: session.cookie,
      },
    });
    expect(oldSessionResponse.status).toBe(401);

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
});
