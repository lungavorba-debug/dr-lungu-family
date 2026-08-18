import { z } from 'zod';

const MAX_AUDIO_BASE64_BYTES = 25 * 1024 * 1024;

export const parseScreeningVoiceSchema = z.object({
  audio_base64: z
    .string()
    .trim()
    .min(1, 'Audio base64 este obligatoriu.')
    .refine(
      (value) => {
        const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
        const estimatedBytes = (value.length * 3) / 4 - padding;
        return estimatedBytes <= MAX_AUDIO_BASE64_BYTES;
      },
      { message: 'Fișierul audio depășește limita de 25 MB.' },
    ),
  mime: z
    .string()
    .trim()
    .min(1, 'Tipul MIME este obligatoriu.')
    .regex(/^audio\//, 'Tipul MIME trebuie să fie audio/*.'),
});
