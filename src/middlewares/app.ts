import compression from 'compression';
import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from '@work-whiz/configs/swagger';
import { AuthenticationRoutes } from '@work-whiz/routes';
import { authenticationQueue } from '@work-whiz/queues';

export const configureMiddlewares = (app: Application): void => {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullAdapter(authenticationQueue)],
    serverAdapter,
  });

  app.set('trust proxy', 1);
  app.set('trust proxy', true);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
        },
      },
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
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400,
    }),
  );

  app.use(cookieParser());

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

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

  // API Routes
  const API_VERSION = 'v1';
  app.use(`/api/${API_VERSION}/auth`, new AuthenticationRoutes().init());
};
