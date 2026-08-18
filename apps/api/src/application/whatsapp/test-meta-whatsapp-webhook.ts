import { MetaWhatsAppWebhookUseCase } from './meta-whatsapp-webhook.use-case.ts';

function assert(label: string, condition: boolean): void {
  if (!condition) throw new Error(`Assertion failed: ${label}`);
}

const useCase = new MetaWhatsAppWebhookUseCase();

const samplePayload = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '123',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { phone_number_id: '999' },
            messages: [
              {
                from: '40712345678',
                id: 'wamid.test',
                timestamp: '1710000000',
                type: 'text',
                text: { body: 'Bună ziua' },
              },
            ],
          },
        },
      ],
    },
  ],
};

const result = useCase.execute(samplePayload);
assert('object parsed', result.object === 'whatsapp_business_account');
assert('message count', result.messageCount === 1);
assert('message id', result.messages[0]?.messageId === 'wamid.test');
assert('message from', result.messages[0]?.from === '40712345678');
assert('message text', result.messages[0]?.text === 'Bună ziua');

const empty = useCase.execute({});
assert('empty payload', empty.messageCount === 0);

console.log('meta-whatsapp-webhook: all assertions passed');
