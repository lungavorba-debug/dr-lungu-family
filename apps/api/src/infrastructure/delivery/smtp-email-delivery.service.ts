import nodemailer from 'nodemailer';
import type { ClinicSettingsResolver } from '../clinic-settings/clinic-settings.resolver';
import {
  EMAIL_LOGO_CID,
  readEmailLogoBytes,
} from '../../application/delivery/delivery-email-assets';
import { logEmailDelivery } from './email-delivery-logger';

export interface SendReportEmailResult {
  messageId: string;
  previewUrl?: string;
  smtpResponse?: string;
  sender: string;
  smtpHost: string;
}

export class SmtpEmailDeliveryService {
  constructor(private readonly clinicSettingsResolver: ClinicSettingsResolver) {}

  async isConfigured(): Promise<boolean> {
    return this.clinicSettingsResolver.isEmailConfigured();
  }

  private async resolveTransport() {
    const smtp = await this.clinicSettingsResolver.getSmtpSettings();
    if (!smtp?.enabled || !smtp.host || !smtp.from) {
      throw new Error('Serviciul de email nu este configurat.');
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth:
        smtp.user && smtp.pass
          ? {
              user: smtp.user,
              pass: smtp.pass,
            }
          : undefined,
    });

    return { transporter, smtp };
  }

  async sendPlainEmail(params: {
    to: string;
    subject: string;
    text: string;
  }): Promise<SendReportEmailResult> {
    const { transporter, smtp } = await this.resolveTransport();

    try {
      const info = await transporter.sendMail({
        from: smtp.from,
        to: params.to,
        subject: params.subject,
        text: params.text,
      });

      logEmailDelivery({
        recipient: params.to,
        subject: params.subject,
        sender: smtp.from,
        smtpHost: smtp.host,
        success: true,
        smtpResponse: info.response ?? null,
      });

      return {
        messageId: info.messageId || `email-${Date.now()}`,
        previewUrl: nodemailer.getTestMessageUrl(info) || undefined,
        smtpResponse: info.response,
        sender: smtp.from,
        smtpHost: smtp.host,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logEmailDelivery({
        recipient: params.to,
        subject: params.subject,
        sender: smtp.from,
        smtpHost: smtp.host,
        success: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  async sendReportEmail(params: {
    to: string;
    subject: string;
    text: string;
    html: string;
    pdfFilename: string;
    pdfBytes: Buffer;
  }): Promise<SendReportEmailResult> {
    const { transporter, smtp } = await this.resolveTransport();
    const logoBytes = await readEmailLogoBytes();

    try {
      const info = await transporter.sendMail({
        from: smtp.from,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
        attachments: [
          ...(logoBytes
            ? [
                {
                  filename: 'clinic-logo.png',
                  content: logoBytes,
                  cid: EMAIL_LOGO_CID,
                  contentType: 'image/png',
                },
              ]
            : []),
          {
            filename: params.pdfFilename,
            content: params.pdfBytes,
            contentType: 'application/pdf',
          },
        ],
      });

      logEmailDelivery({
        recipient: params.to,
        subject: params.subject,
        sender: smtp.from,
        smtpHost: smtp.host,
        success: true,
        smtpResponse: info.response ?? null,
      });

      return {
        messageId: info.messageId || `email-${Date.now()}`,
        previewUrl: nodemailer.getTestMessageUrl(info) || undefined,
        smtpResponse: info.response,
        sender: smtp.from,
        smtpHost: smtp.host,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logEmailDelivery({
        recipient: params.to,
        subject: params.subject,
        sender: smtp.from,
        smtpHost: smtp.host,
        success: false,
        error: errorMessage,
      });
      throw error;
    }
  }
}
