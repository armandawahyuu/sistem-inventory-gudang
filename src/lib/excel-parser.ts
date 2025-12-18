import * as XLSX from "xlsx";
import { z, ZodSchema, ZodError } from "zod";

// ============================================
// TYPES
// ============================================

export interface ParseConfig {
    headerRow?: number;      // Default: 1 (row ke-1)
    dataStartRow?: number;   // Default: 4 (skip header, contoh, keterangan)
    columns: {
        key: string;
        excelColumn: string; // Nama kolom di Excel (dengan atau tanpa *)
    }[];
}

export interface ParseResult<T> {
    data: T[];
    totalRows: number;
}

export interface ValidRow<T> {
    rowNumber: number;
    data: T;
}

export interface ErrorRow {
    rowNumber: number;
    data: Record<string, unknown>;
    errorMessages: string[];
}

export interface ValidationResult<T> {
    valid: ValidRow<T>[];
    errors: ErrorRow[];
    summary: {
        total: number;
        validCount: number;
        errorCount: number;
    };
}

// ============================================
// PARSE EXCEL
// ============================================

/**
 * Parse file Excel dan return array of objects
 * @param buffer - ArrayBuffer dari file Excel
 * @param config - Konfigurasi parsing
 */
export function parseExcel<T = Record<string, unknown>>(
    buffer: ArrayBuffer,
    config: ParseConfig
): ParseResult<T> {
    const { headerRow = 1, dataStartRow = 4, columns } = config;

    // Read workbook
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to array of arrays
    const rawData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

    if (rawData.length < dataStartRow) {
        return { data: [], totalRows: 0 };
    }

    // Get header row (for mapping)
    const headers = rawData[headerRow - 1] as string[];

    // Clean headers (remove * from required columns)
    const cleanHeaders = headers.map((h) =>
        typeof h === "string" ? h.replace(/\*$/, "").trim() : ""
    );

    // Create column index map
    const columnIndexMap: Record<string, number> = {};
    columns.forEach((col) => {
        const cleanExcelCol = col.excelColumn.replace(/\*$/, "").trim();
        const index = cleanHeaders.findIndex(
            (h) => h.toLowerCase() === cleanExcelCol.toLowerCase()
        );
        if (index !== -1) {
            columnIndexMap[col.key] = index;
        }
    });

    // Parse data rows (starting from dataStartRow)
    const data: T[] = [];
    for (let i = dataStartRow - 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;

        // Check if row is empty (all cells empty)
        const hasData = row.some((cell) => cell !== undefined && cell !== null && cell !== "");
        if (!hasData) continue;

        const rowData: Record<string, unknown> = {};
        columns.forEach((col) => {
            const index = columnIndexMap[col.key];
            if (index !== undefined) {
                const value = row[index];
                rowData[col.key] = value !== undefined ? String(value).trim() : "";
            } else {
                rowData[col.key] = "";
            }
        });

        data.push(rowData as T);
    }

    return { data, totalRows: data.length };
}

// ============================================
// VALIDATE ROWS
// ============================================

/**
 * Validasi array of rows dengan Zod schema
 * @param rows - Array of data objects
 * @param schema - Zod schema untuk validasi
 */
export function validateRows<T>(
    rows: Record<string, unknown>[],
    schema: ZodSchema<T>
): ValidationResult<T> {
    const valid: ValidRow<T>[] = [];
    const errors: ErrorRow[] = [];

    rows.forEach((row, index) => {
        const rowNumber = index + 4; // Karena data mulai dari baris ke-4

        try {
            const validatedData = schema.parse(row);
            valid.push({ rowNumber, data: validatedData });
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.issues.map((e) => {
                    const path = e.path.join(".");
                    return `${path}: ${e.message}`;
                });
                errors.push({ rowNumber, data: row, errorMessages });
            } else {
                errors.push({
                    rowNumber,
                    data: row,
                    errorMessages: ["Unknown validation error"],
                });
            }
        }
    });

    return {
        valid,
        errors,
        summary: {
            total: rows.length,
            validCount: valid.length,
            errorCount: errors.length,
        },
    };
}

// ============================================
// ZOD SCHEMAS FOR IMPORT
// ============================================

// Kategori Schema
export const kategoriSchema = z.object({
    name: z.string().min(1, "Nama kategori wajib diisi").min(2, "Minimal 2 karakter"),
});
export type KategoriImport = z.infer<typeof kategoriSchema>;

// Supplier Schema
export const supplierSchema = z.object({
    name: z.string().min(1, "Nama supplier wajib diisi").min(2, "Minimal 2 karakter"),
    phone: z.string().optional().default(""),
    email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
    address: z.string().optional().default(""),
});
export type SupplierImport = z.infer<typeof supplierSchema>;

// Alat Berat Schema
export const alatBeratSchema = z.object({
    code: z.string().min(1, "Kode unit wajib diisi"),
    name: z.string().min(1, "Nama unit wajib diisi"),
    type: z.string().min(1, "Tipe wajib diisi"),
    brand: z.string().min(1, "Merk wajib diisi"),
    model: z.string().min(1, "Model wajib diisi"),
    year: z.string().optional().transform((val) => val ? parseInt(val) || null : null),
    siteLocation: z.string().optional().default(""),
    status: z.enum(["active", "maintenance", "inactive"]).default("active"),
});
export type AlatBeratImport = z.infer<typeof alatBeratSchema>;

// Sparepart Schema
export const sparepartSchema = z.object({
    code: z.string().min(1, "Kode sparepart wajib diisi"),
    name: z.string().min(1, "Nama sparepart wajib diisi"),
    categoryName: z.string().min(1, "Kategori wajib diisi"),
    brand: z.string().optional().default(""),
    unit: z.string().min(1, "Satuan wajib diisi"),
    minStock: z.string().optional().transform((val) => val ? parseInt(val) || 0 : 0),
    location: z.string().optional().default(""),
});
export type SparepartImport = z.infer<typeof sparepartSchema>;

// Karyawan Schema
export const karyawanSchema = z.object({
    nik: z.string().min(1, "NIK wajib diisi"),
    name: z.string().min(1, "Nama wajib diisi"),
    position: z.string().min(1, "Jabatan wajib diisi"),
    department: z.string().optional().default(""),
    phone: z.string().optional().default(""),
});
export type KaryawanImport = z.infer<typeof karyawanSchema>;

// Stok Awal Schema
export const stokAwalSchema = z.object({
    sparepartCode: z.string().min(1, "Kode sparepart wajib diisi"),
    quantity: z.string().min(1, "Jumlah stok wajib diisi").transform((val) => {
        const num = parseInt(val);
        if (isNaN(num) || num < 0) throw new Error("Jumlah harus angka >= 0");
        return num;
    }),
    notes: z.string().optional().default(""),
});
export type StokAwalImport = z.infer<typeof stokAwalSchema>;

// ============================================
// PARSE CONFIGS FOR EACH TYPE
// ============================================

export const parseConfigs: Record<string, ParseConfig> = {
    kategori: {
        columns: [{ key: "name", excelColumn: "Nama Kategori" }],
    },
    supplier: {
        columns: [
            { key: "name", excelColumn: "Nama Supplier" },
            { key: "phone", excelColumn: "Telepon" },
            { key: "email", excelColumn: "Email" },
            { key: "address", excelColumn: "Alamat" },
        ],
    },
    "alat-berat": {
        columns: [
            { key: "code", excelColumn: "Kode Unit" },
            { key: "name", excelColumn: "Nama" },
            { key: "type", excelColumn: "Tipe" },
            { key: "brand", excelColumn: "Merk" },
            { key: "model", excelColumn: "Model" },
            { key: "year", excelColumn: "Tahun" },
            { key: "siteLocation", excelColumn: "Lokasi Site" },
            { key: "status", excelColumn: "Status" },
        ],
    },
    sparepart: {
        columns: [
            { key: "code", excelColumn: "Kode" },
            { key: "name", excelColumn: "Nama" },
            { key: "categoryName", excelColumn: "Kategori" },
            { key: "brand", excelColumn: "Merk" },
            { key: "unit", excelColumn: "Satuan" },
            { key: "minStock", excelColumn: "Stok Minimum" },
            { key: "location", excelColumn: "Lokasi Rak" },
        ],
    },
    karyawan: {
        columns: [
            { key: "nik", excelColumn: "NIK" },
            { key: "name", excelColumn: "Nama" },
            { key: "position", excelColumn: "Jabatan" },
            { key: "department", excelColumn: "Departemen" },
            { key: "phone", excelColumn: "Telepon" },
        ],
    },
    "stok-awal": {
        columns: [
            { key: "sparepartCode", excelColumn: "Kode Sparepart" },
            { key: "quantity", excelColumn: "Jumlah Stok" },
            { key: "notes", excelColumn: "Keterangan" },
        ],
    },
};

// Schema map for validation
export const importSchemas: Record<string, ZodSchema> = {
    kategori: kategoriSchema,
    supplier: supplierSchema,
    "alat-berat": alatBeratSchema,
    sparepart: sparepartSchema,
    karyawan: karyawanSchema,
    "stok-awal": stokAwalSchema,
};
