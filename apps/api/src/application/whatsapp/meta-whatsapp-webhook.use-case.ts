export interface WhatsAppIncomingMessage {
  messageId: string;
  from: string;
  timestamp: string;
  type: string;
  text: string | null;
  phoneNumberId: string | null;
}

export interface WhatsAppWebhookProcessResult {
  object: string | null;
  messageCount: number;
  messages: WhatsAppIncomingMessage[];
}

interface WhatsAppWebhookPayload {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      field?: string;
      value?: {
        messaging_product?: string;
        metadata?: { phone_number_id?: string };
        messages?: Array<{
          from?: string;
          id?: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
        }>;
      };
    }>;
  }>;
}

export class MetaWhatsAppWebhookUseCase {
  execute(payload: unknown): WhatsAppWebhookProcessResult {
    const body = (payload ?? {}) as WhatsAppWebhookPayload;
    const messages: WhatsAppIncomingMessage[] = [];

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'messages') continue;

        const phoneNumberId = change.value?.metadata?.phone_number_id ?? null;
        for (const message of change.value?.messages ?? []) {
          if (!message.id || !message.from) continue;

          messages.push({
            messageId: message.id,
            from: message.from,
            timestamp: message.timestamp ?? '',
            type: message.type ?? 'unknown',
            text: message.text?.body ?? null,
            phoneNumberId,
          });
        }
      }
    }

    for (const message of messages) {
      console.log(
        `[whatsapp:webhook] inbound message id=${message.messageId} from=${message.from} type=${message.type}${
          message.text ? ` text="${message.text.slice(0, 120)}"` : ''
        }`,
      );
    }

    return {
      object: body.object ?? null,
      messageCount: messages.length,
      messages,
    };
  }
}
