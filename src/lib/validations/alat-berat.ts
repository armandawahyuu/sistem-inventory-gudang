import { z } from "zod";

// Equipment type options
export const EQUIPMENT_TYPES = [
    "Excavator",
    "Bulldozer",
    "Wheel Loader",
    "Motor Grader",
    "Dump Truck",
    "Crane",
    "Forklift",
    "Backhoe Loader",
    "Compactor",
    "Grader",
    "Scraper",
    "Paver",
] as const;

// Status options
export const EQUIPMENT_STATUS = {
    active: "Aktif",
    maintenance: "Maintenance",
    inactive: "Non-aktif",
} as const;

// Alat Berat validation schema
export const alatBeratSchema = z.object({
    code: z
        .string()
        .min(1, "Kode unit wajib diisi")
        .max(50, "Kode unit maksimal 50 karakter"),
    name: z
        .string()
        .min(1, "Nama wajib diisi")
        .max(100, "Nama maksimal 100 karakter"),
    type: z.string().min(1, "Tipe wajib dipilih"),
    brand: z
        .string()
        .min(1, "Merk wajib diisi")
        .max(50, "Merk maksimal 50 karakter"),
    model: z
        .string()
        .min(1, "Model wajib diisi")
        .max(50, "Model maksimal 50 karakter"),
    year: z
        .number()
        .int("Tahun harus berupa angka")
        .min(1900, "Tahun minimal 1900")
        .max(new Date().getFullYear() + 1, "Tahun tidak valid")
        .optional()
        .nullable(),
    site: z
        .string()
        .max(100, "Lokasi/site maksimal 100 karakter")
        .optional()
        .or(z.literal("")),
    status: z.enum(["active", "maintenance", "inactive"], {
        message: "Status tidak valid",
    }),
});

export type AlatBeratInput = z.infer<typeof alatBeratSchema>;
