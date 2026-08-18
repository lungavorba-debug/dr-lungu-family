import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email-ul este obligatoriu.')
    .email('Adresa de email nu este validă.')
    .max(255, 'Adresa de email este prea lungă.'),
  password: z
    .string()
    .min(1, 'Parola este obligatorie.')
    .max(128, 'Parola este prea lungă.'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  current_password: z
    .string()
    .min(1, 'Parola curentă este obligatorie.')
    .max(128, 'Parola este prea lungă.'),
  new_password: z
    .string()
    .min(8, 'Parola nouă trebuie să aibă cel puțin 8 caractere.')
    .max(128, 'Parola este prea lungă.'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email-ul este obligatoriu.')
    .email('Adresa de email nu este validă.')
    .max(255, 'Adresa de email este prea lungă.'),
});

export const resetPasswordWithTokenSchema = z.object({
  token: z.string().trim().min(1, 'Token-ul de resetare este obligatoriu.').max(512),
  password: z
    .string()
    .min(8, 'Parola trebuie să aibă cel puțin 8 caractere.')
    .max(128, 'Parola este prea lungă.'),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordWithTokenInput = z.infer<typeof resetPasswordWithTokenSchema>;
