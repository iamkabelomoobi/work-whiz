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
  POSTGRES_USERNAME,

  // Redis Configuration
  REDIS_URL,

  // Logging
  LOGTAIL_ACCESS_TOKEN,

  // Email Configuration
  NODEMAILER_HOST,
  NODEMAILER_PASSWORD,
  NODEMAILER_PORT,
  NODEMAILER_SERVICE,
  NODEMAILER_USERNAME,

  // Email Branding
  MAILGEN_PRODUCT_COPYRIGHT,
  MAILGEN_PRODUCT_LINK,
  MAILGEN_PRODUCT_LOGO,
  MAILGEN_PRODUCT_NAME,
  MAILGEN_PRODUCT_THEME,
} = process.env;

/**
 * Application configuration object.
 * @type {IConfig}
 */
export const config: IConfig = {
  authentication: {
    api: {
      secret: API_SECRET_KEY || 'dummy-api-secret',
    },
    argon: {
      admin: {
        pepper: ADMIN_ARGON2_PEPPER || 'dummy-admin-pepper',
      },
      employer: {
        pepper: EMPLOYER_ARGON2_PEPPER || 'dummy-employer-pepper',
      },
      candidate: {
        pepper: CANDIDATE_ARGON2_PEPPER || 'dummy-candidate-pepper',
      },
    },
    jwt: {
      admin: {
        access: ADMIN_ACCESS_KEY || 'dummy-admin-access-key',
        refresh: ADMIN_REFRESH_ACCESS_KEY || 'dummy-admin-refresh-key',
        password_setup: ADMIN_PASSWORD_SETUP || 'dummy-admin-password-setup',
        password_reset: ADMIN_PASSWORD_RESET || 'dummy-admin-password-reset',
      },
      employer: {
        access: EMPLOYER_ACCESS_KEY || 'dummy-employer-access-key',
        refresh: EMPLOYER_REFRESH_ACCESS_KEY || 'dummy-employer-refresh-key',
        password_setup:
          EMPLOYER_PASSWORD_SETUP || 'dummy-employer-password-setup',
        password_reset:
          EMPLOYER_PASSWORD_RESET || 'dummy-employer-password-reset',
      },
      candidate: {
        access: CANDIDATE_ACCESS_KEY || 'dummy-candidate-access-key',
        refresh: CANDIDATE_REFRESH_ACCESS_KEY || 'dummy-candidate-refresh-key',
        password_setup:
          CANDIDATE_PASSWORD_SETUP || 'dummy-candidate-password-setup',
        password_reset:
          CANDIDATE_PASSWORD_RESET || 'dummy-candidate-password-reset',
      },
    },
  },
  database: {
    postgres: {
      databaseName: POSTGRES_DATABASE_NAME || 'dummy-database-name',
      username: POSTGRES_USERNAME || 'dummy-username',
      password: POSTGRES_PASSWORD || 'dummy-password',
      host: POSTGRES_HOST || 'dummy-host',
    },
    redis: {
      uri: REDIS_URL || 'dummy-redis-url',
    },
  },
  logger: {
    logtail: {
      accessToken: LOGTAIL_ACCESS_TOKEN || 'dummy-logtail-access-token',
    },
  },
  notification: {
    mailgen: {
      theme: MAILGEN_PRODUCT_THEME || 'default',
      product: {
        name: MAILGEN_PRODUCT_NAME || 'Dummy Product',
        link: MAILGEN_PRODUCT_LINK || 'https://dummy-link.com',
        logo: MAILGEN_PRODUCT_LOGO || 'https://dummy-logo.com/logo.png',
        copyright: MAILGEN_PRODUCT_COPYRIGHT || '© Dummy Copyright',
      },
    },
    nodemailer: {
      service: NODEMAILER_SERVICE || 'dummy-service',
      host: NODEMAILER_HOST || 'dummy-host',
      port: parseInt(NODEMAILER_PORT) || 994,
      secure: true,
      auth: {
        user: NODEMAILER_USERNAME || 'dummy-username',
        pass: NODEMAILER_PASSWORD || 'dummy-password',
      },
    },
  },
};
