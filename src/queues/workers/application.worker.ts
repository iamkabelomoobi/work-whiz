import { Job } from 'bull';
import ejs from 'ejs';
import path from 'path';
import { logger, notificationUtil } from '@work-whiz/utils';
import { applicationQueue } from '@work-whiz/queues';

interface ApplicationJobPayload {
  id: string;
  status: string;
  jobTitle?: string;
  candidate?: {
    email?: string;
    firstName?: string;
  };
}

const TEMPLATES_PATH = path.join(__dirname, '../../templates/application');

applicationQueue.process(async (job: Job<ApplicationJobPayload>) => {
  const { id, status, jobTitle, candidate } = job.data;
  const type = status;

  const TEMPLATE_MAP = {
    pending: {
      template: 'application-created.ejs',
      subject: 'Your Application Has Been Submitted',
    },
    updated: {
      template: 'application-updated.ejs',
      subject: 'Your Application Has Been Updated',
    },
    rejected: {
      template: 'application-rejected.ejs',
      subject: 'Your Application Has Been Rejected',
    },
  };

  try {
    const templateInfo = TEMPLATE_MAP[type as keyof typeof TEMPLATE_MAP];
    if (!templateInfo) {
      logger.warn(`Unknown application alert type in job ${id}: ${type}`);
      return;
    }

    const html_template = await ejs.renderFile(
      path.join(TEMPLATES_PATH, templateInfo.template),
      { application: { id, status, jobTitle, candidate } },
    );

    const recipient = candidate?.email;
    if (html_template && recipient) {
      await notificationUtil.sendEmail(
        recipient,
        templateInfo.subject,
        html_template,
      );
      logger.info(`Application alert email sent in job ${id}`, {
        email: recipient,
        subject: templateInfo.subject,
        type,
      });
    } else {
      throw new Error('Template rendering failed or missing recipient email');
    }
  } catch (error) {
    logger.error(`Failed to process application alert job ${id}`, {
      id,
      type,
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
});
