import { z } from "zod";

export const pettyCashIncomeSchema = z.object({
    date: z
        .string()
        .min(1, "Tanggal wajib diisi"),
    amount: z
        .number()
        .min(1, "Jumlah harus lebih dari 0"),
    description: z
        .string()
        .min(1, "Keterangan wajib diisi")
        .max(500, "Keterangan maksimal 500 karakter"),
});

export const pettyCashExpenseSchema = z.object({
    date: z
        .string()
        .min(1, "Tanggal wajib diisi"),
    categoryId: z
        .string()
        .min(1, "Kategori wajib dipilih"),
    amount: z
        .number()
        .min(1, "Jumlah harus lebih dari 0"),
    description: z
        .string()
        .min(1, "Keterangan wajib diisi")
        .max(500, "Keterangan maksimal 500 karakter"),
    receipt: z
        .string()
        .optional()
        .or(z.literal("")),
});

export type PettyCashIncomeInput = z.infer<typeof pettyCashIncomeSchema>;
export type PettyCashExpenseInput = z.infer<typeof pettyCashExpenseSchema>;

// Format currency helper
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
