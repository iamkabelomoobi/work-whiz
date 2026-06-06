import { config } from '@work-whiz/configs/config';
import { notificationLib } from '../libs/notification.lib';

class AuthenticationTemplate {
  private static instance: AuthenticationTemplate;

  private constructor() {
    //
  }

  public static getInstance = (): AuthenticationTemplate => {
    if (!AuthenticationTemplate.instance) {
      AuthenticationTemplate.instance = new AuthenticationTemplate();
    }
    return AuthenticationTemplate.instance;
  };

  public passwordReset = (url: string, username: string): string => {
    return notificationLib.getMailgenInstance('salted').generate({
      body: {
        title: `${config?.notification?.mailgen?.product?.name} rest your password`,
        intro: `Someone recently requested a password change for your ${config?.notification?.mailgen?.product?.name} account with username: ${username}`,
        action: {
          instructions:
            'Click on the button below within the next 15 minutes to reset your password',
          button: {
            text: 'Reset Password',
            color: '#28214c',
            link: url,
          },
        },
        outro: `If you did not request a password reset, please ignore this email. Having troubles? Copy this link into your browser instead: ${url}`,
      },
    });
  };

  public emailVerification = (url: string, username: string): string => {
    return notificationLib.getMailgenInstance('salted').generate({
      body: {
        title: `Verify your email, ${username}.`,
        intro: `Please verify your ${config?.notification?.mailgen?.product?.name} account email address.`,
        action: {
          instructions: 'Click the button below to verify your email:',
          button: {
            text: 'Verify Email',
            color: '#28214c',
            link: url,
          },
        },
        outro: `If you did not create this account, please ignore this email. Having troubles? Copy this link into your browser instead: ${url}`,
      },
    });
  };

  public welcome = (username: string): string => {
    return notificationLib.getMailgenInstance('salted').generate({
      body: {
        title: `Welcome, ${username}.`,
        intro: `Your ${config?.notification?.mailgen?.product?.name} account is ready.`,
      },
    });
  };

  public passwordUpdateNotice = (username: string): string => {
    return notificationLib.getMailgenInstance('salted').generate({
      body: {
        title: `Hi, ${username}.`,
        intro: `Your ${config?.notification?.mailgen?.product?.name} password has been successfully updated.`,
        outro: `If you did not make this change, please contact our support team at support@${config?.notification?.mailgen?.product?.link}.`,
      },
    });
  };

  passwordSetup = (url: string, username: string): string => {
    return notificationLib.getMailgenInstance('salted').generate({
      body: {
        title: `Welcome ${username}`,
        intro:
          "You're almost there! To complete your account, please set your password",
        action: {
          instructions: 'Click the button below to create your password:',
          button: {
            text: 'Set Up Password',
            color: '#28214c',
            link: url,
          },
        },
        outro: `If you did not sign up for a ${config?.notification?.mailgen?.product?.name} account, please ignore this email.  Having troubles? Copy this link into your browser instead: ${url}`,
      },
    });
  };

  public passwordUpdate = (
    username: string,
    device: Readonly<{ ip: string; browser: string; timestamp: string }>,
  ): string => {
    return notificationLib.getMailgenInstance('salted').generate({
      body: {
        title: `Hi, ${username}.`,
        intro: `Your ${config?.notification?.mailgen?.product?.name} password has been successfully updated.`,
        table: {
          data: [
            { item: 'IP', description: device?.ip },
            { item: 'BROWSER', description: device?.browser },
            { item: 'TIMESTAMP', description: device?.timestamp },
          ],
          columns: {
            customWidth: {
              item: '20%',
              description: '80%',
            },
            customAlignment: {
              item: 'left',
              description: 'left',
            },
          },
        },
        outro: `If you did not make this change or need further assistance, please contact our support team at support@${config?.notification?.mailgen?.product?.link}.`,
      },
    });
  };
}

export const authenticationTemplate = AuthenticationTemplate.getInstance();
