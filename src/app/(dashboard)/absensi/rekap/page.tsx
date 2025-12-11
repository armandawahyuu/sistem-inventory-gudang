"use client";

import { useState, useEffect } from "react";
import { Loader2, Download, ChevronDown, ChevronRight } from "lucide-react";
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
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface RecapItem {
    id: string;
    nik: string;
    name: string;
    position: string;
    present: number;
    absent: number;
    late: number;
    leave: number;
    sick: number;
    totalOvertime: number;
    totalDays: number;
}

interface Summary {
    totalEmployees: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalLeave: number;
    totalSick: number;
    totalOvertime: number;
}

interface ChartDataItem {
    day: number;
    tanggal: string;
    hadir: number;
    tidak_hadir: number;
    terlambat: number;
}

interface Employee {
    id: string;
    nik: string;
    name: string;
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

export default function RekapAbsensiPage() {
    const [recap, setRecap] = useState<RecapItem[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [chartData, setChartData] = useState<ChartDataItem[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const currentDate = new Date();
    const [month, setMonth] = useState(String(currentDate.getMonth() + 1));
    const [year, setYear] = useState(String(currentDate.getFullYear()));
    const [employeeFilter, setEmployeeFilter] = useState("all");

    const years = Array.from({ length: 5 }, (_, i) => String(currentDate.getFullYear() - i));

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        fetchRecap();
    }, [month, year, employeeFilter]);

    const fetchEmployees = async () => {
        try {
            const response = await fetch("/api/master/karyawan?limit=200&status=active");
            const result = await response.json();
            if (response.ok) {
                setEmployees(result.data);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    const fetchRecap = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                month,
                year,
                ...(employeeFilter && { employeeId: employeeFilter }),
            });

            const response = await fetch(`/api/absensi/rekap?${params}`);
            const result = await response.json();

            if (response.ok) {
                setRecap(result.data.recap);
                setSummary(result.data.summary);
                setChartData(result.data.chartData);
            } else {
                toast.error(result.error || "Gagal memuat data");
            }
        } catch (error) {
            console.error("Error fetching recap:", error);
            toast.error("Terjadi kesalahan saat memuat data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (recap.length === 0) {
            toast.error("Tidak ada data untuk diexport");
            return;
        }

        const exportData = recap.map((item, index) => ({
            No: index + 1,
            NIK: item.nik,
            Nama: item.name,
            Jabatan: item.position,
            Hadir: item.present,
            "Tidak Hadir": item.absent,
            Terlambat: item.late,
            Izin: item.leave,
            Sakit: item.sick,
            "Total Lembur (jam)": item.totalOvertime,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rekap Absensi");

        // Set column widths
        ws["!cols"] = [
            { wch: 5 },
            { wch: 15 },
            { wch: 25 },
            { wch: 20 },
            { wch: 10 },
            { wch: 12 },
            { wch: 12 },
            { wch: 10 },
            { wch: 10 },
            { wch: 18 },
        ];

        const monthName = MONTHS.find((m) => m.value === month)?.label;
        XLSX.writeFile(wb, `rekap_absensi_${monthName}_${year}.xlsx`);
        toast.success("Data berhasil diexport");
    };

    const getMonthName = () => {
        return MONTHS.find((m) => m.value === month)?.label || "";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Rekap Kehadiran</h1>
                    <p className="text-slate-600 mt-1">Rekap absensi karyawan bulanan</p>
                </div>
                <Button onClick={handleExportExcel} disabled={isLoading || recap.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Bulan:</span>
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger className="w-36">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map((m) => (
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
                                    {years.map((y) => (
                                        <SelectItem key={y} value={y}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Karyawan:</span>
                            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Semua Karyawan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Karyawan</SelectItem>
                                    {employees.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                            {emp.name}
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
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <Card>
                        <CardContent className="pt-4 pb-4">
                            <p className="text-sm text-slate-500">Total Karyawan</p>
                            <p className="text-2xl font-bold">{summary.totalEmployees}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-4">
                            <p className="text-sm text-green-600">Hadir</p>
                            <p className="text-2xl font-bold text-green-600">{summary.totalPresent}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-4">
                            <p className="text-sm text-red-600">Tidak Hadir</p>
                            <p className="text-2xl font-bold text-red-600">{summary.totalAbsent}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-4">
                            <p className="text-sm text-yellow-600">Terlambat</p>
                            <p className="text-2xl font-bold text-yellow-600">{summary.totalLate}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-4">
                            <p className="text-sm text-blue-600">Izin</p>
                            <p className="text-2xl font-bold text-blue-600">{summary.totalLeave}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-4">
                            <p className="text-sm text-purple-600">Sakit</p>
                            <p className="text-2xl font-bold text-purple-600">{summary.totalSick}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-4">
                            <p className="text-sm text-orange-600">Total Lembur</p>
                            <p className="text-2xl font-bold text-orange-600">{summary.totalOvertime} jam</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Grafik Kehadiran {getMonthName()} {year}</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="tanggal" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="hadir" name="Hadir" fill="#22c55e" />
                                <Bar dataKey="tidak_hadir" name="Tidak Hadir" fill="#ef4444" />
                                <Bar dataKey="terlambat" name="Terlambat" fill="#eab308" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detail Rekap per Karyawan</CardTitle>
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
                                        <TableHead className="w-12">No</TableHead>
                                        <TableHead>NIK</TableHead>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Jabatan</TableHead>
                                        <TableHead className="text-center text-green-600">Hadir</TableHead>
                                        <TableHead className="text-center text-red-600">Tidak Hadir</TableHead>
                                        <TableHead className="text-center text-yellow-600">Terlambat</TableHead>
                                        <TableHead className="text-center text-blue-600">Izin</TableHead>
                                        <TableHead className="text-center text-purple-600">Sakit</TableHead>
                                        <TableHead className="text-center text-orange-600">Lembur (jam)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recap.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="h-32 text-center text-slate-500">
                                                Tidak ada data untuk periode ini
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recap.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell className="font-mono">{item.nik}</TableCell>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell className="text-slate-600">{item.position}</TableCell>
                                                <TableCell className="text-center font-semibold text-green-600">{item.present}</TableCell>
                                                <TableCell className="text-center font-semibold text-red-600">{item.absent}</TableCell>
                                                <TableCell className="text-center font-semibold text-yellow-600">{item.late}</TableCell>
                                                <TableCell className="text-center font-semibold text-blue-600">{item.leave}</TableCell>
                                                <TableCell className="text-center font-semibold text-purple-600">{item.sick}</TableCell>
                                                <TableCell className="text-center font-semibold text-orange-600">{item.totalOvertime}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
