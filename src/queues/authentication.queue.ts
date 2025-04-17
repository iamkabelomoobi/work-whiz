import Queue from 'bull';
import { logger } from '@work-whiz/utils';
import { config } from '@work-whiz/configs/config';

const REDIS_URI = config.database?.redis?.uri;

if (!REDIS_URI) {
  logger.warn(
    'Redis URI not found in config, using default localhost connection',
  );
}

const authenticationQueue = new Queue('authenticationQueue', {
  redis: REDIS_URI ?? 'redis://localhost:6379',
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

function handleQueueError(error: Error) {
  logger.error('Authentication queue error:', {
    error: error.message,
    stack: error.stack,
  });
}

authenticationQueue.on('error', handleQueueError);

authenticationQueue.on('failed', (job, error) => {
  logger.error(`Job ${job.id} failed`, {
    jobId: job.id,
    error: error.message,
    data: job.data,
  });
});

authenticationQueue.on('completed', job => {
  logger.info(`Job ${job.id} completed`, {
    jobId: job.id,
    data: job.data,
  });
});

export { authenticationQueue };
