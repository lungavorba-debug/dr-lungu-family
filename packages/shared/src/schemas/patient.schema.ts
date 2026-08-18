import { z } from 'zod';
import { isValidRomanianPhone, normalizePhone } from '../utils/phone';

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Minim 2 caractere.')
  .max(50, 'Maximum 50 caractere.')
  .regex(
    /^[\p{L}\s'-]+$/u,
    'Doar litere, spații și cratime sunt permise.',
  );

const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Numărul de telefon este obligatoriu.')
  .refine((value) => isValidRomanianPhone(value), {
    message: 'Introduceți un număr de telefon românesc valid (10 cifre, ex: 0722123456).',
  })
  .transform((value) => normalizePhone(value));

export const createPatientSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  phone: phoneSchema,
  age: z.coerce
    .number({ invalid_type_error: 'Vârsta trebuie să fie un număr.' })
    .int('Vârsta trebuie să fie un număr întreg.')
    .min(1, 'Vârsta minimă este 1 an.')
    .max(120, 'Vârsta maximă este 120 ani.'),
  gender: z.enum(['M', 'F'], {
    errorMap: () => ({ message: 'Selectați sexul (M sau F).' }),
  }),
  city: z
    .string()
    .trim()
    .min(2, 'Localitatea este obligatorie.')
    .max(50, 'Maximum 50 caractere.'),
});

export const searchPatientsQuerySchema = z
  .object({
    phone: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? normalizePhone(value) : undefined))
      .refine((value) => !value || isValidRomanianPhone(value), {
        message: 'Introduceți un număr de telefon românesc valid (10 cifre).',
      }),
    search: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.phone || data.search), {
    message: 'Parametrul phone sau search este obligatoriu.',
  });

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type SearchPatientsQuery = z.infer<typeof searchPatientsQuerySchema>;
