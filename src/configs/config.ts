/* This TypeScript code snippet is defining an application configuration object named `config` that
contains various settings and values for different parts of the application. */
import { IConfig } from '@work-whiz/interfaces';

const {
  // Authentication Secrets
  API_SECRET_KEY,
  ADMIN_ACCESS_KEY,
  EMPLOYER_ACCESS_KEY,
  CANDIDATE_ACCESS_KEY,
  ADMIN_REFRESH_ACCESS_KEY,
  EMPLOYER_REFRESH_ACCESS_KEY,
  CANDIDATE_REFRESH_ACCESS_KEY,

  // Argon2 Pepper Values
  ADMIN_ARGON2_PEPPER,
  EMPLOYER_ARGON2_PEPPER,
  CANDIDATE_ARGON2_PEPPER,

  // Password Templates
  ADMIN_PASSWORD_RESET,
  ADMIN_PASSWORD_SETUP,
  EMPLOYER_PASSWORD_RESET,
  EMPLOYER_PASSWORD_SETUP,
  CANDIDATE_PASSWORD_RESET,
  CANDIDATE_PASSWORD_SETUP,

  // Database Configuration
  POSTGRES_DATABASE_NAME,
  POSTGRES_HOST,
  POSTGRES_PASSWORD,
  POSTGRES_PORT,
  POSTGRES_USERNAME,

  // Redis Configuration
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,

  // Logging
  LOGTAIL_ACCESS_TOKEN,

  // Email Configuration
  NODEMAILER_HOST,
  NODEMAILER_PASSWORD,
  NODEMAILER_PORT,
  NODEMAILER_SERVICE,
  NODEMAILER_USERNAME,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,

  // Email Branding
  MAILGEN_PRODUCT_COPYRIGHT,
  MAILGEN_PRODUCT_LINK,
  MAILGEN_PRODUCT_LOGO,
  MAILGEN_PRODUCT_NAME,
  MAILGEN_PRODUCT_THEME,

  // Frontend URLs
  ADMIN_FRONTEND,
  CANDIDATE_FRONTEND,
  EMPLOYER_FRONTEND,
} = process.env;

const requireEnv = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const optionalEnv = (value: string | undefined): string => value ?? '';

const parsePort = (
  name: string,
  value: string | undefined,
  defaultValue?: number,
): number => {
  if (!value) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing required environment variable: ${name}`);
  }

  const port = parseInt(value, 10);
  if (Number.isNaN(port)) {
    throw new Error(`Invalid port in environment variable: ${name}`);
  }

  return port;
};

/**
 * Application configuration object.
 * @type {IConfig}
 */
export const config: IConfig = {
  authentication: {
    api: {
      secret: requireEnv('API_SECRET_KEY', API_SECRET_KEY),
    },
    argon: {
      admin: {
        pepper: requireEnv('ADMIN_ARGON2_PEPPER', ADMIN_ARGON2_PEPPER),
      },
      employer: {
        pepper: requireEnv('EMPLOYER_ARGON2_PEPPER', EMPLOYER_ARGON2_PEPPER),
      },
      candidate: {
        pepper: requireEnv('CANDIDATE_ARGON2_PEPPER', CANDIDATE_ARGON2_PEPPER),
      },
    },
    jwt: {
      admin: {
        access: requireEnv('ADMIN_ACCESS_KEY', ADMIN_ACCESS_KEY),
        refresh: requireEnv(
          'ADMIN_REFRESH_ACCESS_KEY',
          ADMIN_REFRESH_ACCESS_KEY,
        ),
        password_setup: requireEnv(
          'ADMIN_PASSWORD_SETUP',
          ADMIN_PASSWORD_SETUP,
        ),
        password_reset: requireEnv(
          'ADMIN_PASSWORD_RESET',
          ADMIN_PASSWORD_RESET,
        ),
      },
      employer: {
        access: requireEnv('EMPLOYER_ACCESS_KEY', EMPLOYER_ACCESS_KEY),
        refresh: requireEnv(
          'EMPLOYER_REFRESH_ACCESS_KEY',
          EMPLOYER_REFRESH_ACCESS_KEY,
        ),
        password_setup: requireEnv(
          'EMPLOYER_PASSWORD_SETUP',
          EMPLOYER_PASSWORD_SETUP,
        ),
        password_reset: requireEnv(
          'EMPLOYER_PASSWORD_RESET',
          EMPLOYER_PASSWORD_RESET,
        ),
      },
      candidate: {
        access: requireEnv('CANDIDATE_ACCESS_KEY', CANDIDATE_ACCESS_KEY),
        refresh: requireEnv(
          'CANDIDATE_REFRESH_ACCESS_KEY',
          CANDIDATE_REFRESH_ACCESS_KEY,
        ),
        password_setup: requireEnv(
          'CANDIDATE_PASSWORD_SETUP',
          CANDIDATE_PASSWORD_SETUP,
        ),
        password_reset: requireEnv(
          'CANDIDATE_PASSWORD_RESET',
          CANDIDATE_PASSWORD_RESET,
        ),
      },
    },
  },
  database: {
    postgres: {
      databaseName: requireEnv(
        'POSTGRES_DATABASE_NAME',
        POSTGRES_DATABASE_NAME,
      ),
      username: requireEnv('POSTGRES_USERNAME', POSTGRES_USERNAME),
      password: requireEnv('POSTGRES_PASSWORD', POSTGRES_PASSWORD),
      host: requireEnv('POSTGRES_HOST', POSTGRES_HOST),
      port: parsePort('POSTGRES_PORT', POSTGRES_PORT, 5432),
    },
    redis: {
      host: requireEnv('REDIS_HOST', REDIS_HOST),
      port: parsePort('REDIS_PORT', REDIS_PORT, 6380),
      password: optionalEnv(REDIS_PASSWORD),
    },
  },
  frontend: {
    admin: requireEnv('ADMIN_FRONTEND', ADMIN_FRONTEND),
    candidate: requireEnv('CANDIDATE_FRONTEND', CANDIDATE_FRONTEND),
    employer: requireEnv('EMPLOYER_FRONTEND', EMPLOYER_FRONTEND),
  },
  logger: {
    logtail: {
      accessToken: optionalEnv(LOGTAIL_ACCESS_TOKEN),
    },
  },
  notification: {
    mailgen: {
      theme: requireEnv('MAILGEN_PRODUCT_THEME', MAILGEN_PRODUCT_THEME),
      product: {
        name: requireEnv('MAILGEN_PRODUCT_NAME', MAILGEN_PRODUCT_NAME),
        link: requireEnv('MAILGEN_PRODUCT_LINK', MAILGEN_PRODUCT_LINK),
        logo: optionalEnv(MAILGEN_PRODUCT_LOGO),
        copyright: requireEnv(
          'MAILGEN_PRODUCT_COPYRIGHT',
          MAILGEN_PRODUCT_COPYRIGHT,
        ),
      },
    },
    nodemailer: {
      service: optionalEnv(NODEMAILER_SERVICE),
      host: requireEnv('NODEMAILER_HOST', NODEMAILER_HOST),
      port: parsePort('NODEMAILER_PORT', NODEMAILER_PORT),
      secure: true,
      auth: {
        user: optionalEnv(NODEMAILER_USERNAME),
        pass: optionalEnv(NODEMAILER_PASSWORD),
      },
    },
    resend: {
      apiKey: optionalEnv(RESEND_API_KEY),
      fromEmail: optionalEnv(RESEND_FROM_EMAIL),
    },
  },
};
