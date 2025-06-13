/**
 * Interface representing the configuration settings.
 */
export interface IConfig {
  /**
   * Authentication configuration settings.
   */
  authentication: {
    api: {
      secret: string;
    };
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
      /** The host address of the Redis instance */
      host: string;
      /** The port number of the Redis instance */
      port: number;
      /** The password for accessing the Redis instance */
      password: string;
    };
  };
  /**
   * Frontend configuration settings.
   */
  frontend: {
    admin: string;
    candidate: string;
    employer: string;
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
