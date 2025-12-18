"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Eye, FileSpreadsheet, RefreshCw, AlertCircle, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import Link from "next/link";

interface ImportLog {
    id: string;
    type: string;
    filename: string | null;
    totalRows: number;
    successRows: number;
    failedRows: number;
    skippedRows: number;
    errors: RowError[] | null;
    createdAt: string;
    createdBy: string | null;
}

interface RowError {
    row: number;
    data: Record<string, unknown>;
    errors: string[];
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const TYPE_OPTIONS = [
    { value: "all", label: "Semua Tipe" },
    { value: "kategori", label: "Kategori" },
    { value: "supplier", label: "Supplier" },
    { value: "alat-berat", label: "Alat Berat" },
    { value: "sparepart", label: "Sparepart" },
    { value: "karyawan", label: "Karyawan" },
    { value: "stok-awal", label: "Stok Awal" },
];

const TYPE_COLORS: Record<string, string> = {
    kategori: "bg-blue-100 text-blue-800",
    supplier: "bg-green-100 text-green-800",
    "alat-berat": "bg-orange-100 text-orange-800",
    sparepart: "bg-purple-100 text-purple-800",
    karyawan: "bg-cyan-100 text-cyan-800",
    "stok-awal": "bg-pink-100 text-pink-800",
};

export default function ImportHistoryPage() {
    const [logs, setLogs] = useState<ImportLog[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<ImportLog | null>(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);

    // Filters
    const [filterType, setFilterType] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [page, setPage] = useState(1);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterType !== "all") params.set("type", filterType);
            if (startDate) params.set("startDate", startDate);
            if (endDate) params.set("endDate", endDate);
            params.set("page", page.toString());
            params.set("limit", "15");

            const response = await fetch(`/api/import-logs?${params}`);
            const data = await response.json();

            if (response.ok) {
                setLogs(data.data);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    }, [filterType, startDate, endDate, page]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleViewDetail = (log: ImportLog) => {
        setSelectedLog(log);
        setShowDetailDialog(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getTypeBadge = (type: string) => {
        const colorClass = TYPE_COLORS[type] || "bg-gray-100 text-gray-800";
        const label = TYPE_OPTIONS.find((t) => t.value === type)?.label || type;
        return <Badge className={colorClass}>{label}</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/settings/import">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">History Import</h1>
                    <p className="text-muted-foreground">Riwayat proses import data dari file Excel</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Filter</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="w-48">
                            <Select value={filterType} onValueChange={(val) => { setFilterType(val); setPage(1); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tipe Import" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TYPE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                className="w-40"
                            />
                            <span className="text-muted-foreground">s/d</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                className="w-40"
                            />
                        </div>
                        <Button variant="outline" onClick={fetchLogs} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Log Import
                    </CardTitle>
                    <CardDescription>
                        {pagination ? `Total ${pagination.total} record` : "Memuat data..."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Tipe</TableHead>
                                <TableHead>File</TableHead>
                                <TableHead className="text-center">Total</TableHead>
                                <TableHead className="text-center">
                                    <span className="flex items-center justify-center gap-1">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" /> Sukses
                                    </span>
                                </TableHead>
                                <TableHead className="text-center">
                                    <span className="flex items-center justify-center gap-1">
                                        <XCircle className="h-4 w-4 text-red-600" /> Gagal
                                    </span>
                                </TableHead>
                                <TableHead className="text-center">
                                    <span className="flex items-center justify-center gap-1">
                                        <MinusCircle className="h-4 w-4 text-yellow-600" /> Skip
                                    </span>
                                </TableHead>
                                <TableHead className="text-center">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        Memuat data...
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        Tidak ada data import
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="whitespace-nowrap">{formatDate(log.createdAt)}</TableCell>
                                        <TableCell>{getTypeBadge(log.type)}</TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={log.filename || "-"}>
                                            {log.filename || "-"}
                                        </TableCell>
                                        <TableCell className="text-center font-medium">{log.totalRows}</TableCell>
                                        <TableCell className="text-center text-green-600 font-medium">{log.successRows}</TableCell>
                                        <TableCell className="text-center text-red-600 font-medium">{log.failedRows}</TableCell>
                                        <TableCell className="text-center text-yellow-600 font-medium">{log.skippedRows}</TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewDetail(log)}
                                                disabled={!log.errors || (log.errors as RowError[]).length === 0}
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                Detail
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                Halaman {pagination.page} dari {pagination.totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(page - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= pagination.totalPages}
                                    onClick={() => setPage(page + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            Detail Error Import
                        </DialogTitle>
                        <DialogDescription>
                            {selectedLog && (
                                <>
                                    {getTypeBadge(selectedLog.type)} - {selectedLog.filename || "No filename"}
                                    <br />
                                    <span className="text-xs">{formatDate(selectedLog.createdAt)}</span>
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[50vh]">
                        <div className="space-y-3">
                            {selectedLog?.errors && (selectedLog.errors as RowError[]).map((err, idx) => (
                                <div key={idx} className="border rounded-lg p-3 bg-red-50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="destructive">Baris {err.row}</Badge>
                                    </div>
                                    <div className="text-sm mb-2">
                                        <span className="font-medium">Data:</span>
                                        <pre className="text-xs bg-white rounded p-2 mt-1 overflow-x-auto">
                                            {JSON.stringify(err.data, null, 2)}
                                        </pre>
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-medium text-red-700">Error:</span>
                                        <ul className="list-disc list-inside text-red-600 text-xs mt-1">
                                            {err.errors.map((e, i) => (
                                                <li key={i}>{e}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                            {(!selectedLog?.errors || (selectedLog.errors as RowError[]).length === 0) && (
                                <p className="text-center text-muted-foreground py-4">Tidak ada error</p>
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
