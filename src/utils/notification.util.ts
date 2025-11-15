/**
 * Notification utility class for sending emails.
 */
import { config } from '@work-whiz/configs/config';
import { notificationLib } from '@work-whiz/libs';
import { logger } from './logger';

export default class NotificationUtil {
  private static instance: NotificationUtil;

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

  public sendEmail = async (
    receiver: string,
    subject: string,
    html_template: string,
  ): Promise<void> => {
    try {
      const mail_options = {
        from: `WorkWhiz <${config.notification.nodemailer.auth.user}>`,
        to: receiver,
        subject: subject,
        html: html_template,
      };

      await new Promise<void>((resolve, reject) => {
        notificationLib
          .createNodemailerTransport()
          .sendMail(mail_options, (error: { message: string }) => {
            if (error) {
              logger.error(
                `Error sending email to ${receiver} with subject "${subject}":`,
                error,
              );
              reject(error);
            } else {
              logger.info(
                `Email sent to ${receiver} with subject "${subject}"`,
              );
              resolve();
            }
          });
      });
    } catch (error) {
      logger.error(`Error in sendEmail method:`, error);
      throw error;
    }
  };
}

export const notificationUtil = NotificationUtil.getInstance();
