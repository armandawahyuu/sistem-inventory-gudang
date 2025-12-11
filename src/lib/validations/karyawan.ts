import { z } from "zod";

// Position options for dropdown
export const POSITION_OPTIONS = [
    "Mekanik",
    "Staff Gudang",
    "Operator",
    "Helper",
    "Supervisor",
    "Admin",
    "Driver",
    "Security",
] as const;

// Karyawan validation schema
export const karyawanSchema = z.object({
    nik: z
        .string()
        .min(1, "NIK wajib diisi")
        .max(20, "NIK maksimal 20 karakter"),
    name: z
        .string()
        .min(1, "Nama wajib diisi")
        .max(100, "Nama maksimal 100 karakter"),
    position: z
        .string()
        .min(1, "Jabatan wajib diisi"),
    department: z
        .string()
        .max(100, "Departemen maksimal 100 karakter")
        .optional()
        .or(z.literal("")),
    phone: z
        .string()
        .max(20, "Nomor telepon maksimal 20 karakter")
        .optional()
        .or(z.literal("")),
    isActive: z
        .boolean()
        .optional()
        .default(true),
});

// Make the output type include isActive as required (after default is applied)
export type KaryawanInput = z.input<typeof karyawanSchema>;
export type KaryawanOutput = z.output<typeof karyawanSchema>;
