/**
 * Input Validator Library
 * Centralized Zod schemas and validators for all input types
 */

import { z } from "zod";

// ============================================
// COMMON VALIDATORS
// ============================================

/**
 * Sanitize string: trim whitespace, collapse multiple spaces
 */
const sanitizedString = z.string().transform((val) => val.trim().replace(/\s+/g, " "));

/**
 * Non-empty sanitized string
 */
const requiredString = sanitizedString.refine((val) => val.length > 0, {
    message: "Field ini wajib diisi",
});

// ============================================
// SPECIFIC FIELD VALIDATORS
// ============================================

/**
 * NIK (Nomor Induk Karyawan) - only numbers, typically 8-20 digits
 */
export const nikSchema = z
    .string()
    .trim()
    .regex(/^\d{5,20}$/, "NIK harus berupa 5-20 digit angka");

/**
 * Email format
 */
export const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .email("Format email tidak valid")
    .max(254, "Email terlalu panjang");

/**
 * Phone number - numbers and allowed characters +, -, space
 */
export const phoneSchema = z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{8,20}$/, "Format nomor telepon tidak valid")
    .optional()
    .or(z.literal(""));

/**
 * Code - alphanumeric, uppercase, with optional dash/underscore
 */
export const codeSchema = z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9\-_]{2,50}$/, "Kode harus huruf/angka (2-50 karakter)");

/**
 * Optional code
 */
export const optionalCodeSchema = codeSchema.optional().or(z.literal(""));

/**
 * Positive integer (for stock, quantity, etc.)
 */
export const positiveIntSchema = z
    .number()
    .int("Harus bilangan bulat")
    .min(0, "Tidak boleh negatif")
    .max(999999999, "Nilai terlalu besar");

/**
 * Positive number (for prices, etc.)
 */
export const positiveNumberSchema = z
    .number()
    .min(0, "Tidak boleh negatif")
    .max(999999999999, "Nilai terlalu besar");

/**
 * Date string (ISO format)
 */
export const dateSchema = z
    .string()
    .refine(
        (val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        },
        { message: "Format tanggal tidak valid" }
    )
    .transform((val) => new Date(val));

/**
 * Date range validator
 */
export const dateRangeSchema = z
    .object({
        startDate: dateSchema,
        endDate: dateSchema,
    })
    .refine((data) => data.startDate <= data.endDate, {
        message: "Tanggal mulai harus sebelum tanggal akhir",
    });

/**
 * Year (reasonable range)
 */
export const yearSchema = z
    .number()
    .int()
    .min(1900, "Tahun tidak valid")
    .max(new Date().getFullYear() + 10, "Tahun tidak valid");

/**
 * Safe text - no HTML, limited length
 */
export const safeTextSchema = (maxLength: number = 255) =>
    z
        .string()
        .trim()
        .max(maxLength, `Maksimal ${maxLength} karakter`)
        .transform((val) => val.replace(/<[^>]*>/g, "")); // Strip HTML tags

/**
 * Notes/description - longer text, sanitized
 */
export const notesSchema = z
    .string()
    .trim()
    .max(1000, "Maksimal 1000 karakter")
    .transform((val) => val.replace(/<[^>]*>/g, ""))
    .optional()
    .or(z.literal(""));

/**
 * CUID (Prisma ID format)
 */
export const cuidSchema = z
    .string()
    .regex(/^c[a-z0-9]{24,}$/i, "ID tidak valid");

/**
 * Optional CUID
 */
export const optionalCuidSchema = cuidSchema.optional().or(z.literal("")).or(z.null());

/**
 * Username (alphanumeric, underscore, 3-50 chars)
 */
export const usernameSchema = z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,50}$/, "Username harus 3-50 karakter (huruf, angka, underscore)");

/**
 * Password (min 8 chars, at least 1 letter and 1 number)
 */
export const passwordSchema = z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[a-zA-Z]/, "Password harus mengandung huruf")
    .regex(/[0-9]/, "Password harus mengandung angka");

/**
 * Status options
 */
export const statusSchema = z.enum(["active", "inactive", "maintenance", "pending", "approved", "rejected"]);

/**
 * Role options
 */
export const roleSchema = z.enum(["admin", "supervisor", "staff"]);

// ============================================
// ENTITY SCHEMAS
// ============================================

/**
 * Category schema
 */
export const categorySchema = z.object({
    name: safeTextSchema(100).refine((val) => val.length >= 2, {
        message: "Nama kategori minimal 2 karakter",
    }),
    description: notesSchema,
});

/**
 * Supplier schema
 */
export const supplierSchema = z.object({
    name: safeTextSchema(100).refine((val) => val.length >= 2, {
        message: "Nama supplier minimal 2 karakter",
    }),
    address: notesSchema,
    phone: phoneSchema,
    email: emailSchema.optional().or(z.literal("")),
    contactPerson: safeTextSchema(100).optional(),
});

/**
 * Heavy Equipment schema
 */
export const heavyEquipmentSchema = z.object({
    code: codeSchema,
    name: safeTextSchema(100).refine((val) => val.length >= 2, {
        message: "Nama minimal 2 karakter",
    }),
    type: safeTextSchema(50),
    brand: safeTextSchema(50).optional(),
    model: safeTextSchema(50).optional(),
    year: yearSchema.optional().nullable(),
    site: safeTextSchema(100).optional(),
    status: z.enum(["active", "inactive", "maintenance"]).default("active"),
});

/**
 * Employee schema
 */
export const employeeSchema = z.object({
    nik: nikSchema,
    name: safeTextSchema(100).refine((val) => val.length >= 2, {
        message: "Nama minimal 2 karakter",
    }),
    position: safeTextSchema(50).optional(),
    department: safeTextSchema(50).optional(),
    phone: phoneSchema,
    email: emailSchema.optional().or(z.literal("")),
    address: notesSchema,
    status: z.enum(["active", "inactive"]).default("active"),
});

/**
 * Sparepart schema
 */
export const sparepartSchema = z.object({
    code: codeSchema,
    name: safeTextSchema(100).refine((val) => val.length >= 2, {
        message: "Nama sparepart minimal 2 karakter",
    }),
    categoryId: cuidSchema,
    brand: safeTextSchema(50).optional(),
    unit: safeTextSchema(20),
    minStock: positiveIntSchema.default(0),
    currentStock: positiveIntSchema.default(0),
    location: safeTextSchema(50).optional(),
    notes: notesSchema,
});

/**
 * Stock In schema
 */
export const stockInSchema = z.object({
    sparepartId: cuidSchema,
    supplierId: optionalCuidSchema,
    quantity: positiveIntSchema.refine((val) => val > 0, {
        message: "Jumlah harus lebih dari 0",
    }),
    purchasePrice: positiveNumberSchema.optional().nullable(),
    invoiceNumber: safeTextSchema(50).optional(),
    warrantyExpiry: dateSchema.optional().nullable(),
    notes: notesSchema,
});

/**
 * Stock Out schema
 */
export const stockOutSchema = z.object({
    sparepartId: cuidSchema,
    equipmentId: optionalCuidSchema,
    employeeId: optionalCuidSchema,
    quantity: positiveIntSchema.refine((val) => val > 0, {
        message: "Jumlah harus lebih dari 0",
    }),
    purpose: safeTextSchema(200),
    notes: notesSchema,
});

/**
 * User schema
 */
export const userSchema = z.object({
    username: usernameSchema,
    password: passwordSchema,
    name: safeTextSchema(100),
    role: roleSchema,
});

/**
 * Login schema
 */
export const loginSchema = z.object({
    username: z.string().trim().min(1, "Username wajib diisi"),
    password: z.string().min(1, "Password wajib diisi"),
});

// ============================================
// HELPERS
// ============================================

/**
 * Validate data against schema and return result
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: z.ZodIssue[];
} {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, errors: result.error.issues };
}

/**
 * Format Zod errors to user-friendly message
 */
export function formatZodErrors(errors: z.ZodIssue[]): string {
    return errors.map((e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`).join(", ");
}

/**
 * Parse request body and validate with schema
 */
export async function parseAndValidate<T>(
    request: Request,
    schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
    try {
        const body = await request.json();
        const result = schema.safeParse(body);

        if (result.success) {
            return { success: true, data: result.data };
        }

        return { success: false, error: formatZodErrors(result.error.issues) };
    } catch (error) {
        return { success: false, error: "Invalid JSON body" };
    }
}
