import { z } from "zod";

// ============================================
// ENUMS & CONSTANTS
// ============================================

export const ALAT_BERAT_TYPES = [
    "Excavator",
    "Bulldozer",
    "Wheel Loader",
    "Dump Truck",
    "Motor Grader",
    "Compactor",
    "Crane",
    "Forklift",
    "Backhoe Loader",
    "Skid Steer",
    "Other",
] as const;

export const ALAT_BERAT_STATUS = ["active", "maintenance", "inactive"] as const;

export const JABATAN_LIST = [
    "Mekanik",
    "Staff Gudang",
    "Operator",
    "Helper",
    "Supervisor",
    "Admin",
    "Manager",
    "Other",
] as const;

export const SATUAN_LIST = ["pcs", "liter", "set", "meter", "kg", "unit", "roll", "box"] as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

// Trim dan lowercase untuk perbandingan
const normalizeString = (val: string) => val.trim().toLowerCase();

// Check format email
const isValidEmail = (email: string): boolean => {
    if (!email || email.trim() === "") return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Check format angka
const isValidNumber = (val: string): boolean => {
    if (!val || val.trim() === "") return true; // Optional
    return !isNaN(Number(val));
};

// ============================================
// KATEGORI SCHEMA
// ============================================

export const kategoriImportSchema = z.object({
    name: z
        .string()
        .min(1, "Nama kategori wajib diisi")
        .min(2, "Nama kategori minimal 2 karakter")
        .max(100, "Nama kategori maksimal 100 karakter")
        .transform((val) => val.trim()),
});

export type KategoriImportData = z.infer<typeof kategoriImportSchema>;

// ============================================
// SUPPLIER SCHEMA
// ============================================

export const supplierImportSchema = z.object({
    name: z
        .string()
        .min(1, "Nama supplier wajib diisi")
        .min(2, "Nama supplier minimal 2 karakter")
        .max(200, "Nama supplier maksimal 200 karakter")
        .transform((val) => val.trim()),
    phone: z
        .string()
        .optional()
        .default("")
        .transform((val) => val?.trim() || ""),
    email: z
        .string()
        .optional()
        .default("")
        .refine((val) => isValidEmail(val || ""), "Format email tidak valid")
        .transform((val) => val?.trim().toLowerCase() || ""),
    address: z
        .string()
        .optional()
        .default("")
        .transform((val) => val?.trim() || ""),
});

export type SupplierImportData = z.infer<typeof supplierImportSchema>;

// ============================================
// ALAT BERAT SCHEMA
// ============================================

export const alatBeratImportSchema = z.object({
    code: z
        .string()
        .min(1, "Kode unit wajib diisi")
        .max(50, "Kode unit maksimal 50 karakter")
        .transform((val) => val.trim().toUpperCase()),
    name: z
        .string()
        .min(1, "Nama unit wajib diisi")
        .max(200, "Nama unit maksimal 200 karakter")
        .transform((val) => val.trim()),
    type: z
        .string()
        .min(1, "Tipe wajib diisi")
        .transform((val) => val.trim()),
    brand: z
        .string()
        .min(1, "Merk wajib diisi")
        .max(100, "Merk maksimal 100 karakter")
        .transform((val) => val.trim()),
    model: z
        .string()
        .min(1, "Model wajib diisi")
        .max(100, "Model maksimal 100 karakter")
        .transform((val) => val.trim()),
    year: z
        .string()
        .optional()
        .default("")
        .refine((val) => !val || isValidNumber(val), "Tahun harus berupa angka")
        .transform((val) => {
            if (!val || val.trim() === "") return null;
            const num = parseInt(val);
            if (num < 1900 || num > new Date().getFullYear() + 1) return null;
            return num;
        }),
    siteLocation: z
        .string()
        .optional()
        .default("")
        .transform((val) => val?.trim() || ""),
    status: z
        .string()
        .optional()
        .default("active")
        .transform((val) => normalizeString(val || "active"))
        .refine(
            (val) => ALAT_BERAT_STATUS.includes(val as typeof ALAT_BERAT_STATUS[number]),
            `Status harus salah satu dari: ${ALAT_BERAT_STATUS.join(", ")}`
        ),
});

export type AlatBeratImportData = z.infer<typeof alatBeratImportSchema>;

// ============================================
// SPAREPART SCHEMA
// ============================================

export const sparepartImportSchema = z.object({
    code: z
        .string()
        .min(1, "Kode sparepart wajib diisi")
        .max(50, "Kode sparepart maksimal 50 karakter")
        .transform((val) => val.trim().toUpperCase()),
    name: z
        .string()
        .min(1, "Nama sparepart wajib diisi")
        .max(200, "Nama sparepart maksimal 200 karakter")
        .transform((val) => val.trim()),
    categoryName: z
        .string()
        .min(1, "Kategori wajib diisi")
        .transform((val) => val.trim()),
    brand: z
        .string()
        .optional()
        .default("")
        .transform((val) => val?.trim() || ""),
    unit: z
        .string()
        .min(1, "Satuan wajib diisi")
        .transform((val) => normalizeString(val)),
    minStock: z
        .string()
        .optional()
        .default("0")
        .refine((val) => isValidNumber(val || "0"), "Stok minimum harus berupa angka")
        .transform((val) => {
            const num = parseInt(val || "0");
            return isNaN(num) ? 0 : Math.max(0, num);
        }),
    location: z
        .string()
        .optional()
        .default("")
        .transform((val) => val?.trim() || ""),
});

export type SparepartImportData = z.infer<typeof sparepartImportSchema>;

// ============================================
// KARYAWAN SCHEMA
// ============================================

export const karyawanImportSchema = z.object({
    nik: z
        .string()
        .min(1, "NIK wajib diisi")
        .max(50, "NIK maksimal 50 karakter")
        .transform((val) => val.trim()),
    name: z
        .string()
        .min(1, "Nama wajib diisi")
        .min(2, "Nama minimal 2 karakter")
        .max(200, "Nama maksimal 200 karakter")
        .transform((val) => val.trim()),
    position: z
        .string()
        .min(1, "Jabatan wajib diisi")
        .transform((val) => val.trim()),
    department: z
        .string()
        .optional()
        .default("")
        .transform((val) => val?.trim() || ""),
    phone: z
        .string()
        .optional()
        .default("")
        .transform((val) => val?.trim().replace(/\D/g, "") || ""), // Remove non-digits
});

export type KaryawanImportData = z.infer<typeof karyawanImportSchema>;

// ============================================
// STOK AWAL SCHEMA
// ============================================

export const stokAwalImportSchema = z.object({
    sparepartCode: z
        .string()
        .min(1, "Kode sparepart wajib diisi")
        .transform((val) => val.trim().toUpperCase()),
    quantity: z
        .string()
        .min(1, "Jumlah stok wajib diisi")
        .refine((val) => isValidNumber(val), "Jumlah harus berupa angka")
        .transform((val) => {
            const num = parseInt(val);
            if (isNaN(num) || num < 0) {
                throw new Error("Jumlah harus angka >= 0");
            }
            return num;
        }),
    notes: z
        .string()
        .optional()
        .default("")
        .transform((val) => val?.trim() || ""),
});

export type StokAwalImportData = z.infer<typeof stokAwalImportSchema>;

// ============================================
// ADVANCED VALIDATION FUNCTIONS
// ============================================

export interface DuplicateCheckResult {
    hasDuplicates: boolean;
    duplicates: { value: string; rows: number[] }[];
}

/**
 * Check for duplicates in a specific field
 */
export function checkDuplicates(
    data: Record<string, unknown>[],
    field: string,
    startRow: number = 4
): DuplicateCheckResult {
    const valueMap = new Map<string, number[]>();

    data.forEach((row, index) => {
        const value = String(row[field] || "").trim().toLowerCase();
        if (value) {
            const rowNum = index + startRow;
            if (valueMap.has(value)) {
                valueMap.get(value)!.push(rowNum);
            } else {
                valueMap.set(value, [rowNum]);
            }
        }
    });

    const duplicates: { value: string; rows: number[] }[] = [];
    valueMap.forEach((rows, value) => {
        if (rows.length > 1) {
            duplicates.push({ value, rows });
        }
    });

    return {
        hasDuplicates: duplicates.length > 0,
        duplicates,
    };
}

export interface ReferenceCheckResult {
    hasInvalidRefs: boolean;
    invalidRefs: { value: string; row: number }[];
}

/**
 * Check if referenced values exist in master data
 */
export function checkReferences(
    data: Record<string, unknown>[],
    field: string,
    validValues: string[],
    startRow: number = 4
): ReferenceCheckResult {
    const normalizedValidValues = validValues.map((v) => v.trim().toLowerCase());
    const invalidRefs: { value: string; row: number }[] = [];

    data.forEach((row, index) => {
        const value = String(row[field] || "").trim();
        if (value) {
            const normalizedValue = value.toLowerCase();
            if (!normalizedValidValues.includes(normalizedValue)) {
                invalidRefs.push({ value, row: index + startRow });
            }
        }
    });

    return {
        hasInvalidRefs: invalidRefs.length > 0,
        invalidRefs,
    };
}

export interface ValidationSummary {
    isValid: boolean;
    errors: string[];
    duplicateErrors: DuplicateCheckResult;
    referenceErrors?: ReferenceCheckResult;
}

/**
 * Comprehensive validation for import data
 */
export function validateImportData(
    type: string,
    data: Record<string, unknown>[],
    masterData?: { categories?: string[]; spareparts?: string[] }
): ValidationSummary {
    const errors: string[] = [];
    let duplicateErrors: DuplicateCheckResult = { hasDuplicates: false, duplicates: [] };
    let referenceErrors: ReferenceCheckResult | undefined;

    switch (type) {
        case "kategori":
            duplicateErrors = checkDuplicates(data, "name");
            if (duplicateErrors.hasDuplicates) {
                duplicateErrors.duplicates.forEach((d) => {
                    errors.push(`Kategori "${d.value}" duplikat di baris: ${d.rows.join(", ")}`);
                });
            }
            break;

        case "supplier":
            duplicateErrors = checkDuplicates(data, "name");
            if (duplicateErrors.hasDuplicates) {
                duplicateErrors.duplicates.forEach((d) => {
                    errors.push(`Supplier "${d.value}" duplikat di baris: ${d.rows.join(", ")}`);
                });
            }
            break;

        case "alat-berat":
            duplicateErrors = checkDuplicates(data, "code");
            if (duplicateErrors.hasDuplicates) {
                duplicateErrors.duplicates.forEach((d) => {
                    errors.push(`Kode unit "${d.value}" duplikat di baris: ${d.rows.join(", ")}`);
                });
            }
            break;

        case "sparepart":
            duplicateErrors = checkDuplicates(data, "code");
            if (duplicateErrors.hasDuplicates) {
                duplicateErrors.duplicates.forEach((d) => {
                    errors.push(`Kode sparepart "${d.value}" duplikat di baris: ${d.rows.join(", ")}`);
                });
            }
            // Check category references
            if (masterData?.categories) {
                referenceErrors = checkReferences(data, "categoryName", masterData.categories);
                if (referenceErrors.hasInvalidRefs) {
                    referenceErrors.invalidRefs.forEach((r) => {
                        errors.push(`Kategori "${r.value}" tidak ditemukan (baris ${r.row})`);
                    });
                }
            }
            break;

        case "karyawan":
            duplicateErrors = checkDuplicates(data, "nik");
            if (duplicateErrors.hasDuplicates) {
                duplicateErrors.duplicates.forEach((d) => {
                    errors.push(`NIK "${d.value}" duplikat di baris: ${d.rows.join(", ")}`);
                });
            }
            break;

        case "stok-awal":
            duplicateErrors = checkDuplicates(data, "sparepartCode");
            if (duplicateErrors.hasDuplicates) {
                duplicateErrors.duplicates.forEach((d) => {
                    errors.push(`Kode sparepart "${d.value}" duplikat di baris: ${d.rows.join(", ")}`);
                });
            }
            // Check sparepart references
            if (masterData?.spareparts) {
                referenceErrors = checkReferences(data, "sparepartCode", masterData.spareparts);
                if (referenceErrors.hasInvalidRefs) {
                    referenceErrors.invalidRefs.forEach((r) => {
                        errors.push(`Sparepart "${r.value}" tidak ditemukan di master (baris ${r.row})`);
                    });
                }
            }
            break;
    }

    return {
        isValid: errors.length === 0,
        errors,
        duplicateErrors,
        referenceErrors,
    };
}

// ============================================
// SCHEMA MAP
// ============================================

export const importSchemaMap = {
    kategori: kategoriImportSchema,
    supplier: supplierImportSchema,
    "alat-berat": alatBeratImportSchema,
    sparepart: sparepartImportSchema,
    karyawan: karyawanImportSchema,
    "stok-awal": stokAwalImportSchema,
} as const;

export type ImportType = keyof typeof importSchemaMap;
