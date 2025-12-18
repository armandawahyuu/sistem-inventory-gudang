"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Filter,
    Eye,
    Plus,
    Pencil,
    Trash2,
    LogIn,
    LogOut,
    Download,
    Upload,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

interface AuditLog {
    id: string;
    userId: string;
    userName: string | null;
    action: string;
    tableName: string;
    recordId: string | null;
    dataBefore: Record<string, unknown> | null;
    dataAfter: Record<string, unknown> | null;
    ipAddress: string | null;
    description: string | null;
    createdAt: string;
}

interface Meta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface Filters {
    tableNames: string[];
    users: { id: string; name: string | null }[];
    actions: string[];
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
    CREATE: <Plus className="h-4 w-4" />,
    UPDATE: <Pencil className="h-4 w-4" />,
    DELETE: <Trash2 className="h-4 w-4" />,
    LOGIN: <LogIn className="h-4 w-4" />,
    LOGOUT: <LogOut className="h-4 w-4" />,
    EXPORT: <Download className="h-4 w-4" />,
    IMPORT: <Upload className="h-4 w-4" />,
};

const ACTION_COLORS: Record<string, string> = {
    CREATE: "bg-green-100 text-green-700 border-green-200",
    UPDATE: "bg-blue-100 text-blue-700 border-blue-200",
    DELETE: "bg-red-100 text-red-700 border-red-200",
    LOGIN: "bg-purple-100 text-purple-700 border-purple-200",
    LOGOUT: "bg-slate-100 text-slate-700 border-slate-200",
    EXPORT: "bg-amber-100 text-amber-700 border-amber-200",
    IMPORT: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const TABLE_NAMES: Record<string, string> = {
    User: "Pengguna",
    Sparepart: "Sparepart",
    HeavyEquipment: "Alat Berat",
    Category: "Kategori",
    Supplier: "Supplier",
    Employee: "Karyawan",
    StockIn: "Barang Masuk",
    StockOut: "Barang Keluar",
    PettyCash: "Kas Kecil",
    Attendance: "Absensi",
};

export default function ActivityLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [filters, setFilters] = useState<Filters>({ tableNames: [], users: [], actions: [] });
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [action, setAction] = useState("");
    const [tableName, setTableName] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Detail dialog
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    useEffect(() => {
        fetchLogs(1);
    }, [action, tableName, dateFrom, dateTo]);

    const fetchLogs = async (page: number) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
            });
            if (search) params.set("search", search);
            if (action) params.set("action", action);
            if (tableName) params.set("tableName", tableName);
            if (dateFrom) params.set("dateFrom", dateFrom);
            if (dateTo) params.set("dateTo", dateTo);

            const response = await fetch(`/api/settings/activity-log?${params}`);
            const result = await response.json();

            if (response.ok) {
                setLogs(result.data);
                setMeta(result.meta);
                setFilters(result.filters);
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        fetchLogs(1);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getTableDisplayName = (name: string) => {
        return TABLE_NAMES[name] || name;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Activity Log</h1>
                <p className="text-slate-600 mt-1">Riwayat semua aktivitas sistem (tambah, ubah, hapus)</p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filter
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Cari..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="pl-9"
                            />
                        </div>
                        <Select value={action} onValueChange={setAction}>
                            <SelectTrigger>
                                <SelectValue placeholder="Semua aksi" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua aksi</SelectItem>
                                {filters.actions.map((a) => (
                                    <SelectItem key={a} value={a}>{a}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={tableName} onValueChange={setTableName}>
                            <SelectTrigger>
                                <SelectValue placeholder="Semua modul" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua modul</SelectItem>
                                {filters.tableNames.map((t) => (
                                    <SelectItem key={t} value={t}>{getTableDisplayName(t)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            placeholder="Dari tanggal"
                        />
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            placeholder="Sampai tanggal"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Waktu</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Aksi</TableHead>
                                <TableHead>Modul</TableHead>
                                <TableHead>Keterangan</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        Memuat data...
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        Tidak ada data aktivitas
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {formatDate(log.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium">{log.userName || "-"}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`${ACTION_COLORS[log.action] || ""} flex items-center gap-1 w-fit`}
                                            >
                                                {ACTION_ICONS[log.action]}
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{getTableDisplayName(log.tableName)}</TableCell>
                                        <TableCell className="max-w-[300px] truncate">
                                            {log.description || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedLog(log)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                        Menampilkan {((meta.page - 1) * meta.limit) + 1} - {Math.min(meta.page * meta.limit, meta.total)} dari {meta.total} data
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchLogs(meta.page - 1)}
                            disabled={meta.page <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="flex items-center px-3 text-sm">
                            {meta.page} / {meta.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchLogs(meta.page + 1)}
                            disabled={meta.page >= meta.totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Aktivitas</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-500">Waktu</p>
                                    <p className="font-medium">{formatDate(selectedLog.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">User</p>
                                    <p className="font-medium">{selectedLog.userName || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Aksi</p>
                                    <Badge className={ACTION_COLORS[selectedLog.action]}>
                                        {selectedLog.action}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Modul</p>
                                    <p className="font-medium">{getTableDisplayName(selectedLog.tableName)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Record ID</p>
                                    <p className="font-mono text-sm">{selectedLog.recordId || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">IP Address</p>
                                    <p className="font-mono text-sm">{selectedLog.ipAddress || "-"}</p>
                                </div>
                            </div>

                            {selectedLog.description && (
                                <div>
                                    <p className="text-sm text-slate-500">Keterangan</p>
                                    <p className="font-medium">{selectedLog.description}</p>
                                </div>
                            )}

                            {selectedLog.dataBefore && (
                                <div>
                                    <p className="text-sm text-slate-500 mb-2">Data Sebelum</p>
                                    <pre className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm overflow-auto max-h-40">
                                        {JSON.stringify(selectedLog.dataBefore, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.dataAfter && (
                                <div>
                                    <p className="text-sm text-slate-500 mb-2">Data Sesudah</p>
                                    <pre className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm overflow-auto max-h-40">
                                        {JSON.stringify(selectedLog.dataAfter, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
