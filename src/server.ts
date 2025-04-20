import 'reflect-metadata';
import '@work-whiz/queues/workers/authentication.worker';
import dotenv from 'dotenv';
import http from 'http';
import ip from 'ip';
import os from 'os';
import cluster from 'cluster';
import { Application } from 'express';
import { cleanEnv, num, str } from 'envalid';
import { logger } from '@work-whiz/utils';
import { sequelize } from '@work-whiz/libs';
import { associateModels } from '@work-whiz/models/associate';

dotenv.config();

/**
 * Server configuration options
 */
interface ServerOptions {
  port?: number;
  syncDatabase?: boolean;
  forceSync?: boolean;
  enableClusterMode?: boolean;
  enableHealthCheck?: boolean;
  rateLimitOptions?: {
    windowMs?: number;
    max?: number;
  };
}

/**
 * Validates and cleans environment variables
 */
const env = cleanEnv(process.env, {
  PORT: num({ default: 8080 }),
  NODE_ENV: str({
    choices: ['development', 'test', 'production'],
    default: 'development',
  }),
  POSTGRES_HOST: str({ default: 'localhost' }),
  POSTGRES_PORT: num({ default: 5432 }),
  POSTGRES_DATABASE_NAME: str(),
  POSTGRES_USERNAME: str(),
  POSTGRES_PASSWORD: str(),
});

/**
 * Handles server errors with specific messages
 * @param {NodeJS.ErrnoException} error - The error object
 * @param {number} port - The port number
 */
const handleServerError = (
  error: NodeJS.ErrnoException,
  port: number,
): void => {
  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      break;
    default:
      logger.error('Server error', {
        error: error.message,
        stack: error.stack,
      });
  }

  process.exit(1);
};

/**
 * Sets up graceful shutdown handlers for the server
 * @param {http.Server} server - The HTTP server instance
 */
const setupGracefulShutdown = (server: http.Server): void => {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`, {
      pid: process.pid,
    });

    try {
      if (sequelize) {
        await sequelize.close();
        logger.info('Database connection closed');
      }

      server.close(err => {
        if (err) {
          logger.error('Error during server close', { error: err });
          process.exit(1);
        }
        logger.info('Server closed');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 10000).unref();
    } catch (error) {
      logger.error('Error during shutdown', {
        error: error instanceof Error ? error.message : error,
      });
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGQUIT', () => shutdown('SIGQUIT'));

  process.on('uncaughtException', error => {
    logger.error('Uncaught exception', {
      error: error.message,
      stack: error.stack,
    });
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    shutdown('unhandledRejection');
  });
};

/**
 * Starts the HTTP server and connects to the database
 * @param {Application} app - Express application instance
 * @param {ServerOptions} [options] - Server configuration options
 * @returns {Promise<http.Server>} The created HTTP server instance
 * @throws {Error} If server fails to start or database connection fails
 *
 * @example
 * // Basic usage
 * await startServer(app);
 *
 * // With custom options
 * await startServer(app, {
 *   port: 3000,
 *   syncDatabase: true,
 *   forceSync: false,
 *   enableClusterMode: true
 * });
 */
export const startServer = async (
  app: Application,
  options: ServerOptions = {},
): Promise<http.Server> => {
  const {
    port = env.PORT,
    enableClusterMode = false,
    enableHealthCheck = true,
    rateLimitOptions = {
      windowMs: 15 * 60 * 1000,
      max: 100,
    },
  } = options;

  if (enableClusterMode && cluster.isPrimary) {
    const numCPUs = os.cpus().length;
    logger.info(`Master ${process.pid} is running with ${numCPUs} workers`);

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      logger.warn(
        `Worker ${worker.process.pid} died with code ${code} and signal ${signal}`,
      );
      logger.info('Starting a new worker');
      cluster.fork();
    });

    return http.createServer((req, res) => {
      res.writeHead(500);
      res.end('Requests should be handled by worker processes');
    });
  }

  try {
    await sequelize.authenticate();

    associateModels();

    await sequelize.sync({ force: false, alter: true });

    logger.info('Database connection established successfully', {
      dbHost: env.POSTGRES_HOST,
      dbName: env.POSTGRES_DATABASE_NAME,
    });

    // if (syncDatabase) {
    //   await sequelize.sync({
    //     force: forceSync,
    //     alter: !forceSync && env.NODE_ENV === 'development',
    //   });
    //   logger.info(`Database sync completed`, {
    //     force: forceSync,
    //     alter: !forceSync && env.NODE_ENV === 'development',
    //   });
    // }

    if (enableHealthCheck) {
      // app.get('/health', (req, res) => {
      //   res.status(200).json({
      //     status: 'UP',
      //     timestamp: new Date().toISOString(),
      //     uptime: process.uptime(),
      //     database: sequelize.authenticate ? 'connected' : 'disconnected',
      //   });
      // });
      // Health check route
      app.get('/health', (req, res) => {
        // Sample health data - replace with your actual health metrics
        const healthData = {
          status: 'OK',
          services: [
            { name: 'Database', status: 'OK', responseTime: '24ms' },
            { name: 'API', status: 'OK', responseTime: '156ms' },
            { name: 'Cache', status: 'WARNING', responseTime: '342ms' },
          ],
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        };

        // Render the health.ejs template with the healthData
        res.render('health', healthData);
      });
    }

    if (rateLimitOptions) {
      const { default: rateLimit } = await import('express-rate-limit');
      app.use(
        rateLimit({
          windowMs: rateLimitOptions.windowMs,
          max: rateLimitOptions.max,
          message: 'Too many requests from this IP, please try again later',
        }),
      );
    }

    const server = http.createServer(app);

    return new Promise<http.Server>((resolve, reject) => {
      server.listen(port, () => {
        const host = `http://${ip.address()}:${port}`;
        logger.info('Server started successfully', {
          host,
          platform: os.platform(),
          pid: process.pid,
          environment: env.NODE_ENV,
          clusterWorker: enableClusterMode && !cluster.isPrimary,
        });

        setupGracefulShutdown(server);

        resolve(server);
      });

      server.on('error', (error: NodeJS.ErrnoException) => {
        handleServerError(error, port);
        reject(error);
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      environment: env.NODE_ENV,
    });
    process.exit(1);
  }
};
