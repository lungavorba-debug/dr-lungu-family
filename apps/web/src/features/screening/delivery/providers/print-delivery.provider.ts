import { printStoredPdf } from '../../report/lib/pdf-session-storage';
import type { DeliveryProvider } from '../types/delivery.types';

export const printDeliveryProvider: DeliveryProvider = {
  channel: 'print',
  label: 'Tipărire',
  emoji: '🖨️',
  description: 'Tipărește raportul screeningului',
  isImplemented: true,
  async deliver(context) {
    try {
      await printStoredPdf(context.pdf);
      return {
        success: true,
        message: 'Dialogul de tipărire a fost deschis.',
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Tipărirea a eșuat.',
      };
    }
  },
};
