import type { ClinicSettingsResolver } from '../clinic-settings/clinic-settings.resolver';
import { isValidWhatsAppGraphRecipient, toWhatsAppGraphRecipient } from '@medscreen/shared';
import {
  logWhatsAppGraphFailure,
  parseWhatsAppGraphError,
  type WhatsAppGraphErrorPayload,
} from './whatsapp-graph-errors';

export class WhatsAppCloudDeliveryService {
  constructor(private readonly clinicSettingsResolver: ClinicSettingsResolver) {}

  async isConfigured(): Promise<boolean> {
    return this.clinicSettingsResolver.isWhatsAppConfigured();
  }

  async sendReportDocument(params: {
    toE164: string;
    pdfFilename: string;
    pdfBytes: Buffer;
    caption: string;
  }): Promise<{ messageId: string }> {
    const whatsapp = await this.clinicSettingsResolver.getWhatsAppSettings();
    if (!whatsapp?.enabled || !whatsapp.phone_number_id || !whatsapp.access_token) {
      throw parseWhatsAppGraphError(
        { error: { message: 'Serviciul WhatsApp nu este configurat.' } },
        'config',
        'Serviciul WhatsApp nu este configurat. Setează WHATSAPP_PHONE_NUMBER_ID și WHATSAPP_ACCESS_TOKEN.',
      );
    }

    if (!isValidWhatsAppGraphRecipient(params.toE164)) {
      throw parseWhatsAppGraphError(
        {
          error: {
            message: 'Număr destinatar invalid pentru WhatsApp Cloud API.',
            code: 100,
          },
        },
        'send_message',
        'Numărul destinatar trebuie să fie un mobil românesc valid în format internațional (ex: 40755123456, fără + sau spații).',
      );
    }

    const phoneNumberId = whatsapp.phone_number_id.trim();
    const accessToken = whatsapp.access_token.trim();
    const apiVersion = whatsapp.api_version;
    const baseUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}`;
    const recipient = toWhatsAppGraphRecipient(params.toE164);

    console.log('[whatsapp:cloud] Sending PDF document', {
      phoneNumberId,
      apiVersion,
      recipientMasked: recipient.replace(/\d(?=\d{4})/g, '*'),
      recipientFormat: 'E.164 digits without plus',
      pdfFilename: params.pdfFilename,
      pdfBytes: params.pdfBytes.length,
    });

    const uploadForm = new FormData();
    uploadForm.append('messaging_product', 'whatsapp');
    uploadForm.append('type', 'application/pdf');
    uploadForm.append(
      'file',
      new Blob([new Uint8Array(params.pdfBytes)], { type: 'application/pdf' }),
      params.pdfFilename,
    );

    const uploadResponse = await fetch(`${baseUrl}/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: uploadForm,
    });

    const uploadBody = (await uploadResponse.json()) as {
      id?: string;
      error?: WhatsAppGraphErrorPayload;
    };
    if (!uploadResponse.ok || !uploadBody.id) {
      logWhatsAppGraphFailure({
        stage: 'media_upload',
        httpStatus: uploadResponse.status,
        body: uploadBody,
        phoneNumberId,
        recipient,
      });
      throw parseWhatsAppGraphError(
        uploadBody,
        'media_upload',
        'Încărcarea PDF-ului în WhatsApp a eșuat.',
      );
    }

    const messageResponse = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'document',
        document: {
          id: uploadBody.id,
          filename: params.pdfFilename,
          caption: params.caption,
        },
      }),
    });

    const messageBody = (await messageResponse.json()) as {
      messages?: Array<{ id: string }>;
      error?: WhatsAppGraphErrorPayload;
    };

    if (!messageResponse.ok || !messageBody.messages?.[0]?.id) {
      logWhatsAppGraphFailure({
        stage: 'send_message',
        httpStatus: messageResponse.status,
        body: messageBody,
        phoneNumberId,
        recipient,
      });
      throw parseWhatsAppGraphError(
        messageBody,
        'send_message',
        'Trimiterea WhatsApp a eșuat.',
      );
    }

    console.log('[whatsapp:cloud] Message sent', {
      messageId: messageBody.messages[0].id,
      recipientMasked: recipient.replace(/\d(?=\d{4})/g, '*'),
    });

    return { messageId: messageBody.messages[0].id };
  }
}
