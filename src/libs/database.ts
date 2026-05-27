import { Redis } from 'ioredis';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { config } from '@work-whiz/configs/config';

class DatabaseLib {
  private static instance: DatabaseLib;

  private constructor() {
    // Private constructor to prevent instantiation.
  }

  public prismaClient(): PrismaClient {
    const databaseUrl =
      process.env.DATABASE_URL ||
      `postgresql://${config?.database?.postgres?.username}:${config?.database?.postgres?.password}@${config?.database?.postgres?.host}:${config?.database?.postgres?.port || 5432}/${config?.database?.postgres?.databaseName}`;

    return new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    });
  }

  public static getInstance(): DatabaseLib {
    if (!DatabaseLib.instance) {
      DatabaseLib.instance = new DatabaseLib();
    }
    return DatabaseLib.instance;
  }

  public redisClient(): Redis {
    return new Redis({
      host: config?.database?.redis?.host,
      port: config?.database?.redis?.port,
      password: config?.database?.redis?.password,
    });
  }
}

const dbInstance = DatabaseLib.getInstance();
const prisma: PrismaClient = dbInstance.prismaClient();
const redis: Redis = dbInstance.redisClient();

export { prisma, redis };
