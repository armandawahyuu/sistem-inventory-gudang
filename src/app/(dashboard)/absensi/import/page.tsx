"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface AttendanceRow {
    nik: string;
    date: string;
    clockIn: string | null;
    clockOut: string | null;
}

interface ImportResult {
    row: number;
    nik: string;
    date: string;
    status: "success" | "error";
    message: string;
}

interface ImportSummary {
    total: number;
    success: number;
    error: number;
}

export default function ImportAbsensiPage() {
    const [parsedData, setParsedData] = useState<AttendanceRow[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
    const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setFileName(file.name);
        setImportResults(null);
        setImportSummary(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                // Skip header row and parse data
                const rows: AttendanceRow[] = [];
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0 || !row[0]) continue;

                    // Handle Excel date serial number
                    let dateStr = "";
                    if (typeof row[1] === "number") {
                        // Excel date serial number
                        const excelDate = XLSX.SSF.parse_date_code(row[1]);
                        dateStr = `${String(excelDate.d).padStart(2, "0")}/${String(excelDate.m).padStart(2, "0")}/${excelDate.y}`;
                    } else {
                        dateStr = String(row[1] || "");
                    }

                    // Handle time values
                    let clockIn = "";
                    let clockOut = "";

                    if (typeof row[2] === "number") {
                        // Excel time fraction
                        const totalMinutes = Math.round(row[2] * 24 * 60);
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;
                        clockIn = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
                    } else {
                        clockIn = String(row[2] || "");
                    }

                    if (typeof row[3] === "number") {
                        const totalMinutes = Math.round(row[3] * 24 * 60);
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;
                        clockOut = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
                    } else {
                        clockOut = String(row[3] || "");
                    }

                    rows.push({
                        nik: String(row[0] || ""),
                        date: dateStr,
                        clockIn: clockIn || null,
                        clockOut: clockOut || null,
                    });
                }

                setParsedData(rows);
                toast.success(`${rows.length} baris data berhasil dibaca`);
            } catch (err) {
                console.error("Error parsing Excel:", err);
                toast.error("Gagal membaca file Excel");
                setParsedData([]);
            }
        };
        reader.readAsArrayBuffer(file);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "application/vnd.ms-excel": [".xls"],
        },
        maxFiles: 1,
    });

    const handleDownloadTemplate = () => {
        const templateData = [
            ["NIK", "Tanggal", "Jam Masuk", "Jam Keluar"],
            ["EMP001", "01/12/2024", "07:55", "17:00"],
            ["EMP002", "01/12/2024", "08:15", "17:30"],
            ["EMP003", "01/12/2024", "09:00", "18:00"],
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Absensi");

        // Set column widths
        ws["!cols"] = [
            { wch: 15 },
            { wch: 15 },
            { wch: 12 },
            { wch: 12 },
        ];

        XLSX.writeFile(wb, "template_absensi.xlsx");
        toast.success("Template berhasil didownload");
    };

    const handleImport = async () => {
        if (parsedData.length === 0) {
            toast.error("Tidak ada data untuk diimport");
            return;
        }

        setIsImporting(true);
        try {
            const response = await fetch("/api/absensi/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: parsedData }),
            });

            const result = await response.json();

            if (response.ok) {
                setImportResults(result.data.results);
                setImportSummary(result.data.summary);
                toast.success(result.message);
            } else {
                toast.error(result.error || "Gagal import data");
            }
        } catch (error) {
            console.error("Error importing:", error);
            toast.error("Terjadi kesalahan saat import");
        } finally {
            setIsImporting(false);
        }
    };

    const handleReset = () => {
        setParsedData([]);
        setFileName(null);
        setImportResults(null);
        setImportSummary(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Import Data Absensi</h1>
                <p className="text-slate-600 mt-1">Upload file Excel untuk import data absensi karyawan</p>
            </div>

            {/* Upload & Template Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload Area */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Upload File Excel</CardTitle>
                        <CardDescription>Format file: .xlsx atau .xls</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-slate-300 hover:border-slate-400"
                                }`}
                        >
                            <input {...getInputProps()} />
                            <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                            {isDragActive ? (
                                <p className="text-blue-600 font-medium">Drop file di sini...</p>
                            ) : (
                                <>
                                    <p className="text-slate-600 font-medium">
                                        Drag & drop file Excel di sini
                                    </p>
                                    <p className="text-slate-400 text-sm mt-1">
                                        atau klik untuk browse file
                                    </p>
                                </>
                            )}
                        </div>

                        {fileName && (
                            <div className="mt-4 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                    <span className="font-medium text-green-800">{fileName}</span>
                                    <Badge variant="secondary">{parsedData.length} baris</Badge>
                                </div>
                                <Button variant="ghost" size="sm" onClick={handleReset}>
                                    Reset
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Template Download */}
                <Card>
                    <CardHeader>
                        <CardTitle>Template Excel</CardTitle>
                        <CardDescription>Download template format yang benar</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-slate-600 space-y-2">
                            <p className="font-medium">Format kolom:</p>
                            <ul className="list-disc list-inside space-y-1 text-slate-500">
                                <li>NIK (wajib)</li>
                                <li>Tanggal (DD/MM/YYYY)</li>
                                <li>Jam Masuk (HH:MM)</li>
                                <li>Jam Keluar (HH:MM)</li>
                            </ul>
                        </div>
                        <Button onClick={handleDownloadTemplate} className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Download Template
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Preview Data */}
            {parsedData.length > 0 && !importResults && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Preview Data ({parsedData.length} baris)</CardTitle>
                            <Button onClick={handleImport} disabled={isImporting}>
                                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Import Data
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border max-h-96 overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">No</TableHead>
                                        <TableHead>NIK</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Jam Masuk</TableHead>
                                        <TableHead>Jam Keluar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData.slice(0, 50).map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell className="font-mono">{row.nik}</TableCell>
                                            <TableCell>{row.date}</TableCell>
                                            <TableCell>{row.clockIn || "-"}</TableCell>
                                            <TableCell>{row.clockOut || "-"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {parsedData.length > 50 && (
                            <p className="text-sm text-slate-500 mt-2">
                                Menampilkan 50 dari {parsedData.length} baris
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Import Results */}
            {importResults && importSummary && (
                <Card>
                    <CardHeader>
                        <CardTitle>Hasil Import</CardTitle>
                        <div className="flex gap-4 mt-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="font-medium text-green-600">{importSummary.success} Berhasil</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <XCircle className="h-5 w-5 text-red-600" />
                                <span className="font-medium text-red-600">{importSummary.error} Gagal</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border max-h-96 overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">Row</TableHead>
                                        <TableHead>NIK</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Keterangan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {importResults.map((result, index) => (
                                        <TableRow key={index} className={result.status === "error" ? "bg-red-50" : ""}>
                                            <TableCell>{result.row}</TableCell>
                                            <TableCell className="font-mono">{result.nik}</TableCell>
                                            <TableCell>{result.date}</TableCell>
                                            <TableCell>
                                                {result.status === "success" ? (
                                                    <Badge className="bg-green-100 text-green-800">Berhasil</Badge>
                                                ) : (
                                                    <Badge variant="destructive">Gagal</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">{result.message}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="mt-4">
                            <Button variant="outline" onClick={handleReset}>
                                Import File Baru
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
