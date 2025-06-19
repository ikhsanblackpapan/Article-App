// schemas/authSchema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username harus diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});



export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(20, "Username maksimal 20 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .regex(/[A-Z]/, "Harus mengandung huruf besar")
    .regex(/[0-9]/, "Harus mengandung angka"),
  isAdmin: z.boolean().optional(),
  adminCode: z.string().superRefine((val, ctx) => {
    const { isAdmin } = ctx as any;
    if (isAdmin && !val) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Kode verifikasi admin diperlukan",
      });
    }
  }),
});

export type RegisterForm = z.infer<typeof registerSchema>;
