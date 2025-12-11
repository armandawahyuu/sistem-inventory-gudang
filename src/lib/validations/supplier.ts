import { z } from "zod";

// Supplier validation schema
export const supplierSchema = z.object({
    name: z
        .string()
        .min(1, "Nama supplier wajib diisi")
        .max(100, "Nama supplier maksimal 100 karakter"),
    phone: z
        .string()
        .max(20, "Nomor telepon maksimal 20 karakter")
        .optional()
        .or(z.literal("")),
    email: z
        .string()
        .email("Format email tidak valid")
        .max(100, "Email maksimal 100 karakter")
        .optional()
        .or(z.literal("")),
    address: z
        .string()
        .max(500, "Alamat maksimal 500 karakter")
        .optional()
        .or(z.literal("")),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
