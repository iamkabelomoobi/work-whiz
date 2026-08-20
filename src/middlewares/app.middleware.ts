import compression from 'compression';
import cors from 'cors';
import express, {
  Application,
  ErrorRequestHandler,
  RequestHandler,
} from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import swaggerUi from 'swagger-ui-express';
import { toNodeHandler } from 'better-auth/node';

import { swaggerSpec } from '@work-whiz/configs/swagger';
import { auth } from '@work-whiz/libs';
import {
  ApplicationRoutes,
  JobRoutes,
} from '@work-whiz/routes';
import { authenticationQueue, applicationQueue } from '@work-whiz/queues';
import { createGraphQLMiddleware } from '@work-whiz/app';
import rateLimit from 'express-rate-limit';

const normalizeForwardedAuthHeaders: RequestHandler = (req, _res, next) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'];

  if (typeof forwardedProto === 'string' && forwardedProto.includes(',')) {
    req.headers['x-forwarded-proto'] = forwardedProto.split(',')[0].trim();
  }

  if (typeof forwardedHost === 'string' && forwardedHost.includes(',')) {
    req.headers['x-forwarded-host'] = forwardedHost.split(',')[0].trim();
  }

  next();
};

const authJsonParseErrorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  next,
) => {
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      message: 'Invalid JSON request body',
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  next(error);
};

export const configureMiddlewares = (app: Application): void => {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullAdapter(authenticationQueue),
      new BullAdapter(applicationQueue),
    ],
    serverAdapter,
  });

  app.set('trust proxy', 1);
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../../src/views'));

  app.use(cookieParser());
  app.use(helmet());

  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000'];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400,
    }),
  );

  app.use(
    '/api/auth',
    express.json({ limit: process.env.JSON_BODY_LIMIT || '10kb' }),
    express.urlencoded({
      extended: true,
      limit: process.env.JSON_BODY_LIMIT || '10kb',
    }),
    authJsonParseErrorHandler,
    normalizeForwardedAuthHeaders,
    toNodeHandler(auth),
  );

  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '10kb' }));
  app.use(
    express.urlencoded({
      extended: true,
      limit: process.env.JSON_BODY_LIMIT || '10kb',
    }),
  );
  app.use(compression());
  app.use('/graphql', createGraphQLMiddleware());

  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    const logsDirectory = path.join(__dirname, '../../logs');
    fs.mkdirSync(logsDirectory, { recursive: true });

    const accessLogStream = fs.createWriteStream(
      path.join(logsDirectory, 'access.log'),
      { flags: 'a' },
    );
    app.use(
      morgan('combined', {
        stream: accessLogStream,
        skip: req => req.path === '/healthcheck',
      }),
    );
  }

  // Bull Board Routes
  app.use('/admin/queues', serverAdapter.getRouter());

  // Swagger UI Route
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Rate limiter middleware
  if (process.env.NODE_ENV === 'production') {
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      message: 'Too many requests, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use(limiter);
  }

  // API Routes
  app.use(`/api/jobs`, new JobRoutes().init());
  app.use(`/api/applications`, new ApplicationRoutes().init());
};
