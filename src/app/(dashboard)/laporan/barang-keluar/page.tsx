"use client";

import { useState, useEffect } from "react";
import { FileSpreadsheet, Loader2, PackageMinus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

interface StockOutItem {
    id: string;
    date: string;
    sparepartCode: string;
    sparepartName: string;
    unit: string;
    quantity: number;
    equipmentCode: string;
    equipmentName: string;
    employeeName: string;
    employeePosition: string;
    purpose: string;
    status: string;
    approvedAt: string | null;
}

interface Summary {
    totalTransactions: number;
    totalQuantity: number;
    pending: number;
    approved: number;
    rejected: number;
}

const STATUS_OPTIONS = [
    { value: "all", label: "Semua Status" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
];

export default function LaporanBarangKeluarPage() {
    const [data, setData] = useState<StockOutItem[]>([]);
    const [summary, setSummary] = useState<Summary>({ totalTransactions: 0, totalQuantity: 0, pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(false);

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
    const lastDay = today.toISOString().split("T")[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.set("startDate", startDate);
            if (endDate) params.set("endDate", endDate);
            if (statusFilter !== "all") params.set("status", statusFilter);

            const response = await fetch(`/api/reports/stock-out?${params}`);
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
            "Alat Berat": item.equipmentName,
            "Karyawan": item.employeeName,
            "Keperluan": item.purpose,
            "Status": item.status,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Barang Keluar");
        XLSX.writeFile(wb, `Laporan_Barang_Keluar_${startDate}_${endDate}.xlsx`);
        toast.success("Export berhasil!");
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
            case "rejected":
                return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
            default:
                return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                    <PackageMinus className="h-6 w-6 text-red-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Laporan Barang Keluar</h1>
                    <p className="text-slate-600 mt-1">History transaksi barang keluar dari gudang</p>
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
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
            <div className="grid grid-cols-4 gap-4">
                <Card className="bg-blue-50">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-blue-700">{summary.totalTransactions}</p>
                        <p className="text-sm text-blue-600">Total Transaksi</p>
                    </CardContent>
                </Card>
                <Card className="bg-yellow-50">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-yellow-700">{summary.pending}</p>
                        <p className="text-sm text-yellow-600">Pending</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-green-700">{summary.approved}</p>
                        <p className="text-sm text-green-600">Approved</p>
                    </CardContent>
                </Card>
                <Card className="bg-red-50">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-red-700">{summary.rejected}</p>
                        <p className="text-sm text-red-600">Rejected</p>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detail Barang Keluar</CardTitle>
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
                                <TableHead>Alat Berat</TableHead>
                                <TableHead>Karyawan</TableHead>
                                <TableHead>Keperluan</TableHead>
                                <TableHead className="text-center">Status</TableHead>
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
                                        <TableCell>{item.equipmentName}</TableCell>
                                        <TableCell>{item.employeeName}</TableCell>
                                        <TableCell className="max-w-[150px] truncate">{item.purpose}</TableCell>
                                        <TableCell className="text-center">{getStatusBadge(item.status)}</TableCell>
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
