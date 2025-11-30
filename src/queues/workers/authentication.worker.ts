import { Job } from 'bull';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import { logger, notificationUtil } from '@work-whiz/utils';
import { authenticationQueue } from '@work-whiz/queues';
import { IEmailJob } from '@work-whiz/interfaces/queues';

const TEMPLATE_NAMES = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_RESET_OTP: 'password_reset_otp',
  PASSWORD_SETUP: 'password_setup',
  PASSWORD_UPDATE: 'password_update',
} as const;

const TEMPLATES_PATH = path.join(__dirname, '../../templates/authentication');

/**
 * Renders an email template using EJS
 */
async function renderEmailTemplate(
  templateName: string,
  data: Record<string, any>,
): Promise<string> {
  const templatePath = path.join(TEMPLATES_PATH, `${templateName}.ejs`);

  logger.debug('Rendering template', {
    templateName,
    templatePath,
    data,
  });

  if (!fs.existsSync(templatePath)) {
    const error = new Error(
      `Template file not found: ${templatePath}. Available templates: ${Object.values(
        TEMPLATE_NAMES,
      ).join(', ')}`,
    );
    logger.error('Template file not found', {
      templateName,
      templatePath,
      templatesDirectory: TEMPLATES_PATH,
      availableTemplates: Object.values(TEMPLATE_NAMES),
    });
    throw error;
  }

  try {
    const renderedContent = await ejs.renderFile(templatePath, data);
    return renderedContent;
  } catch (error) {
    logger.error('EJS rendering error', {
      templateName,
      templatePath,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

authenticationQueue.process(async (job: Job<IEmailJob>) => {
  try {
    const { email, subject, template } = job.data;

    logger.info('Processing email job', {
      jobId: job.id,
      email,
      subject,
      templateName: template?.name,
    });

    if (!email) {
      throw new Error('Email address is required');
    }

    if (!template || !template.name) {
      throw new Error('Template name is required');
    }

    if (!template.content) {
      throw new Error('Template content is required');
    }

    let renderedContent: string;
    try {
      renderedContent = await renderEmailTemplate(
        template.name,
        template.content,
      );

      if (!renderedContent || renderedContent.trim().length === 0) {
        throw new Error(`Template '${template.name}' rendered empty content`);
      }

      logger.info('Template rendered successfully', {
        jobId: job.id,
        templateName: template.name,
        contentLength: renderedContent.length,
      });
    } catch (templateError) {
      logger.error('Template rendering failed', {
        jobId: job.id,
        templateName: template.name,
        templateContent: JSON.stringify(template.content),
        error:
          templateError instanceof Error
            ? templateError.message
            : String(templateError),
        stack: templateError instanceof Error ? templateError.stack : undefined,
      });
      throw new Error(
        `Failed to render template '${template.name}': ${
          templateError instanceof Error
            ? templateError.message
            : String(templateError)
        }`,
      );
    }

    try {
      await notificationUtil.sendEmail(email, subject, renderedContent);

      logger.info('Email sent successfully', {
        jobId: job.id,
        email,
        subject,
      });
    } catch (emailError) {
      logger.error('Email sending failed', {
        jobId: job.id,
        email,
        subject,
        error:
          emailError instanceof Error ? emailError.message : String(emailError),
      });
      throw new Error(
        `Failed to send email: ${
          emailError instanceof Error ? emailError.message : String(emailError)
        }`,
      );
    }
  } catch (error) {
    logger.error('Failed to process job', {
      jobId: job.id,
      email: job.data.email,
      subject: job.data.subject,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      level: 'error',
      message: `Failed to process job ${job.id}`,
    });
    throw error;
  }
});

authenticationQueue.on('completed', job => {
  logger.info('Job completed successfully', {
    jobId: job.id,
    email: job.data.email,
    subject: job.data.subject,
    templateName: job.data.template?.name,
    level: 'info',
    message: `Job ${job.id} completed`,
  });
});

authenticationQueue.on('failed', (job, err) => {
  logger.error('Job failed', {
    jobId: job.id,
    error: err.message,
    data: job.data,
    level: 'error',
    message: `Job ${job.id} failed`,
  });
});
