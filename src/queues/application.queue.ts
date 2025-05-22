import Queue from 'bull';
import { logger } from '@work-whiz/utils';
import { config } from '@work-whiz/configs/config';

const applicationQueue = new Queue('applicationQueue', {
  redis: {
    host: config?.database?.redis?.host,
    port: Number(config?.database?.redis?.port),
    password: config?.database?.redis?.password,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

const handleQueueError = (error: Error) => {
  logger.error('Application queue error:', {
    error: error.message,
    stack: error.stack,
  });
};

applicationQueue.on('error', handleQueueError);

applicationQueue.on('failed', (job, error) => {
  logger.error(`Application job ${job.id} failed`, {
    jobId: job.id,
    error: error.message,
    data: job.data,
  });
});

applicationQueue.on('completed', job => {
  logger.info(`Application job ${job.id} completed`, {
    jobId: job.id,
    data: job.data,
  });
});

export { applicationQueue };
