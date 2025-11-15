import nodemailer, { Transporter } from 'nodemailer';
import Mailgen from 'mailgen';
import { config } from '@work-whiz/configs/config';

class NotificationLib {
  private static instance: NotificationLib;
  private transporter: Transporter | null = null;

  private constructor() {
    //
  }

  public static getInstance(): NotificationLib {
    if (!NotificationLib.instance) {
      NotificationLib.instance = new NotificationLib();
    }
    return NotificationLib.instance;
  }

  /**
   * Gets the Mailgen instance.
   */
  public getMailgenInstance(theme: string): Mailgen {
    return new Mailgen({
      theme,
      product: {
        name: config.notification.mailgen.product.name,
        link: config.notification.mailgen.product.link,
        logo: config.notification.mailgen.product.logo,
        copyright: config.notification.mailgen.product.copyright,
      },
    });
  }

  /**
   * Creates or returns the Nodemailer transport instance.
   * In development, uses Maildev SMTP server.
   * In production, uses configured SMTP server.
   */
  public createNodemailerTransport(): Transporter {
    if (this.transporter) return this.transporter;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let transporterOptions: any;

    if (process.env.NODE_ENV === 'production') {
      // Use production SMTP config
      const { host, port, secure, auth } = config.notification.nodemailer;
      transporterOptions = { host, port, secure, auth };
    } else {
      // Use Maildev SMTP server for development
      transporterOptions = {
        host: process.env.MAILDEV_HOST || 'localhost',
        port: Number(process.env.MAILDEV_PORT || 1025),
        secure: false,
        tls: { rejectUnauthorized: false },
      };
    }

    this.transporter = nodemailer.createTransport(transporterOptions);
    return this.transporter;
  }
}

export const notificationLib = NotificationLib.getInstance();
