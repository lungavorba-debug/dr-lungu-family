import { z } from 'zod';

export const deliverScreeningEmailSchema = z.object({
  email: z.string().trim().email('Adresa de email este invalidă.'),
});

export const deliverScreeningWhatsAppSchema = z.object({
  phone: z.string().trim().min(1, 'Numărul de telefon este obligatoriu.'),
});

export type DeliverScreeningEmailInput = z.infer<typeof deliverScreeningEmailSchema>;
export type DeliverScreeningWhatsAppInput = z.infer<typeof deliverScreeningWhatsAppSchema>;
