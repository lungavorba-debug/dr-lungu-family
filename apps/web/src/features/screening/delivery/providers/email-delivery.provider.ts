import { apiClient } from '../../../../shared/lib/api-client';

import type { DeliveryProvider, DeliveryRecipient } from '../types/delivery.types';

import { formatEmailDeliverySuccessMessage } from '../lib/format-email-delivery-message';



export const emailDeliveryProvider: DeliveryProvider = {

  channel: 'email',

  label: 'E-mail',

  emoji: '📧',

  description: 'Trimite raportul prin email',

  isImplemented: true,

  async deliver(context, recipient?: DeliveryRecipient) {

    if (!recipient?.email) {

      return {

        success: false,

        message: 'Introduceți adresa de email a participantului.',

      };

    }



    try {

      const response = await apiClient.deliverScreeningEmail(context.screeningId, {

        email: recipient.email,

      });

      return {

        success: true,

        message: formatEmailDeliverySuccessMessage(response),

      };

    } catch (error) {

      return {

        success: false,

        message: error instanceof Error ? error.message : 'Livrarea prin email a eșuat.',

      };

    }

  },

};

