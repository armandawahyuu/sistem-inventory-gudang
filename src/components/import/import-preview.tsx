"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Upload,
    X,
    FileSpreadsheet,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Filter,
    Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

// ============================================
// TYPES
// ============================================

export interface ColumnDef {
    key: string;
    label: string;
    required?: boolean;
}

export interface ParsedRow {
    rowNumber: number;
    data: Record<string, unknown>;
    isValid: boolean;
}

export interface ErrorRow {
    row: number;
    data: Record<string, unknown>;
    errors: string[];
}

export interface ImportPreviewProps {
    data: ParsedRow[];
    errors: ErrorRow[];
    columns: ColumnDef[];
    onConfirm: (selectedRows: number[]) => void;
    onCancel: () => void;
    isLoading: boolean;
    importType?: string;
}

type FilterType = "all" | "valid" | "error";

const ROWS_PER_PAGE = 50;

// ============================================
// COMPONENT
// ============================================

export function ImportPreview({
    data,
    errors,
    columns,
    onConfirm,
    onCancel,
    isLoading,
    importType = "data",
}: ImportPreviewProps) {
    // State
    const [selectedRows, setSelectedRows] = useState<Set<number>>(
        new Set(data.filter((row) => row.isValid).map((row) => row.rowNumber))
    );
    const [filter, setFilter] = useState<FilterType>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Create error map for quick lookup
    const errorMap = useMemo(() => {
        const map = new Map<number, string[]>();
        errors.forEach((err) => {
            map.set(err.row, err.errors);
        });
        return map;
    }, [errors]);

    // Calculate stats
    const stats = useMemo(() => {
        const totalRows = data.length;
        const validRows = data.filter((row) => row.isValid).length;
        const errorRows = errors.length;
        const selectedCount = [...selectedRows].filter(rowNum =>
            data.find(r => r.rowNumber === rowNum)?.isValid
        ).length;
        const skippedCount = validRows - selectedCount + errorRows;
        return { totalRows, validRows, errorRows, selectedCount, skippedCount };
    }, [data, errors, selectedRows]);

    // Filter data
    const filteredData = useMemo(() => {
        switch (filter) {
            case "valid":
                return data.filter((row) => row.isValid);
            case "error":
                return data.filter((row) => !row.isValid);
            default:
                return data;
        }
    }, [data, filter]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ROWS_PER_PAGE;
        return filteredData.slice(start, start + ROWS_PER_PAGE);
    }, [filteredData, currentPage]);

    // Toggle row selection
    const toggleRow = (rowNumber: number) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(rowNumber)) {
            newSelected.delete(rowNumber);
        } else {
            newSelected.add(rowNumber);
        }
        setSelectedRows(newSelected);
    };

    // Toggle all on current page
    const toggleAllOnPage = () => {
        const newSelected = new Set(selectedRows);
        const validOnPage = paginatedData.filter((row) => row.isValid);
        const allSelected = validOnPage.every((row) => selectedRows.has(row.rowNumber));

        if (allSelected) {
            validOnPage.forEach((row) => newSelected.delete(row.rowNumber));
        } else {
            validOnPage.forEach((row) => newSelected.add(row.rowNumber));
        }
        setSelectedRows(newSelected);
    };

    // Select all valid rows
    const selectAllValid = () => {
        setSelectedRows(new Set(data.filter((row) => row.isValid).map((row) => row.rowNumber)));
    };

    // Check if row has errors
    const getRowErrors = (rowNumber: number): string[] | null => {
        return errorMap.get(rowNumber) || null;
    };

    // Download error report to Excel
    const downloadErrorReport = () => {
        if (errors.length === 0) return;

        const reportData = errors.map((err) => ({
            "Baris": err.row,
            ...Object.fromEntries(
                columns.map((col) => [col.label, err.data[col.key] || ""])
            ),
            "Error": err.errors.join("; "),
        }));

        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Error Report");

        // Auto-size columns
        const colWidths = Object.keys(reportData[0] || {}).map((key) => ({
            wch: Math.max(key.length, 15)
        }));
        ws["!cols"] = colWidths;

        XLSX.writeFile(wb, `error-report-${importType}-${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    // Handle confirm button click
    const handleConfirmClick = () => {
        setShowConfirmDialog(true);
    };

    // Handle actual import
    const handleImport = () => {
        setShowConfirmDialog(false);
        onConfirm([...selectedRows]);
    };

    // Are all valid rows on page selected?
    const allOnPageSelected = paginatedData
        .filter((row) => row.isValid)
        .every((row) => selectedRows.has(row.rowNumber));

    return (
        <TooltipProvider>
            <Card className="w-full">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                            <div>
                                <CardTitle>Preview Data Import</CardTitle>
                                <CardDescription>
                                    Periksa dan pilih data yang akan di-import
                                </CardDescription>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-4 gap-3 mt-4">
                        <Card className="bg-slate-50 border-slate-200">
                            <CardContent className="p-3 text-center">
                                <p className="text-2xl font-bold text-slate-700">{stats.totalRows}</p>
                                <p className="text-xs text-slate-500">Total Rows</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="p-3 text-center">
                                <p className="text-2xl font-bold text-green-700">{stats.validRows}</p>
                                <p className="text-xs text-green-600">Valid</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50 border-red-200">
                            <CardContent className="p-3 text-center">
                                <p className="text-2xl font-bold text-red-700">{stats.errorRows}</p>
                                <p className="text-xs text-red-600">Error</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="p-3 text-center">
                                <p className="text-2xl font-bold text-blue-700">{stats.selectedCount}</p>
                                <p className="text-xs text-blue-600">Akan di-Import</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-3 mt-4">
                        <Filter className="h-4 w-4 text-slate-500" />
                        <Select value={filter} onValueChange={(val: FilterType) => { setFilter(val); setCurrentPage(1); }}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tampilkan Semua</SelectItem>
                                <SelectItem value="valid">Hanya Valid</SelectItem>
                                <SelectItem value="error">Hanya Error</SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-sm text-slate-500">
                            Menampilkan {filteredData.length} dari {data.length} baris
                        </span>
                    </div>
                </CardHeader>

                <CardContent>
                    {/* Error Alert */}
                    {stats.errorRows > 0 && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                Terdapat {stats.errorRows} baris dengan error. Baris error tidak dapat dipilih untuk import.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Data Table */}
                    <ScrollArea className="h-[350px] rounded-md border">
                        <Table>
                            <TableHeader className="sticky top-0 bg-slate-50 z-10">
                                <TableRow>
                                    <TableHead className="w-12 text-center">
                                        <Checkbox
                                            checked={allOnPageSelected && paginatedData.some(r => r.isValid)}
                                            onCheckedChange={toggleAllOnPage}
                                            disabled={!paginatedData.some(r => r.isValid)}
                                        />
                                    </TableHead>
                                    <TableHead className="w-16 text-center">Baris</TableHead>
                                    <TableHead className="w-16 text-center">Status</TableHead>
                                    {columns.map((col) => (
                                        <TableHead key={col.key}>
                                            {col.label}
                                            {col.required && <span className="text-red-500 ml-1">*</span>}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length + 3}
                                            className="text-center py-8 text-muted-foreground"
                                        >
                                            Tidak ada data untuk ditampilkan
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((row) => {
                                        const rowErrors = getRowErrors(row.rowNumber);
                                        const hasError = !row.isValid;
                                        const isSelected = selectedRows.has(row.rowNumber);

                                        const RowContent = (
                                            <TableRow
                                                className={cn(
                                                    hasError && "bg-red-50 hover:bg-red-100",
                                                    isSelected && !hasError && "bg-green-50"
                                                )}
                                            >
                                                <TableCell className="text-center">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleRow(row.rowNumber)}
                                                        disabled={hasError}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-sm">
                                                    {row.rowNumber}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {row.isValid ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                                                    ) : (
                                                        <AlertTriangle className="h-4 w-4 text-red-600 mx-auto" />
                                                    )}
                                                </TableCell>
                                                {columns.map((col) => {
                                                    const value = row.data[col.key];
                                                    return (
                                                        <TableCell
                                                            key={col.key}
                                                            className="max-w-[200px] truncate"
                                                        >
                                                            {value !== undefined && value !== null && value !== ""
                                                                ? String(value)
                                                                : <span className="text-slate-400">-</span>
                                                            }
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        );

                                        // Wrap error rows with tooltip
                                        if (hasError && rowErrors) {
                                            return (
                                                <Tooltip key={row.rowNumber}>
                                                    <TooltipTrigger asChild>
                                                        {RowContent}
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="max-w-md bg-red-700 text-white">
                                                        <div className="text-sm">
                                                            <p className="font-semibold mb-1">Error pada baris {row.rowNumber}:</p>
                                                            <ul className="list-disc list-inside">
                                                                {rowErrors.map((err, i) => (
                                                                    <li key={i}>{err}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        }

                                        return <span key={row.rowNumber}>{RowContent}</span>;
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                Halaman {currentPage} dari {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Prev
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between border-t pt-4">
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                            <X className="h-4 w-4 mr-2" />
                            Batal
                        </Button>
                        {stats.errorRows > 0 && (
                            <Button variant="outline" onClick={downloadErrorReport}>
                                <Download className="h-4 w-4 mr-2" />
                                Download Error Report
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {stats.selectedCount < stats.validRows && (
                            <Button variant="outline" onClick={selectAllValid}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Pilih Semua Valid
                            </Button>
                        )}
                        <Button
                            onClick={handleConfirmClick}
                            disabled={isLoading || stats.selectedCount === 0}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Mengimport...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import {stats.selectedCount} Data
                                </>
                            )}
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5 text-blue-600" />
                            Konfirmasi Import
                        </DialogTitle>
                        <DialogDescription className="pt-4">
                            <div className="space-y-3">
                                <p className="text-base text-slate-700">
                                    Anda akan mengimport <strong>{stats.selectedCount}</strong> data {importType}. Lanjutkan?
                                </p>

                                {stats.skippedCount > 0 && (
                                    <Alert className="bg-yellow-50 border-yellow-200">
                                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                        <AlertDescription className="text-yellow-800">
                                            <strong>{stats.skippedCount}</strong> baris akan di-skip karena:
                                            <ul className="list-disc list-inside mt-1 text-sm">
                                                {stats.errorRows > 0 && <li>{stats.errorRows} baris error</li>}
                                                {stats.validRows - stats.selectedCount > 0 && (
                                                    <li>{stats.validRows - stats.selectedCount} baris tidak dipilih</li>
                                                )}
                                            </ul>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="bg-slate-50 rounded-lg p-3 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <span className="text-slate-500">Total Rows:</span>
                                        <span className="font-medium">{stats.totalRows}</span>
                                        <span className="text-slate-500">Akan di-Import:</span>
                                        <span className="font-medium text-green-600">{stats.selectedCount}</span>
                                        <span className="text-slate-500">Akan di-Skip:</span>
                                        <span className="font-medium text-yellow-600">{stats.skippedCount}</span>
                                    </div>
                                </div>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleImport} className="bg-green-600 hover:bg-green-700">
                            <Upload className="h-4 w-4 mr-2" />
                            Ya, Import Sekarang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
