"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ATTENDANCE_STATUS_OPTIONS } from "@/lib/validations/attendance";

interface Employee {
    id: string;
    nik: string;
    name: string;
    position: string;
}

interface AttendanceEntry {
    employeeId: string;
    clockIn: string;
    clockOut: string;
    status: string;
    overtimeHours: number;
    notes: string;
}

export default function InputAbsensiPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [date, setDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Bulk mode state
    const [bulkEntries, setBulkEntries] = useState<Map<string, AttendanceEntry>>(new Map());

    // Single mode state
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [singleEntry, setSingleEntry] = useState({
        date: new Date().toISOString().split("T")[0],
        clockIn: "",
        clockOut: "",
        status: "present",
        overtimeHours: 0,
        notes: "",
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/master/karyawan?limit=200&status=active");
            const result = await response.json();
            if (response.ok) {
                setEmployees(result.data);
                // Initialize bulk entries
                const entries = new Map<string, AttendanceEntry>();
                result.data.forEach((emp: Employee) => {
                    entries.set(emp.id, {
                        employeeId: emp.id,
                        clockIn: "",
                        clockOut: "",
                        status: "present",
                        overtimeHours: 0,
                        notes: "",
                    });
                });
                setBulkEntries(entries);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
            toast.error("Gagal memuat data karyawan");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkEntryChange = (employeeId: string, field: keyof AttendanceEntry, value: any) => {
        setBulkEntries((prev) => {
            const newMap = new Map(prev);
            const entry = newMap.get(employeeId);
            if (entry) {
                newMap.set(employeeId, { ...entry, [field]: value });
            }
            return newMap;
        });
    };

    const handleBulkSave = async () => {
        const entries = Array.from(bulkEntries.values()).filter(
            (entry) => entry.clockIn || entry.clockOut || entry.status !== "present"
        );

        if (entries.length === 0) {
            toast.error("Tidak ada data untuk disimpan");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/absensi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date, entries }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message);
            } else {
                toast.error(result.error || "Gagal menyimpan data");
            }
        } catch (error) {
            console.error("Error saving bulk attendance:", error);
            toast.error("Terjadi kesalahan saat menyimpan");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSingleSave = async () => {
        if (!selectedEmployee) {
            toast.error("Pilih karyawan terlebih dahulu");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/absensi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employeeId: selectedEmployee.id,
                    ...singleEntry,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message);
                // Reset form
                setSelectedEmployee(null);
                setEmployeeSearch("");
                setSingleEntry({
                    date: new Date().toISOString().split("T")[0],
                    clockIn: "",
                    clockOut: "",
                    status: "present",
                    overtimeHours: 0,
                    notes: "",
                });
            } else {
                toast.error(result.error || "Gagal menyimpan data");
            }
        } catch (error) {
            console.error("Error saving attendance:", error);
            toast.error("Terjadi kesalahan saat menyimpan");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredEmployees = employees.filter(
        (emp) =>
            emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
            emp.nik.toLowerCase().includes(employeeSearch.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Input Absensi Manual</h1>
                <p className="text-slate-600 mt-1">Input data absensi karyawan secara manual</p>
            </div>

            <Tabs defaultValue="bulk" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="bulk">Input Massal</TabsTrigger>
                    <TabsTrigger value="single">Input Satuan</TabsTrigger>
                </TabsList>

                {/* Bulk Entry Mode */}
                <TabsContent value="bulk">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Input Absensi Massal</CardTitle>
                                    <CardDescription>Input absensi semua karyawan sekaligus</CardDescription>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-600">Tanggal:</span>
                                        <Input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-40"
                                        />
                                    </div>
                                    <Button onClick={handleBulkSave} disabled={isSaving}>
                                        {isSaving ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="mr-2 h-4 w-4" />
                                        )}
                                        Simpan Semua
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                                </div>
                            ) : (
                                <div className="rounded-md border overflow-auto max-h-[600px]">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-white z-10">
                                            <TableRow>
                                                <TableHead className="w-24">NIK</TableHead>
                                                <TableHead className="min-w-32">Nama</TableHead>
                                                <TableHead>Jabatan</TableHead>
                                                <TableHead className="w-28">Jam Masuk</TableHead>
                                                <TableHead className="w-28">Jam Keluar</TableHead>
                                                <TableHead className="w-36">Status</TableHead>
                                                <TableHead className="w-20">Lembur</TableHead>
                                                <TableHead className="min-w-40">Keterangan</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {employees.map((emp) => {
                                                const entry = bulkEntries.get(emp.id);
                                                return (
                                                    <TableRow key={emp.id}>
                                                        <TableCell className="font-mono text-sm">{emp.nik}</TableCell>
                                                        <TableCell className="font-medium">{emp.name}</TableCell>
                                                        <TableCell className="text-sm text-slate-600">{emp.position}</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="time"
                                                                value={entry?.clockIn || ""}
                                                                onChange={(e) => handleBulkEntryChange(emp.id, "clockIn", e.target.value)}
                                                                className="w-full"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="time"
                                                                value={entry?.clockOut || ""}
                                                                onChange={(e) => handleBulkEntryChange(emp.id, "clockOut", e.target.value)}
                                                                className="w-full"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Select
                                                                value={entry?.status || "present"}
                                                                onValueChange={(value) => handleBulkEntryChange(emp.id, "status", value)}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {ATTENDANCE_STATUS_OPTIONS.map((opt) => (
                                                                        <SelectItem key={opt.value} value={opt.value}>
                                                                            {opt.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.5"
                                                                value={entry?.overtimeHours || ""}
                                                                onChange={(e) => handleBulkEntryChange(emp.id, "overtimeHours", parseFloat(e.target.value) || 0)}
                                                                className="w-full"
                                                                placeholder="0"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                value={entry?.notes || ""}
                                                                onChange={(e) => handleBulkEntryChange(emp.id, "notes", e.target.value)}
                                                                className="w-full"
                                                                placeholder="Keterangan..."
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Single Entry Mode */}
                <TabsContent value="single">
                    <Card className="max-w-2xl">
                        <CardHeader>
                            <CardTitle>Input Absensi Satuan</CardTitle>
                            <CardDescription>Input absensi untuk satu karyawan</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Employee Search */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Karyawan *</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        placeholder="Cari NIK atau nama karyawan..."
                                        value={employeeSearch}
                                        onChange={(e) => {
                                            setEmployeeSearch(e.target.value);
                                            setShowDropdown(true);
                                        }}
                                        onFocus={() => setShowDropdown(true)}
                                        className="pl-9"
                                    />
                                    {showDropdown && employeeSearch && (
                                        <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto">
                                            {filteredEmployees.slice(0, 10).map((emp) => (
                                                <button
                                                    key={emp.id}
                                                    type="button"
                                                    className="w-full px-4 py-2 text-left hover:bg-slate-100 flex items-center gap-3"
                                                    onClick={() => {
                                                        setSelectedEmployee(emp);
                                                        setEmployeeSearch(emp.name);
                                                        setShowDropdown(false);
                                                    }}
                                                >
                                                    <User className="h-4 w-4 text-slate-400" />
                                                    <div>
                                                        <p className="font-medium">{emp.name}</p>
                                                        <p className="text-sm text-slate-500">{emp.nik} • {emp.position}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {selectedEmployee && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="font-medium text-blue-900">{selectedEmployee.name}</p>
                                        <p className="text-sm text-blue-700">{selectedEmployee.nik} • {selectedEmployee.position}</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tanggal *</label>
                                    <Input
                                        type="date"
                                        value={singleEntry.date}
                                        onChange={(e) => setSingleEntry({ ...singleEntry, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Status *</label>
                                    <Select
                                        value={singleEntry.status}
                                        onValueChange={(value) => setSingleEntry({ ...singleEntry, status: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ATTENDANCE_STATUS_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Jam Masuk</label>
                                    <Input
                                        type="time"
                                        value={singleEntry.clockIn}
                                        onChange={(e) => setSingleEntry({ ...singleEntry, clockIn: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Jam Keluar</label>
                                    <Input
                                        type="time"
                                        value={singleEntry.clockOut}
                                        onChange={(e) => setSingleEntry({ ...singleEntry, clockOut: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Jam Lembur</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={singleEntry.overtimeHours || ""}
                                    onChange={(e) => setSingleEntry({ ...singleEntry, overtimeHours: parseFloat(e.target.value) || 0 })}
                                    placeholder="0"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Keterangan</label>
                                <Textarea
                                    value={singleEntry.notes}
                                    onChange={(e) => setSingleEntry({ ...singleEntry, notes: e.target.value })}
                                    placeholder="Keterangan tambahan..."
                                    className="resize-none"
                                />
                            </div>

                            <Button onClick={handleSingleSave} disabled={isSaving || !selectedEmployee} className="w-full">
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Absensi
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
