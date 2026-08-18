import { z } from 'zod';
import { ROLES } from '@medscreen/types';

const roleSchema = z.enum([ROLES.ADMIN, ROLES.OPERATOR, ROLES.MEDIC]);

export const createUserSchema = z.object({
  first_name: z.string().trim().min(1, 'Prenumele este obligatoriu.').max(100),
  last_name: z.string().trim().min(1, 'Numele este obligatoriu.').max(100),
  email: z.string().trim().toLowerCase().email('Adresa de email nu este validă.').max(255),
  password: z
    .string()
    .min(8, 'Parola trebuie să aibă cel puțin 8 caractere.')
    .max(128, 'Parola este prea lungă.'),
  role: roleSchema,
});

export const updateUserSchema = z
  .object({
    first_name: z.string().trim().min(1).max(100).optional(),
    last_name: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().toLowerCase().email().max(255).optional(),
    role: roleSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Trebuie furnizat cel puțin un câmp de actualizat.',
  });

export const resetUserPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Parola trebuie să aibă cel puțin 8 caractere.')
    .max(128, 'Parola este prea lungă.'),
});

export const initialSetupSchema = z.object({
  first_name: z.string().trim().min(1, 'Prenumele este obligatoriu.').max(100),
  last_name: z.string().trim().min(1, 'Numele este obligatoriu.').max(100),
  email: z.string().trim().toLowerCase().email('Adresa de email nu este validă.').max(255),
  password: z
    .string()
    .min(8, 'Parola trebuie să aibă cel puțin 8 caractere.')
    .max(128, 'Parola este prea lungă.'),
});

export const listUsersQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  role: roleSchema.optional(),
  active: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;
export type InitialSetupInput = z.infer<typeof initialSetupSchema>;
