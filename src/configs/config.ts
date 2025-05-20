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
      secret: API_SECRET_KEY,
    },
    argon: {
      admin: {
        pepper: ADMIN_ARGON2_PEPPER,
      },
      employer: {
        pepper: EMPLOYER_ARGON2_PEPPER,
      },
      candidate: {
        pepper: CANDIDATE_ARGON2_PEPPER,
      },
    },
    jwt: {
      admin: {
        access: ADMIN_ACCESS_KEY,
        refresh: ADMIN_REFRESH_ACCESS_KEY,
        password_setup: ADMIN_PASSWORD_SETUP,
        password_reset: ADMIN_PASSWORD_RESET,
      },
      employer: {
        access: EMPLOYER_ACCESS_KEY,
        refresh: EMPLOYER_REFRESH_ACCESS_KEY,
        password_setup: EMPLOYER_PASSWORD_SETUP,
        password_reset: EMPLOYER_PASSWORD_RESET,
      },
      candidate: {
        access: CANDIDATE_ACCESS_KEY,
        refresh: CANDIDATE_REFRESH_ACCESS_KEY,
        password_setup: CANDIDATE_PASSWORD_SETUP,
        password_reset: CANDIDATE_PASSWORD_RESET,
      },
    },
  },
  database: {
    postgres: {
      databaseName: POSTGRES_DATABASE_NAME,
      username: POSTGRES_USERNAME,
      password: POSTGRES_PASSWORD,
      host: POSTGRES_HOST,
    },
    redis: {
      host: REDIS_HOST,
      port: REDIS_PORT ? parseInt(REDIS_PORT) : undefined,
      password: REDIS_PASSWORD,
    },
  },
  logger: {
    logtail: {
      accessToken: LOGTAIL_ACCESS_TOKEN,
    },
  },
  notification: {
    mailgen: {
      theme: MAILGEN_PRODUCT_THEME,
      product: {
        name: MAILGEN_PRODUCT_NAME,
        link: MAILGEN_PRODUCT_LINK,
        logo: MAILGEN_PRODUCT_LOGO,
        copyright: MAILGEN_PRODUCT_COPYRIGHT,
      },
    },
    nodemailer: {
      service: NODEMAILER_SERVICE,
      host: NODEMAILER_HOST,
      port: NODEMAILER_PORT ? parseInt(NODEMAILER_PORT) : undefined,
      secure: true,
      auth: {
        user: NODEMAILER_USERNAME,
        pass: NODEMAILER_PASSWORD,
      },
    },
  },
};
