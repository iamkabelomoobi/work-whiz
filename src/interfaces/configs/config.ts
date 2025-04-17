/**
 * Interface representing the configuration settings.
 */
export interface IConfig {
  /**
   * Authentication configuration settings.
   */
  authentication: {
    argon: {
      admin: {
        pepper: string;
      };
      employer: {
        pepper: string;
      };
      candidate: {
        pepper: string;
      };
    };
    jwt: {
      admin: {
        access: string;
        refresh: string;
        password_setup: string;
        password_reset: string;
      };
      employer: {
        access: string;
        refresh: string;
        password_setup: string;
        password_reset: string;
      };
      candidate: {
        access: string;
        refresh: string;
        password_setup: string;
        password_reset: string;
      };
    };
  };
  /**
   * Database configuration settings.
   */
  database: {
    postgres: {
      /** The name of the PostgreSQL database */
      databaseName: string;
      /** The username for accessing the PostgreSQL database */
      username: string;
      /** The password for accessing the PostgreSQL database */
      password: string;
      /** The host address of the PostgreSQL database */
      host: string;
    };
    redis: {
      /** The URI for connecting to the Redis instance */
      uri: string;
    };
  };
  /**
   * Logger configuration settings.
   */
  logger: {
    logtail: {
      /**
       * The Logtail access token.
       */
      accessToken: string;
    };
  };
  /**
   * Notification configuration settings.
   */
  notification: {
    mailgen: {
      theme: string;
      product: {
        name: string;
        link: string;
        logo: string;
        copyright: string;
      };
    };
    nodemailer: {
      service: string;
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
  };
}
