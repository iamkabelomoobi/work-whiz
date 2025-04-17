import { Job } from 'bull';
import ejs from 'ejs';
import path from 'path';
import { logger, notificationUtil } from '@work-whiz/utils';
import { authenticationQueue } from '@work-whiz/queues';
import { IEmailJob } from '@work-whiz/interfaces/queues';

const TEMPLATE_NAMES = {
  PASSWORD_RESET: 'password_reset',
  PASSWORD_SETUP: 'password_setup',
  PASSWORD_UPDATE: 'password_update',
} as const;

const TEMPLATES_PATH = path.join(__dirname, '../../templates/authentication');

authenticationQueue.process(async (job: Job<IEmailJob>) => {
  const { email, subject, template } = job.data;
  const jobId = job.id;

  try {
    let html_template: string | undefined;

    if (template?.name) {
      const templateData = template.content || {};
      switch (template.name) {
        case TEMPLATE_NAMES.PASSWORD_RESET:
          html_template = await ejs.renderFile(
            path.join(TEMPLATES_PATH, 'forgot-password.ejs'),
            { ...templateData }
          );
          break;
        case TEMPLATE_NAMES.PASSWORD_SETUP:
          html_template = await ejs.renderFile(
            path.join(TEMPLATES_PATH, 'password-setup.ejs'),
            { ...templateData }
          );
          break;
        case TEMPLATE_NAMES.PASSWORD_UPDATE:
          html_template = await ejs.renderFile(
            path.join(TEMPLATES_PATH, 'password-update.ejs'),
            { ...templateData }
          );
          break;
        default:
          logger.warn(
            `Unknown template name in job ${jobId}: ${template.name}`
          );
      }
    }

    if (html_template) {
      await notificationUtil.sendEmail(email, subject, html_template);

      logger.info(`Email successfully sent in job ${jobId}`, {
        email,
        subject,
        template: template?.name,
      });
    } else {
      throw new Error('Template rendering failed');
    }
  } catch (error) {
    logger.error(`Failed to process job ${jobId}`, {
      email,
      subject,
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
});
