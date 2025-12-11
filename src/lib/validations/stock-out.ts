import { z } from "zod";

// Stock Out validation schema
export const stockOutSchema = z.object({
    sparepartId: z
        .string()
        .min(1, "Sparepart wajib dipilih"),
    equipmentId: z
        .string()
        .min(1, "Unit alat berat wajib dipilih"),
    employeeId: z
        .string()
        .min(1, "Pemohon/karyawan wajib dipilih"),
    quantity: z
        .number()
        .int("Jumlah harus bilangan bulat")
        .min(1, "Jumlah minimal 1"),
    purpose: z
        .string()
        .max(500, "Keperluan maksimal 500 karakter")
        .optional()
        .or(z.literal("")),
    scannedBarcode: z
        .string()
        .optional()
        .or(z.literal("")),
});

export const rejectSchema = z.object({
    reason: z
        .string()
        .min(1, "Alasan penolakan wajib diisi")
        .max(500, "Alasan maksimal 500 karakter"),
});

export type StockOutInput = z.infer<typeof stockOutSchema>;
export type RejectInput = z.infer<typeof rejectSchema>;
