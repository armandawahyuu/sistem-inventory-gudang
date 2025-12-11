import { z } from "zod";

// Stock In validation schema
export const stockInSchema = z.object({
    sparepartId: z
        .string()
        .min(1, "Sparepart wajib dipilih"),
    quantity: z
        .number()
        .int("Jumlah harus bilangan bulat")
        .min(1, "Jumlah minimal 1"),
    supplierId: z
        .string()
        .optional()
        .or(z.literal("")),
    invoiceNumber: z
        .string()
        .max(100, "Nomor invoice maksimal 100 karakter")
        .optional()
        .or(z.literal("")),
    purchasePrice: z
        .number()
        .min(0, "Harga tidak boleh negatif")
        .optional()
        .nullable(),
    warrantyExpiry: z
        .string()
        .optional()
        .or(z.literal("")),
    notes: z
        .string()
        .max(500, "Catatan maksimal 500 karakter")
        .optional()
        .or(z.literal("")),
});

export type StockInInput = z.infer<typeof stockInSchema>;
