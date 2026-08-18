import { z } from 'zod';

const imageDataSchema = z
  .string()
  .max(500_000, 'Imaginea este prea mare.')
  .nullable()
  .optional();

const mimeTypeSchema = z
  .string()
  .trim()
  .max(64)
  .regex(/^image\/(png|jpeg|jpg|webp|gif)$/i, 'Tip MIME imagine invalid.')
  .nullable()
  .optional();

export const updateUserProfileSchema = z
  .object({
    first_name: z.string().trim().min(1, 'Prenumele este obligatoriu.').max(100).optional(),
    last_name: z.string().trim().min(1, 'Numele este obligatoriu.').max(100).optional(),
    medical_specialty: z.string().trim().max(120).nullable().optional(),
    professional_title: z.string().trim().max(120).nullable().optional(),
    license_number: z.string().trim().max(64).nullable().optional(),
    phone: z
      .string()
      .trim()
      .max(32)
      .regex(/^[\d+\-\s()]*$/, 'Număr de telefon invalid.')
      .nullable()
      .optional(),
    avatar_image_base64: imageDataSchema,
    avatar_mime_type: mimeTypeSchema,
    signature_image_base64: imageDataSchema,
    signature_mime_type: mimeTypeSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Trebuie furnizat cel puțin un câmp de actualizat.',
  })
  .superRefine((data, ctx) => {
    if (data.avatar_image_base64 && !data.avatar_mime_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tipul MIME al avatarului este obligatoriu.',
        path: ['avatar_mime_type'],
      });
    }
    if (data.signature_image_base64 && !data.signature_mime_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tipul MIME al semnăturii este obligatoriu.',
        path: ['signature_mime_type'],
      });
    }
  });

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
