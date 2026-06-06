/**
 * Notification utility class for sending emails.
 */
import { config } from '@work-whiz/configs/config';
import { Resend } from 'resend';
import { notificationLib } from '../libs/notification.lib';
import { logger } from './logger';

export default class NotificationUtil {
  private static instance: NotificationUtil;
  private resendClient: Resend | null = null;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance of NotificationUtil.
   * @returns {NotificationUtil} The singleton instance.
   */
  public static getInstance = (): NotificationUtil => {
    if (!NotificationUtil.instance) {
      NotificationUtil.instance = new NotificationUtil();
    }
    return NotificationUtil.instance;
  };

  private getFromAddress = (): string => {
    if (process.env.NODE_ENV === 'production') {
      if (!config.notification.resend.fromEmail) {
        throw new Error('Missing required environment variable: RESEND_FROM_EMAIL');
      }

      return config.notification.resend.fromEmail;
    }

    return `WorkWhiz <${
      config.notification.nodemailer.auth.user || 'no-reply@workwhiz.local'
    }>`;
  };

  private getResendClient = (): Resend => {
    if (!config.notification.resend.apiKey) {
      throw new Error('Missing required environment variable: RESEND_API_KEY');
    }

    if (!this.resendClient) {
      this.resendClient = new Resend(config.notification.resend.apiKey);
    }

    return this.resendClient;
  };

  private sendWithResend = async (
    receiver: string,
    subject: string,
    htmlTemplate: string,
  ): Promise<void> => {
    const { data, error } = await this.getResendClient().emails.send({
      from: this.getFromAddress(),
      to: [receiver],
      subject,
      html: htmlTemplate,
    });

    if (error) {
      throw new Error(error.message);
    }

    logger.info(`Email sent to ${receiver} with subject "${subject}"`, {
      provider: 'resend',
      id: data?.id,
    });
  };

  private sendWithLocalMail = async (
    receiver: string,
    subject: string,
    htmlTemplate: string,
  ): Promise<void> => {
    const mail_options = {
      from: this.getFromAddress(),
      to: receiver,
      subject: subject,
      html: htmlTemplate,
    };

    await new Promise<void>((resolve, reject) => {
      notificationLib
        .createNodemailerTransport()
        .sendMail(mail_options, (error: Error | null) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
    });

    logger.info(`Email sent to ${receiver} with subject "${subject}"`, {
      provider: 'local',
    });
  };

  public sendEmail = async (
    receiver: string,
    subject: string,
    html_template: string,
  ): Promise<void> => {
    try {
      if (process.env.NODE_ENV === 'production') {
        await this.sendWithResend(receiver, subject, html_template);
      } else {
        await this.sendWithLocalMail(receiver, subject, html_template);
      }
    } catch (error) {
      logger.error(`Error in sendEmail method:`, error);
      throw error;
    }
  };
}

export const notificationUtil = NotificationUtil.getInstance();
