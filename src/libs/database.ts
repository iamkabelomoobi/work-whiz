/* eslint-disable @typescript-eslint/no-explicit-any */

import { Redis } from 'ioredis';
import { Sequelize, Dialect } from 'sequelize';
import { config } from '@work-whiz/configs/config';

class DatabaseLib {
  private static instance: DatabaseLib;

  private constructor() {
    // Private constructor to prevent instantiation
  }

  public sequelizeConnect = (): Sequelize => {
    return new Sequelize(
      config?.database?.postgres?.databaseName,
      config?.database?.postgres?.username,
      config?.database?.postgres?.password,
      {
        host: config?.database?.postgres?.host,
        dialect: 'postgres' as Dialect,
        protocol: 'postgres',
        pool: {
          max: 5,
          acquire: 30000,
          idle: 10000,
        },
        logging: false,
      },
    );
  };

  /**
   * Get the singleton instance of DatabaseLib.
   * @returns {DatabaseLib} The singleton instance.
   * @public
   */
  public static getInstance(): DatabaseLib {
    if (!DatabaseLib.instance) {
      DatabaseLib.instance = new DatabaseLib();
    }
    return DatabaseLib.instance;
  }

  /**
   * Connect to Redis.
   * @returns {Redis} The Redis client.
   * @public
   */
  public redisClient(): Redis {
    return new Redis(config?.database?.redis?.uri);
  }
}

const dbInstance = DatabaseLib.getInstance();
const sequelize: Sequelize = dbInstance.sequelizeConnect();
const redis: Redis = dbInstance.redisClient();

export { sequelize, redis };
