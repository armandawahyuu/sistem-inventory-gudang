"use client";

import { useState, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, Loader2, Package, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { formatCurrency } from "@/lib/validations/petty-cash";

interface Category {
    id: string;
    name: string;
}

interface Sparepart {
    id: string;
    code: string;
    name: string;
    unit: string;
    currentStock: number;
    minStock: number;
    price: number | null;
    status: string;
    value: number;
    category: Category;
}

interface Summary {
    totalItems: number;
    totalNormal: number;
    totalLow: number;
    totalEmpty: number;
    totalValue: number;
}

const STOCK_STATUS_OPTIONS = [
    { value: "all", label: "Semua Status" },
    { value: "normal", label: "Normal" },
    { value: "low", label: "Menipis" },
    { value: "empty", label: "Habis" },
];

export default function LaporanStokPage() {
    const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [categoryId, setCategoryId] = useState("");
    const [stockStatus, setStockStatus] = useState("all");

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchReport();
    }, [categoryId, stockStatus]);

    const fetchCategories = async () => {
        try {
            const response = await fetch("/api/master/kategori?limit=100");
            const result = await response.json();
            if (response.ok) {
                setCategories(result.data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchReport = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                ...(categoryId && { categoryId }),
                stockStatus,
            });

            const response = await fetch(`/api/laporan/stok?${params}`);
            const result = await response.json();

            if (response.ok) {
                setSpareparts(result.data);
                setSummary(result.summary);
            } else {
                toast.error(result.error || "Gagal memuat laporan");
            }
        } catch (error) {
            console.error("Error fetching report:", error);
            toast.error("Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (spareparts.length === 0) {
            toast.error("Tidak ada data untuk diexport");
            return;
        }

        const data = [
            ["LAPORAN STOK SPAREPART"],
            [`Tanggal: ${new Date().toLocaleDateString("id-ID")}`],
            [],
            ["RINGKASAN"],
            ["Total Item", summary?.totalItems],
            ["Normal", summary?.totalNormal],
            ["Menipis", summary?.totalLow],
            ["Habis", summary?.totalEmpty],
            ["Total Nilai", summary?.totalValue],
            [],
            ["DETAIL STOK"],
            ["Kode", "Nama", "Kategori", "Satuan", "Stok", "Min. Stok", "Status", "Harga", "Nilai"],
            ...spareparts.map(sp => [
                sp.code,
                sp.name,
                sp.category?.name || "-",
                sp.unit,
                sp.currentStock,
                sp.minStock,
                sp.status === "normal" ? "Normal" : sp.status === "low" ? "Menipis" : "Habis",
                sp.price || 0,
                sp.value,
            ]),
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Stok");

        XLSX.writeFile(wb, `laporan_stok_${new Date().toISOString().split("T")[0]}.xlsx`);
        toast.success("Laporan berhasil diexport");
    };

    const handleExportPDF = () => {
        window.print();
        toast.success("Gunakan Print to PDF di dialog browser");
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "normal":
                return <Badge className="bg-green-100 text-green-800">Normal</Badge>;
            case "low":
                return <Badge className="bg-yellow-100 text-yellow-800">Menipis</Badge>;
            case "empty":
                return <Badge variant="destructive">Habis</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 print:space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between print:hidden">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Laporan Stok</h1>
                    <p className="text-slate-600 mt-1">Laporan stok sparepart gudang</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportExcel} disabled={spareparts.length === 0}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Excel
                    </Button>
                    <Button variant="outline" onClick={handleExportPDF} disabled={spareparts.length === 0}>
                        <FileText className="mr-2 h-4 w-4" />
                        PDF
                    </Button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block text-center mb-6">
                <h1 className="text-2xl font-bold">LAPORAN STOK SPAREPART</h1>
                <p className="text-slate-600">Tanggal: {new Date().toLocaleDateString("id-ID")}</p>
            </div>

            {/* Filters */}
            <Card className="print:hidden">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Kategori:</span>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Semua Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Status Stok:</span>
                            <Select value={stockStatus} onValueChange={setStockStatus}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STOCK_STATUS_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg print:hidden">
                                    <Package className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Total Item</p>
                                    <p className="text-2xl font-bold">{summary.totalItems}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg print:hidden">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-green-600">Normal</p>
                                    <p className="text-2xl font-bold text-green-600">{summary.totalNormal}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 rounded-lg print:hidden">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-yellow-600">Menipis</p>
                                    <p className="text-2xl font-bold text-yellow-600">{summary.totalLow}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg print:hidden">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-red-600">Habis</p>
                                    <p className="text-2xl font-bold text-red-600">{summary.totalEmpty}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detail Stok</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kode</TableHead>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Satuan</TableHead>
                                        <TableHead className="text-right">Stok</TableHead>
                                        <TableHead className="text-right">Min. Stok</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Nilai</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {spareparts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                                                Tidak ada data
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        spareparts.map((sp) => (
                                            <TableRow key={sp.id} className={sp.status === "empty" ? "bg-red-50" : sp.status === "low" ? "bg-yellow-50" : ""}>
                                                <TableCell className="font-mono text-sm">{sp.code}</TableCell>
                                                <TableCell className="font-medium">{sp.name}</TableCell>
                                                <TableCell>{sp.category?.name || "-"}</TableCell>
                                                <TableCell>{sp.unit}</TableCell>
                                                <TableCell className="text-right font-semibold">{sp.currentStock}</TableCell>
                                                <TableCell className="text-right">{sp.minStock}</TableCell>
                                                <TableCell>{getStatusBadge(sp.status)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(sp.value)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Total Value */}
                    {summary && summary.totalValue > 0 && (
                        <div className="mt-4 text-right">
                            <span className="text-slate-600">Total Nilai Stok: </span>
                            <span className="font-bold text-lg">{formatCurrency(summary.totalValue)}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
