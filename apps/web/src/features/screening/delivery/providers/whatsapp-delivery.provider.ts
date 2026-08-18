import { normalizePhone } from '@medscreen/shared';
import { ApiClientError, apiClient } from '../../../../shared/lib/api-client';
import type { DeliveryProvider, DeliveryRecipient } from '../types/delivery.types';
import { formatWhatsAppDeliverySuccessMessage } from '../lib/format-whatsapp-delivery-message';

export const whatsappDeliveryProvider: DeliveryProvider = {
  channel: 'whatsapp',
  label: 'WhatsApp',
  emoji: '🟢',
  description: 'Trimite raportul PDF participantului prin WhatsApp Web (sesiune clinică)',
  isImplemented: true,
  async deliver(context, recipient?: DeliveryRecipient) {
    const phone = recipient?.phone?.trim() || context.patient.phone?.trim();

    if (!phone) {
      return {
        success: false,
        message: 'Introduceți numărul de telefon al participantului.',
      };
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return {
        success: false,
        message: 'Numărul de telefon introdus nu este valid.',
      };
    }

    try {
      const response = await apiClient.deliverScreeningWhatsApp(context.screeningId, {
        phone: normalizedPhone,
      });
      return {
        success: true,
        message: `✅ ${formatWhatsAppDeliverySuccessMessage(response)}`,
      };
    } catch (error) {
      if (error instanceof ApiClientError && error.errorCode === 'WHATSAPP_DISCONNECTED') {
        return {
          success: false,
          message:
            'Sesiunea WhatsApp nu este conectată. Folosiți butonul „Trimite manual” sau conectați WhatsApp din Setări.',
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Livrarea prin WhatsApp a eșuat.',
      };
    }
  },
};