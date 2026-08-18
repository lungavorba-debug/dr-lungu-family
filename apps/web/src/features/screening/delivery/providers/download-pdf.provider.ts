import { downloadStoredPdf } from '../../report/lib/pdf-session-storage';
import type { DeliveryProvider } from '../types/delivery.types';

export const downloadPdfProvider: DeliveryProvider = {
  channel: 'download',
  label: 'Descarcă PDF',
  emoji: '📄',
  description: 'Salvează raportul pe dispozitiv',
  isImplemented: true,
  async deliver(context) {
    downloadStoredPdf(context.pdf);
    return {
      success: true,
      message: 'PDF descărcat.',
    };
  },
};
