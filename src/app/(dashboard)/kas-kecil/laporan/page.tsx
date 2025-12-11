"use client";

import { useState, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, Loader2, TrendingUp, TrendingDown, Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { formatCurrency } from "@/lib/validations/petty-cash";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from "recharts";

interface Transaction {
    id: string;
    date: string;
    type: string;
    amount: number;
    description: string;
    category: { name: string } | null;
    runningBalance: number;
}

interface ReportData {
    openingBalance: number;
    totalIncome: number;
    totalExpense: number;
    closingBalance: number;
    transactions: Transaction[];
    expenseChart: { name: string; value: number }[];
    period: { from: string; to: string };
}

const MONTHS = [
    { value: "1", label: "Januari" },
    { value: "2", label: "Februari" },
    { value: "3", label: "Maret" },
    { value: "4", label: "April" },
    { value: "5", label: "Mei" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "Agustus" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export default function LaporanKasKecilPage() {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filterMode, setFilterMode] = useState<"month" | "range">("month");

    const currentDate = new Date();
    const [month, setMonth] = useState(String(currentDate.getMonth() + 1));
    const [year, setYear] = useState(String(currentDate.getFullYear()));
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const years = Array.from({ length: 5 }, (_, i) => String(currentDate.getFullYear() - i));

    useEffect(() => {
        fetchReport();
    }, [month, year]);

    const fetchReport = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterMode === "month") {
                params.set("month", month);
                params.set("year", year);
            } else if (dateFrom && dateTo) {
                params.set("dateFrom", dateFrom);
                params.set("dateTo", dateTo);
            }

            const response = await fetch(`/api/kas-kecil/laporan?${params}`);
            const result = await response.json();

            if (response.ok) {
                setReportData(result.data);
            } else {
                toast.error(result.error || "Gagal memuat laporan");
            }
        } catch (error) {
            console.error("Error fetching report:", error);
            toast.error("Terjadi kesalahan saat memuat laporan");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilter = () => {
        fetchReport();
    };

    const handleExportExcel = () => {
        if (!reportData) return;

        const data = [
            ["LAPORAN KAS KECIL"],
            [`Periode: ${formatDate(reportData.period.from)} - ${formatDate(reportData.period.to)}`],
            [],
            ["RINGKASAN"],
            ["Saldo Awal", reportData.openingBalance],
            ["Total Pemasukan", reportData.totalIncome],
            ["Total Pengeluaran", reportData.totalExpense],
            ["Saldo Akhir", reportData.closingBalance],
            [],
            ["DETAIL TRANSAKSI"],
            ["Tanggal", "Keterangan", "Kategori", "Masuk", "Keluar", "Saldo"],
            ...reportData.transactions.map(tx => [
                formatDate(tx.date),
                tx.description,
                tx.category?.name || "-",
                tx.type === "in" ? tx.amount : "",
                tx.type === "out" ? tx.amount : "",
                tx.runningBalance,
            ]),
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Kas Kecil");

        const monthName = MONTHS.find(m => m.value === month)?.label;
        XLSX.writeFile(wb, `laporan_kas_kecil_${monthName}_${year}.xlsx`);
        toast.success("Laporan berhasil diexport ke Excel");
    };

    const handleExportPDF = () => {
        // Use browser print for PDF export
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

    const getMonthName = () => {
        return MONTHS.find(m => m.value === month)?.label || "";
    };

    return (
        <div className="space-y-6 print:space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between print:hidden">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Laporan Kas Kecil</h1>
                    <p className="text-slate-600 mt-1">Laporan transaksi kas kecil</p>
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

            {/* Print Header */}
            <div className="hidden print:block text-center mb-6">
                <h1 className="text-2xl font-bold">LAPORAN KAS KECIL</h1>
                <p className="text-slate-600">
                    Periode: {reportData ? `${formatDate(reportData.period.from)} - ${formatDate(reportData.period.to)}` : ""}
                </p>
            </div>

            {/* Filters */}
            <Card className="print:hidden">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4 items-end">
                        <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as "month" | "range")}>
                            <TabsList>
                                <TabsTrigger value="month">Bulan</TabsTrigger>
                                <TabsTrigger value="range">Range Tanggal</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {filterMode === "month" ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-600">Bulan:</span>
                                    <Select value={month} onValueChange={setMonth}>
                                        <SelectTrigger className="w-36">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MONTHS.map(m => (
                                                <SelectItem key={m.value} value={m.value}>
                                                    {m.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-600">Tahun:</span>
                                    <Select value={year} onValueChange={setYear}>
                                        <SelectTrigger className="w-24">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map(y => (
                                                <SelectItem key={y} value={y}>
                                                    {y}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        ) : (
                            <>
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
                                <Button onClick={handleFilter}>Filter</Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            ) : reportData && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg print:hidden">
                                        <Wallet className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Saldo Awal</p>
                                        <p className="text-xl font-bold">{formatCurrency(reportData.openingBalance)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg print:hidden">
                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-green-600">Total Pemasukan</p>
                                        <p className="text-xl font-bold text-green-600">{formatCurrency(reportData.totalIncome)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg print:hidden">
                                        <TrendingDown className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-red-600">Total Pengeluaran</p>
                                        <p className="text-xl font-bold text-red-600">{formatCurrency(reportData.totalExpense)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg print:hidden">
                                        <ArrowRight className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-blue-600">Saldo Akhir</p>
                                        <p className="text-xl font-bold text-blue-600">{formatCurrency(reportData.closingBalance)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart and Table Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-1">
                        {/* Pie Chart */}
                        <Card className="print:hidden">
                            <CardHeader>
                                <CardTitle>Pengeluaran per Kategori</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {reportData.expenseChart.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={reportData.expenseChart}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                            >
                                                {reportData.expenseChart.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-64 flex items-center justify-center text-slate-500">
                                        Tidak ada data pengeluaran
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Table */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Detail Transaksi</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border max-h-[400px] overflow-auto print:max-h-none">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tanggal</TableHead>
                                                <TableHead>Keterangan</TableHead>
                                                <TableHead>Kategori</TableHead>
                                                <TableHead className="text-right text-green-600">Masuk</TableHead>
                                                <TableHead className="text-right text-red-600">Keluar</TableHead>
                                                <TableHead className="text-right">Saldo</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reportData.transactions.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                                        Tidak ada transaksi pada periode ini
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                reportData.transactions.map((tx) => (
                                                    <TableRow key={tx.id}>
                                                        <TableCell className="text-sm">{formatDate(tx.date)}</TableCell>
                                                        <TableCell className="max-w-48 truncate">{tx.description}</TableCell>
                                                        <TableCell className="text-sm">{tx.category?.name || "-"}</TableCell>
                                                        <TableCell className="text-right font-medium text-green-600">
                                                            {tx.type === "in" ? formatCurrency(tx.amount) : ""}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-red-600">
                                                            {tx.type === "out" ? formatCurrency(tx.amount) : ""}
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold">
                                                            {formatCurrency(tx.runningBalance)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
