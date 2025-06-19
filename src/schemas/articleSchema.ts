import { z } from 'zod';

export const articleSchema = z.object({
  title: z.string().min(1, 'Judul artikel harus diisi'),
  content: z.string().min(1, 'Konten artikel harus diisi'),
  categoryId: z.string().min(1, 'Kategori harus dipilih'),
  imageUrl: z.any().optional(), // bisa File, null, atau tidak diisi
});
