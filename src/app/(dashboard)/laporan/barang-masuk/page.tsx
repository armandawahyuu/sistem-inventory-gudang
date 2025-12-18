"use client";

import { useState, useEffect } from "react";
import { Download, FileSpreadsheet, Loader2, Package, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { formatCurrency } from "@/lib/validations/petty-cash";

interface StockInItem {
    id: string;
    date: string;
    sparepartCode: string;
    sparepartName: string;
    unit: string;
    quantity: number;
    supplierName: string;
    invoiceNumber: string;
    purchasePrice: number;
    totalPrice: number;
    notes: string;
}

interface Summary {
    totalTransactions: number;
    totalQuantity: number;
    totalValue: number;
}

export default function LaporanBarangMasukPage() {
    const [data, setData] = useState<StockInItem[]>([]);
    const [summary, setSummary] = useState<Summary>({ totalTransactions: 0, totalQuantity: 0, totalValue: 0 });
    const [loading, setLoading] = useState(false);

    // Default: current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
    const lastDay = today.toISOString().split("T")[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.set("startDate", startDate);
            if (endDate) params.set("endDate", endDate);

            const response = await fetch(`/api/reports/stock-in?${params}`);
            const result = await response.json();

            if (response.ok) {
                setData(result.data);
                setSummary(result.summary);
            } else {
                toast.error(result.error || "Gagal mengambil data");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const handleExportExcel = () => {
        if (data.length === 0) {
            toast.error("Tidak ada data untuk di-export");
            return;
        }

        const exportData = data.map((item, idx) => ({
            "No": idx + 1,
            "Tanggal": formatDate(item.date),
            "Kode": item.sparepartCode,
            "Nama Sparepart": item.sparepartName,
            "Qty": item.quantity,
            "Satuan": item.unit,
            "Supplier": item.supplierName,
            "No Invoice": item.invoiceNumber,
            "Harga Satuan": item.purchasePrice,
            "Total Harga": item.totalPrice,
            "Keterangan": item.notes,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Barang Masuk");
        XLSX.writeFile(wb, `Laporan_Barang_Masuk_${startDate}_${endDate}.xlsx`);
        toast.success("Export berhasil!");
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <Package className="h-6 w-6 text-green-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Laporan Barang Masuk</h1>
                    <p className="text-slate-600 mt-1">History transaksi barang masuk ke gudang</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-2">
                            <Label>Dari Tanggal</Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-44" />
                        </div>
                        <div className="space-y-2">
                            <Label>Sampai Tanggal</Label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-44" />
                        </div>
                        <Button onClick={fetchReport} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
                            Tampilkan
                        </Button>
                        <Button variant="outline" onClick={handleExportExcel} disabled={data.length === 0}>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Export Excel
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="bg-blue-50">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-blue-700">{summary.totalTransactions}</p>
                        <p className="text-sm text-blue-600">Total Transaksi</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-green-700">{summary.totalQuantity}</p>
                        <p className="text-sm text-green-600">Total Qty Masuk</p>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-purple-700">{formatCurrency(summary.totalValue)}</p>
                        <p className="text-sm text-purple-600">Total Nilai</p>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detail Barang Masuk</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">No</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Kode</TableHead>
                                <TableHead>Nama Sparepart</TableHead>
                                <TableHead className="text-center">Qty</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Invoice</TableHead>
                                <TableHead className="text-right">Harga</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                        Tidak ada data pada periode ini
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((item, idx) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{idx + 1}</TableCell>
                                        <TableCell className="whitespace-nowrap">{formatDate(item.date)}</TableCell>
                                        <TableCell className="font-mono text-sm">{item.sparepartCode}</TableCell>
                                        <TableCell>{item.sparepartName}</TableCell>
                                        <TableCell className="text-center font-medium">{item.quantity} {item.unit}</TableCell>
                                        <TableCell>{item.supplierName}</TableCell>
                                        <TableCell>{item.invoiceNumber}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.purchasePrice)}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
