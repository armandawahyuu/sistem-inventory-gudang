"use client";

import { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import {
    Upload,
    Download,
    FileSpreadsheet,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertCircle,
    AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Validation Schema Type
export interface ColumnSchema {
    key: string;
    label: string;
    required?: boolean;
    type?: "string" | "number" | "email" | "date";
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    customValidator?: (value: string) => string | null; // returns error message or null
}

interface ImportSectionProps {
    title: string;
    templateUrl?: string;
    columns: ColumnSchema[];
    validationSchema?: ColumnSchema[];
    importEndpoint: string;
    exampleData?: Record<string, string>[];
}

interface RowValidation {
    row: number;
    isValid: boolean;
    errors: Record<string, string>;
    data: Record<string, string>;
}

interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}

export function ImportSection({
    title,
    templateUrl,
    columns,
    validationSchema,
    importEndpoint,
    exampleData,
}: ImportSectionProps) {
    const [file, setFile] = useState<File | null>(null);
    const [rawData, setRawData] = useState<Record<string, string>[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    // Use validationSchema if provided, otherwise use columns
    const schema = validationSchema || columns;

    // Validate a single cell value
    const validateCell = useCallback((value: string | undefined, column: ColumnSchema): string | null => {
        const val = value?.toString().trim() || "";

        // Required check
        if (column.required && !val) {
            return `${column.label} wajib diisi`;
        }

        if (!val) return null; // Empty optional field is OK

        // Type validation
        switch (column.type) {
            case "number":
                if (isNaN(Number(val))) {
                    return `${column.label} harus berupa angka`;
                }
                break;
            case "email":
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(val)) {
                    return `${column.label} format email tidak valid`;
                }
                break;
            case "date":
                if (isNaN(Date.parse(val))) {
                    return `${column.label} format tanggal tidak valid`;
                }
                break;
        }

        // Min/Max length
        if (column.minLength && val.length < column.minLength) {
            return `${column.label} minimal ${column.minLength} karakter`;
        }
        if (column.maxLength && val.length > column.maxLength) {
            return `${column.label} maksimal ${column.maxLength} karakter`;
        }

        // Pattern validation
        if (column.pattern && !column.pattern.test(val)) {
            return `${column.label} format tidak valid`;
        }

        // Custom validator
        if (column.customValidator) {
            return column.customValidator(val);
        }

        return null;
    }, []);

    // Validate all rows
    const validatedData = useMemo((): RowValidation[] => {
        return rawData.map((row, index) => {
            const errors: Record<string, string> = {};
            let isValid = true;

            schema.forEach((column) => {
                const error = validateCell(row[column.key], column);
                if (error) {
                    errors[column.key] = error;
                    isValid = false;
                }
            });

            return {
                row: index + 1,
                isValid,
                errors,
                data: row,
            };
        });
    }, [rawData, schema, validateCell]);

    // Summary statistics
    const summary = useMemo(() => {
        const total = validatedData.length;
        const valid = validatedData.filter((r) => r.isValid).length;
        const error = total - valid;
        return { total, valid, error };
    }, [validatedData]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const uploadedFile = acceptedFiles[0];
        if (uploadedFile) {
            setFile(uploadedFile);
            setImportResult(null);
            parseExcel(uploadedFile);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "application/vnd.ms-excel": [".xls"],
        },
        maxFiles: 1,
    });

    const parseExcel = async (file: File) => {
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);
            setRawData(jsonData);
        } catch (error) {
            console.error("Error parsing Excel:", error);
            toast.error("Gagal membaca file Excel");
        }
    };

    const downloadTemplate = () => {
        // Generate example data from columns if not provided
        const templateData = exampleData || [
            columns.reduce((acc, col) => {
                acc[col.key] = col.type === "number" ? "0" : `Contoh ${col.label}`;
                return acc;
            }, {} as Record<string, string>),
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

        // Set column widths
        const colWidths = columns.map((col) => ({ wch: Math.max(col.label.length + 5, 15) }));
        worksheet["!cols"] = colWidths;

        const fileName = title.toLowerCase().replace(/\s+/g, "-");
        XLSX.writeFile(workbook, `template-${fileName}.xlsx`);
        toast.success("Template berhasil didownload");
    };

    const handleImport = async () => {
        if (!file || summary.valid === 0) return;

        // Only import valid rows
        const validRows = validatedData.filter((r) => r.isValid).map((r) => r.data);

        setIsUploading(true);
        setImportResult(null);

        try {
            const response = await fetch(importEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ data: validRows }),
            });

            const result = await response.json();

            if (response.ok) {
                setImportResult({
                    success: result.success || validRows.length,
                    failed: result.failed || 0,
                    errors: result.errors || [],
                });
                toast.success(`Berhasil import ${result.success || validRows.length} data`);
            } else {
                toast.error(result.error || "Gagal melakukan import");
                setImportResult({
                    success: 0,
                    failed: validRows.length,
                    errors: [result.error || "Unknown error"],
                });
            }
        } catch (error) {
            console.error("Error importing:", error);
            toast.error("Terjadi kesalahan saat import");
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setRawData([]);
        setImportResult(null);
    };

    return (
        <div className="space-y-6">
            {/* Template Download */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                    <p className="font-medium text-slate-900">Download Template</p>
                    <p className="text-sm text-slate-600">
                        Kolom: {columns.map((c) => c.label).join(", ")}
                    </p>
                </div>
                <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                </Button>
            </div>

            {/* Upload Zone */}
            <div
                {...getRootProps()}
                className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer 
                    transition-colors duration-200
                    ${isDragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-300 hover:border-slate-400"
                    }
                    ${file ? "border-green-500 bg-green-50" : ""}
                `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                    {file ? (
                        <>
                            <FileSpreadsheet className="h-12 w-12 text-green-600" />
                            <p className="font-medium text-green-800">{file.name}</p>
                            <p className="text-sm text-green-600">
                                {rawData.length} baris data terdeteksi
                            </p>
                        </>
                    ) : (
                        <>
                            <Upload className="h-12 w-12 text-slate-400" />
                            <p className="font-medium text-slate-700">
                                {isDragActive
                                    ? "Lepaskan file di sini..."
                                    : "Drag & drop file Excel di sini"}
                            </p>
                            <p className="text-sm text-slate-500">
                                atau klik untuk memilih file (.xlsx, .xls)
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Summary Stats */}
            {rawData.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-100 rounded-lg text-center">
                        <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
                        <p className="text-sm text-slate-600">Total Baris</p>
                    </div>
                    <div className="p-4 bg-green-100 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-700">{summary.valid}</p>
                        <p className="text-sm text-green-600">Valid</p>
                    </div>
                    <div className="p-4 bg-red-100 rounded-lg text-center">
                        <p className="text-2xl font-bold text-red-700">{summary.error}</p>
                        <p className="text-sm text-red-600">Error</p>
                    </div>
                </div>
            )}

            {/* Preview Table with Validation */}
            {validatedData.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-slate-900">Preview Data</h3>
                        <Badge variant={summary.error > 0 ? "destructive" : "secondary"}>
                            {summary.error > 0
                                ? `${summary.error} baris error`
                                : "Semua data valid"
                            }
                        </Badge>
                    </div>
                    <div className="rounded-md border overflow-x-auto max-h-96">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white">
                                <TableRow>
                                    <TableHead className="w-12">No</TableHead>
                                    <TableHead className="w-16">Status</TableHead>
                                    {columns.map((col) => (
                                        <TableHead key={col.key}>
                                            {col.label}
                                            {col.required && <span className="text-red-500 ml-1">*</span>}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {validatedData.map((row) => (
                                    <TableRow
                                        key={row.row}
                                        className={row.isValid ? "" : "bg-red-50"}
                                    >
                                        <TableCell>{row.row}</TableCell>
                                        <TableCell>
                                            {row.isValid ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-600" />
                                            )}
                                        </TableCell>
                                        {columns.map((col) => (
                                            <TableCell
                                                key={col.key}
                                                className={row.errors[col.key] ? "text-red-600" : ""}
                                                title={row.errors[col.key] || ""}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {row.errors[col.key] && (
                                                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                                                    )}
                                                    <span className="truncate max-w-[200px]">
                                                        {String(row.data[col.key] || "-")}
                                                    </span>
                                                </div>
                                                {row.errors[col.key] && (
                                                    <p className="text-xs text-red-500 mt-0.5">
                                                        {row.errors[col.key]}
                                                    </p>
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Import Result */}
            {importResult && (
                <div className={`p-4 rounded-lg ${importResult.failed === 0
                        ? "bg-green-50 border border-green-200"
                        : "bg-yellow-50 border border-yellow-200"
                    }`}>
                    <div className="flex items-start gap-3">
                        {importResult.failed === 0 ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        )}
                        <div>
                            <p className="font-medium">
                                {importResult.failed === 0
                                    ? "Import berhasil!"
                                    : "Import selesai dengan beberapa error"
                                }
                            </p>
                            <div className="mt-2 flex gap-4 text-sm">
                                <span className="text-green-700">
                                    <CheckCircle2 className="inline h-4 w-4 mr-1" />
                                    Berhasil: {importResult.success}
                                </span>
                                {importResult.failed > 0 && (
                                    <span className="text-red-700">
                                        <XCircle className="inline h-4 w-4 mr-1" />
                                        Gagal: {importResult.failed}
                                    </span>
                                )}
                            </div>
                            {importResult.errors.length > 0 && (
                                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                                    {importResult.errors.slice(0, 5).map((error, i) => (
                                        <li key={i}>{error}</li>
                                    ))}
                                    {importResult.errors.length > 5 && (
                                        <li>...dan {importResult.errors.length - 5} error lainnya</li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {file && (
                <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={resetForm} disabled={isUploading}>
                        Reset
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={isUploading || summary.valid === 0}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Mengimport...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Import {summary.valid} Data Valid
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
