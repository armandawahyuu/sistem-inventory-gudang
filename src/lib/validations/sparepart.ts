import { z } from "zod";

// Unit options
export const UNIT_OPTIONS = [
    "pcs",
    "liter",
    "set",
    "meter",
    "kg",
    "box",
    "roll",
    "lembar",
] as const;

// Sparepart validation schema
export const sparepartSchema = z.object({
    code: z
        .string()
        .min(1, "Kode wajib diisi")
        .max(50, "Kode maksimal 50 karakter"),
    name: z
        .string()
        .min(1, "Nama wajib diisi")
        .max(200, "Nama maksimal 200 karakter"),
    categoryId: z.string().min(1, "Kategori wajib dipilih"),
    brand: z
        .string()
        .max(50, "Merk maksimal 50 karakter")
        .optional()
        .or(z.literal("")),
    unit: z.string().min(1, "Satuan wajib dipilih"),
    minStock: z
        .number()
        .int("Stok minimum harus berupa angka")
        .min(0, "Stok minimum minimal 0")
        .optional()
        .default(0),
    rackLocation: z
        .string()
        .max(50, "Lokasi rak maksimal 50 karakter")
        .optional()
        .or(z.literal("")),
});

export type SparepartInput = z.infer<typeof sparepartSchema>;

// Equipment compatibility schema
export const compatibilitySchema = z.object({
    sparepartId: z.string(),
    equipmentType: z.string().min(1, "Tipe alat wajib diisi"),
    equipmentBrand: z.string().optional().or(z.literal("")),
    equipmentModel: z.string().optional().or(z.literal("")),
});

export type CompatibilityInput = z.infer<typeof compatibilitySchema>;
