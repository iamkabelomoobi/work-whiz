import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { authenticationTemplate } from '@work-whiz/templates';
import { notificationUtil } from '../utils/notification.util';
import { prisma } from './database';
import { Role } from '@prisma/client';

const authBaseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

type SignUpProfileBody = {
  role?: string;
  title?: string;
  industry?: string;
  websiteUrl?: string;
  location?: string;
  description?: string;
  size?: number;
  foundedIn?: number;
};

const createUserbyRole = async (
  user: { id: string; name?: string; role?: unknown },
  body: SignUpProfileBody = {},
) => {
  const role = String(user.role || body.role || 'candidate');

  if (role === Role.admin) {
    throw new Error('Admin role cannot be assigned during sign up');
  }

  if (role === Role.candidate) {
    await prisma.candidate.create({
      data: {
        userId: user.id,
        title: body.title as never,
      },
    });
  }
  if (role === Role.employer) {
    await prisma.employer.create({
      data: {
        userId: user.id,
        industry: body.industry || '',
        websiteUrl: body.websiteUrl,
        location: body.location,
        description: body.description,
        size: body.size,
        foundedIn: body.foundedIn,
      },
    });
  }
};

export const auth = betterAuth({
  appName: process.env.APP_NAME || 'WorkWhiz',
  baseURL: authBaseUrl,
  basePath: '/api/auth',
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  user: {
    additionalFields: {
      phone: {
        type: 'string',
        required: true,
        input: true,
      },
      role: {
        type: 'string',
        required: true,
        input: true,
        defaultValue: 'candidate',
      },
      isVerified: {
        type: 'boolean',
        required: false,
        input: false,
        defaultValue: false,
      },
      isActive: {
        type: 'boolean',
        required: false,
        input: false,
        defaultValue: true,
      },
      isLocked: {
        type: 'boolean',
        required: false,
        input: false,
        defaultValue: false,
      },
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      try {
        const verificationUrl = new URL(url);
        const callbackUrl = new URL('/auth/verified', authBaseUrl).toString();

        verificationUrl.searchParams.set('callbackURL', callbackUrl);

        void notificationUtil.sendEmail(
          user.email,
          `Verify your ${process.env.APP_NAME || 'WorkWhiz'} account`,
          authenticationTemplate.emailVerification(
            verificationUrl.toString(),
            user.name || user.email,
          ),
        );
      } catch (error) {
        console.error('Failed to send email verification', { error });
      }
    },
    afterEmailVerification: async user => {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });

      void notificationUtil.sendEmail(
        user.email,
        `Welcome to ${process.env.APP_NAME || 'WorkWhiz'}`,
        authenticationTemplate.welcome(user.name || user.email),
      );
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url, token }) => {
      try {
        void notificationUtil.sendEmail(
          user.email,
          'Password reset request',
          authenticationTemplate.passwordReset(url, user.name || user.email),
        );
      } catch (error) {
        console.error('Error sending reset password email', { error, token });
      }
    },
    onPasswordReset: async ({ user }) => {
      try {
        void notificationUtil.sendEmail(
          user.email,
          'Your password was changed',
          authenticationTemplate.passwordUpdateNotice(user.name || user.email),
        );
      } catch (error) {
        console.error('Error sending password update email', { error });
      }
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user, context) => {
          await createUserbyRole(
            user,
            (context?.body || {}) as SignUpProfileBody,
          );
        },
      },
      update: {
        after: async user => {
          if (user.emailVerified) {
            await prisma.user.update({
              where: { id: user.id },
              data: { isVerified: true },
            });
          }
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    database: {
      generateId: 'uuid',
    },
    ipAddress: {
      ipv6Subnet: 64,
    },
  },
  rateLimit: {
    enabled: process.env.NODE_ENV === 'production',
    window: 60,
    max: 100,
  },
});
