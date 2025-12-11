import { z } from "zod";

// Kategori validation schema
export const kategoriSchema = z.object({
    name: z
        .string()
        .min(1, "Nama kategori wajib diisi")
        .max(100, "Nama kategori maksimal 100 karakter"),
});

export type KategoriInput = z.infer<typeof kategoriSchema>;
