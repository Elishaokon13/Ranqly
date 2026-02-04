import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { Notification } from './notification';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('Email service initialized');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  async sendNotification(notification: Notification): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@ranqly.com',
        to: notification.data?.email || notification.userId,
        subject: `Ranqly: ${notification.title}`,
        html: this.generateEmailHTML(notification)
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email notification sent to ${notification.userId}`);
    } catch (error) {
      logger.error('Failed to send email notification:', error);
      throw error;
    }
  }

  private generateEmailHTML(notification: Notification): string {
    const typeColors = {
      info: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444'
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${notification.title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: ${typeColors[notification.type]}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Ranqly</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
            <h2 style="color: ${typeColors[notification.type]}; margin-top: 0;">${notification.title}</h2>
            <p style="font-size: 16px; margin-bottom: 20px;">${notification.message}</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
                 style="background: ${typeColors[notification.type]}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View on Ranqly
              </a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
            <p>This notification was sent by Ranqly. If you no longer wish to receive these notifications, 
            you can <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/notifications/preferences">update your preferences</a>.</p>
          </div>
        </body>
      </html>
    `;
  }
}
