"use client";

import { useState, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, Loader2, Truck, Search, Package, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface Equipment {
    id: string;
    code: string;
    name: string;
    brand: string;
    model: string;
    type: string;
    status: string;
}

interface HistoryItem {
    id: string;
    date: string;
    sparepart: { code: string; name: string; price: number | null };
    quantity: number;
    employee: { name: string; position: string };
    purpose: string;
    cost: number;
}

interface ReportData {
    equipment: Equipment;
    history: HistoryItem[];
    summary: {
        totalTransactions: number;
        totalQuantity: number;
        totalCost: number;
    };
}

export default function LaporanPerAlatBeratPage() {
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [equipmentSearch, setEquipmentSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    useEffect(() => {
        fetchEquipments();
    }, []);

    useEffect(() => {
        if (selectedEquipment) {
            fetchReport();
        }
    }, [selectedEquipment, dateFrom, dateTo]);

    const fetchEquipments = async () => {
        try {
            const response = await fetch("/api/master/alat-berat?limit=200");
            const result = await response.json();
            if (response.ok) {
                setEquipments(result.data);
            }
        } catch (error) {
            console.error("Error fetching equipments:", error);
        }
    };

    const fetchReport = async () => {
        if (!selectedEquipment) return;

        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                equipmentId: selectedEquipment.id,
                ...(dateFrom && { dateFrom }),
                ...(dateTo && { dateTo }),
            });

            const response = await fetch(`/api/laporan/per-alat-berat?${params}`);
            const result = await response.json();

            if (response.ok && result.data) {
                setReportData(result.data);
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
        if (!reportData) return;

        const data = [
            ["LAPORAN PEMAKAIAN SPAREPART PER UNIT ALAT BERAT"],
            [],
            ["INFO UNIT"],
            ["Kode", reportData.equipment.code],
            ["Nama", reportData.equipment.name],
            ["Merk", reportData.equipment.brand],
            ["Model", reportData.equipment.model],
            ["Tipe", reportData.equipment.type],
            ["Status", reportData.equipment.status],
            [],
            ["RINGKASAN"],
            ["Total Transaksi", reportData.summary.totalTransactions],
            ["Total Qty", reportData.summary.totalQuantity],
            ["Total Biaya", reportData.summary.totalCost],
            [],
            ["DETAIL PEMAKAIAN"],
            ["Tanggal", "Kode Sparepart", "Nama Sparepart", "Qty", "Harga Satuan", "Total", "Pemohon", "Keperluan"],
            ...reportData.history.map(h => [
                new Date(h.date).toLocaleDateString("id-ID"),
                h.sparepart.code,
                h.sparepart.name,
                h.quantity,
                h.sparepart.price || 0,
                h.cost,
                h.employee.name,
                h.purpose,
            ]),
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan");

        XLSX.writeFile(wb, `laporan_${reportData.equipment.code}_${new Date().toISOString().split("T")[0]}.xlsx`);
        toast.success("Laporan berhasil diexport");
    };

    const handleExportPDF = () => {
        window.print();
        toast.success("Gunakan Print to PDF di dialog browser");
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const filteredEquipments = equipments.filter(
        (eq) =>
            eq.name.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
            eq.code.toLowerCase().includes(equipmentSearch.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-green-100 text-green-800">Aktif</Badge>;
            case "maintenance":
                return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
            case "inactive":
                return <Badge variant="secondary">Tidak Aktif</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 print:space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between print:hidden">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Laporan Per Alat Berat</h1>
                    <p className="text-slate-600 mt-1">Laporan pemakaian sparepart per unit alat berat</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportExcel} disabled={!reportData}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Excel
                    </Button>
                    <Button variant="outline" onClick={handleExportPDF} disabled={!reportData}>
                        <FileText className="mr-2 h-4 w-4" />
                        PDF
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="print:hidden">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4 items-end">
                        {/* Equipment Search */}
                        <div className="flex-1 min-w-64">
                            <label className="text-sm text-slate-600 block mb-2">Unit Alat Berat *</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Cari kode atau nama unit..."
                                    value={equipmentSearch}
                                    onChange={(e) => {
                                        setEquipmentSearch(e.target.value);
                                        setShowDropdown(true);
                                    }}
                                    onFocus={() => setShowDropdown(true)}
                                    className="pl-9"
                                />
                                {showDropdown && equipmentSearch && (
                                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto">
                                        {filteredEquipments.slice(0, 10).map((eq) => (
                                            <button
                                                key={eq.id}
                                                type="button"
                                                className="w-full px-4 py-2 text-left hover:bg-slate-100 flex items-center gap-3"
                                                onClick={() => {
                                                    setSelectedEquipment(eq);
                                                    setEquipmentSearch(`${eq.code} - ${eq.name}`);
                                                    setShowDropdown(false);
                                                }}
                                            >
                                                <Truck className="h-4 w-4 text-slate-400" />
                                                <div>
                                                    <p className="font-medium">{eq.name}</p>
                                                    <p className="text-sm text-slate-500">{eq.code} • {eq.brand} {eq.model}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Dari:</span>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Sampai:</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-40"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            ) : !selectedEquipment ? (
                <Card>
                    <CardContent className="py-12 text-center text-slate-500">
                        <Truck className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p>Pilih unit alat berat untuk melihat laporan</p>
                    </CardContent>
                </Card>
            ) : reportData && (
                <>
                    {/* Print Header */}
                    <div className="hidden print:block text-center mb-6">
                        <h1 className="text-2xl font-bold">LAPORAN PEMAKAIAN SPAREPART</h1>
                        <p className="text-lg">{reportData.equipment.name}</p>
                    </div>

                    {/* Equipment Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5" />
                                Informasi Unit
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                <div>
                                    <p className="text-sm text-slate-500">Kode</p>
                                    <p className="font-semibold font-mono">{reportData.equipment.code}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Nama</p>
                                    <p className="font-semibold">{reportData.equipment.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Merk</p>
                                    <p className="font-semibold">{reportData.equipment.brand}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Model</p>
                                    <p className="font-semibold">{reportData.equipment.model}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Tipe</p>
                                    <p className="font-semibold">{reportData.equipment.type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Status</p>
                                    {getStatusBadge(reportData.equipment.status)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg print:hidden">
                                        <Calendar className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Total Transaksi</p>
                                        <p className="text-2xl font-bold">{reportData.summary.totalTransactions}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg print:hidden">
                                        <Package className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Total Qty</p>
                                        <p className="text-2xl font-bold">{reportData.summary.totalQuantity}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg print:hidden">
                                        <User className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Total Biaya</p>
                                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(reportData.summary.totalCost)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* History Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Riwayat Pemakaian</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Sparepart</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Biaya</TableHead>
                                            <TableHead>Pemohon</TableHead>
                                            <TableHead>Keperluan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reportData.history.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                                    Tidak ada riwayat pemakaian
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            reportData.history.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{formatDate(item.date)}</TableCell>
                                                    <TableCell>
                                                        <p className="font-medium">{item.sparepart.name}</p>
                                                        <p className="text-xs text-slate-500">{item.sparepart.code}</p>
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(item.cost)}</TableCell>
                                                    <TableCell>
                                                        <p>{item.employee.name}</p>
                                                        <p className="text-xs text-slate-500">{item.employee.position}</p>
                                                    </TableCell>
                                                    <TableCell className="max-w-32 truncate">{item.purpose}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
