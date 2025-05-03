import compression from 'compression';
import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import lusca from 'lusca';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from '@work-whiz/configs/swagger';
import {
  AdminRoutes,
  AuthenticationRoutes,
  CandidateRoutes,
  EmployerRoutes,
  JobRoutes,
} from '@work-whiz/routes';
import { authenticationQueue } from '@work-whiz/queues';
import { authenticationMiddleware } from './';
import rateLimit from 'express-rate-limit';
import { globalErrorHandler } from './global-error.middleware';

export const configureMiddlewares = (app: Application): void => {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullAdapter(authenticationQueue)],
    serverAdapter,
  });

  app.set('trust proxy', 1);
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../../src/views'));

  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production'
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:'],
              },
            }
          : false,
    }),
  );

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

  app.use(lusca.csrf());
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '10kb' }));
  app.use(
    express.urlencoded({
      extended: true,
      limit: process.env.JSON_BODY_LIMIT || '10kb',
    }),
  );
  app.use(compression());

  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    const accessLogStream = fs.createWriteStream(
      path.join(__dirname, '../../logs/access.log'),
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

  // Authentication middleware
  app.use(authenticationMiddleware.isAuthenticated);

  // API Routes
  const API_VERSION = 'v1';
  app.use(`/api/${API_VERSION}/auth`, new AuthenticationRoutes().init());
  app.use(`/api/${API_VERSION}/admins`, new AdminRoutes().init());
  app.use(`/api/${API_VERSION}/candidates`, new CandidateRoutes().init());
  app.use(`/api/${API_VERSION}/employers`, new EmployerRoutes().init());
  app.use(`/api/${API_VERSION}/jobs`, new JobRoutes().init());

  // Global Error Handler
  app.use(globalErrorHandler);

  // Health Check Endpoint
  app.get('/healthcheck', (req, res) =>
    res.status(200).json({ status: 'healthy' }),
  );
};
