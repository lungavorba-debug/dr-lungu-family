import { whatsAppService } from '../../services/whatsapp.service';

export class WhatsAppDeliveryService {
  async isConfigured(): Promise<boolean> {
    return whatsAppService.ready;
  }

  isWebReady(): boolean {
    return whatsAppService.ready;
  }

  async sendReportDocument(params: {
    toE164: string;
    pdfFilename: string;
    pdfBytes: Buffer;
    caption: string;
    participantName: string;
  }): Promise<{ messageId: string; provider: 'whatsapp-web' }> {
    if (!whatsAppService.ready) {
      throw new Error(
        'Sesiunea WhatsApp nu este conectată. Scanează codul QR din Setări → WhatsApp.',
      );
    }

    const result = await whatsAppService.sendReportPdf(
      params.toE164,
      params.pdfBytes,
      params.pdfFilename,
      params.participantName,
      params.caption,
    );

    const messageId =
      (result as { id?: { id?: string } } | undefined)?.id?.id ?? 'whatsapp-web-sent';

    return { messageId, provider: 'whatsapp-web' };
  }
}
