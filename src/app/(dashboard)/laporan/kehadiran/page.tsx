"use client";

import { useState, useEffect } from "react";
import { FileSpreadsheet, Loader2, Users, Calendar, CheckCircle, XCircle, Clock, Palmtree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface AttendanceItem {
    id: string;
    date: string;
    employeeNik: string;
    employeeName: string;
    position: string;
    department: string;
    status: string;
    checkIn: string | null;
    checkOut: string | null;
    notes: string;
}

interface EmployeeSummary {
    employee: { id: string; nik: string; name: string; position: string; department: string | null };
    present: number;
    absent: number;
    late: number;
    leave: number;
    total: number;
}

interface Summary {
    totalRecords: number;
    totalEmployees: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalLeave: number;
}

interface Employee {
    id: string;
    name: string;
}

export default function LaporanKehadiranPage() {
    const [data, setData] = useState<AttendanceItem[]>([]);
    const [employeeSummary, setEmployeeSummary] = useState<EmployeeSummary[]>([]);
    const [summary, setSummary] = useState<Summary>({ totalRecords: 0, totalEmployees: 0, totalPresent: 0, totalAbsent: 0, totalLate: 0, totalLeave: 0 });
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
    const lastDay = today.toISOString().split("T")[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);
    const [employeeFilter, setEmployeeFilter] = useState("all");

    // Fetch employees for filter
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await fetch("/api/employees");
                const result = await response.json();
                if (response.ok) {
                    setEmployees(result.data || result);
                }
            } catch (error) {
                console.error("Error fetching employees:", error);
            }
        };
        fetchEmployees();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.set("startDate", startDate);
            if (endDate) params.set("endDate", endDate);
            if (employeeFilter !== "all") params.set("employeeId", employeeFilter);

            const response = await fetch(`/api/reports/attendance?${params}`);
            const result = await response.json();

            if (response.ok) {
                setData(result.data);
                setSummary(result.summary);
                setEmployeeSummary(result.employeeSummary);
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

        // Export detail data
        const detailData = data.map((item, idx) => ({
            "No": idx + 1,
            "Tanggal": formatDate(item.date),
            "NIK": item.employeeNik,
            "Nama": item.employeeName,
            "Jabatan": item.position,
            "Status": getStatusLabel(item.status),
            "Jam Masuk": item.checkIn || "-",
            "Jam Keluar": item.checkOut || "-",
            "Keterangan": item.notes,
        }));

        // Export summary data
        const summaryData = employeeSummary.map((es, idx) => ({
            "No": idx + 1,
            "NIK": es.employee.nik,
            "Nama": es.employee.name,
            "Jabatan": es.employee.position,
            "Hadir": es.present,
            "Tidak Hadir": es.absent,
            "Terlambat": es.late,
            "Izin/Cuti": es.leave,
            "Total": es.total,
        }));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailData), "Detail");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Rekap");
        XLSX.writeFile(wb, `Laporan_Kehadiran_${startDate}_${endDate}.xlsx`);
        toast.success("Export berhasil!");
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "hadir": return "Hadir";
            case "tidak_hadir": return "Tidak Hadir";
            case "terlambat": return "Terlambat";
            case "izin": return "Izin";
            case "sakit": return "Sakit";
            case "cuti": return "Cuti";
            default: return status;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "hadir":
                return <Badge className="bg-green-100 text-green-700">Hadir</Badge>;
            case "tidak_hadir":
                return <Badge className="bg-red-100 text-red-700">Tidak Hadir</Badge>;
            case "terlambat":
                return <Badge className="bg-yellow-100 text-yellow-700">Terlambat</Badge>;
            case "izin":
            case "sakit":
            case "cuti":
                return <Badge className="bg-blue-100 text-blue-700">{getStatusLabel(status)}</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                    <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Laporan Kehadiran</h1>
                    <p className="text-slate-600 mt-1">Rekap kehadiran karyawan</p>
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
                            <Label>Karyawan</Label>
                            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Karyawan</SelectItem>
                                    {employees.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
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
                <Card className="bg-green-50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <div>
                            <p className="text-2xl font-bold text-green-700">{summary.totalPresent}</p>
                            <p className="text-sm text-green-600">Hadir</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-red-50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <XCircle className="h-8 w-8 text-red-600" />
                        <div>
                            <p className="text-2xl font-bold text-red-700">{summary.totalAbsent}</p>
                            <p className="text-sm text-red-600">Tidak Hadir</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-yellow-50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Clock className="h-8 w-8 text-yellow-600" />
                        <div>
                            <p className="text-2xl font-bold text-yellow-700">{summary.totalLate}</p>
                            <p className="text-sm text-yellow-600">Terlambat</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Palmtree className="h-8 w-8 text-blue-600" />
                        <div>
                            <p className="text-2xl font-bold text-blue-700">{summary.totalLeave}</p>
                            <p className="text-sm text-blue-600">Izin/Cuti</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="detail">
                <TabsList>
                    <TabsTrigger value="detail">Detail Harian</TabsTrigger>
                    <TabsTrigger value="rekap">Rekap Per Karyawan</TabsTrigger>
                </TabsList>

                <TabsContent value="detail">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detail Kehadiran</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>NIK</TableHead>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Jabatan</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead>Jam Masuk</TableHead>
                                        <TableHead>Jam Keluar</TableHead>
                                        <TableHead>Keterangan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ) : data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                Tidak ada data
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="whitespace-nowrap">{formatDate(item.date)}</TableCell>
                                                <TableCell className="font-mono text-sm">{item.employeeNik}</TableCell>
                                                <TableCell>{item.employeeName}</TableCell>
                                                <TableCell>{item.position}</TableCell>
                                                <TableCell className="text-center">{getStatusBadge(item.status)}</TableCell>
                                                <TableCell>{item.checkIn || "-"}</TableCell>
                                                <TableCell>{item.checkOut || "-"}</TableCell>
                                                <TableCell className="max-w-[150px] truncate">{item.notes}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rekap">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rekap Per Karyawan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>NIK</TableHead>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Jabatan</TableHead>
                                        <TableHead className="text-center">Hadir</TableHead>
                                        <TableHead className="text-center">Tidak Hadir</TableHead>
                                        <TableHead className="text-center">Terlambat</TableHead>
                                        <TableHead className="text-center">Izin/Cuti</TableHead>
                                        <TableHead className="text-center">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employeeSummary.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                Tidak ada data
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        employeeSummary.map((es) => (
                                            <TableRow key={es.employee.id}>
                                                <TableCell className="font-mono text-sm">{es.employee.nik}</TableCell>
                                                <TableCell>{es.employee.name}</TableCell>
                                                <TableCell>{es.employee.position}</TableCell>
                                                <TableCell className="text-center font-medium text-green-700">{es.present}</TableCell>
                                                <TableCell className="text-center font-medium text-red-700">{es.absent}</TableCell>
                                                <TableCell className="text-center font-medium text-yellow-700">{es.late}</TableCell>
                                                <TableCell className="text-center font-medium text-blue-700">{es.leave}</TableCell>
                                                <TableCell className="text-center font-bold">{es.total}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
