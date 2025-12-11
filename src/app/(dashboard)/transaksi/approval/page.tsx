"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Check, X, Clock, CheckCircle, XCircle } from "lucide-react";
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
import { toast } from "sonner";
import { RejectDialog } from "./components/reject-dialog";

interface StockOut {
    id: string;
    quantity: number;
    purpose: string | null;
    createdAt: string;
    sparepart: { code: string; name: string; unit: string; currentStock: number };
    equipment: { code: string; name: string; type: string };
    employee: { nik: string; name: string; position: string };
}

interface Stats {
    totalPending: number;
    approvedToday: number;
    rejectedToday: number;
}

interface Meta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function ApprovalPage() {
    const [pendingRequests, setPendingRequests] = useState<StockOut[]>([]);
    const [stats, setStats] = useState<Stats>({ totalPending: 0, approvedToday: 0, rejectedToday: 0 });
    const [meta, setMeta] = useState<Meta>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Reject dialog
    const [rejectOpen, setRejectOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<StockOut | null>(null);
    const [isRejecting, setIsRejecting] = useState(false);

    // Approve
    const [isApproving, setIsApproving] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/transaksi/approval/stats");
            const result = await response.json();
            if (response.ok) {
                setStats(result.data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchPendingRequests = async (page = 1) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: meta.limit.toString(),
                search,
                status: "pending",
            });

            const response = await fetch(`/api/transaksi/barang-keluar?${params}`);
            const result = await response.json();

            if (response.ok) {
                setPendingRequests(result.data);
                setMeta(result.meta);
            } else {
                toast.error(result.error || "Gagal memuat data");
            }
        } catch (error) {
            console.error("Error fetching pending requests:", error);
            toast.error("Terjadi kesalahan saat memuat data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchPendingRequests();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPendingRequests(1);
    };

    const handleApprove = async (item: StockOut) => {
        setIsApproving(item.id);
        try {
            const response = await fetch(`/api/transaksi/barang-keluar/${item.id}/approve`, {
                method: "POST",
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(`✓ Request "${item.sparepart.name}" berhasil di-approve`);
                fetchPendingRequests(meta.page);
                fetchStats();
            } else {
                toast.error(result.error || "Gagal approve request");
            }
        } catch (error) {
            console.error("Error approving:", error);
            toast.error("Terjadi kesalahan saat approve");
        } finally {
            setIsApproving(null);
        }
    };

    const handleRejectClick = (item: StockOut) => {
        setSelectedItem(item);
        setRejectOpen(true);
    };

    const handleReject = async (reason: string) => {
        if (!selectedItem) return;

        setIsRejecting(true);
        try {
            const response = await fetch(`/api/transaksi/barang-keluar/${selectedItem.id}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.error(`✗ Request "${selectedItem.sparepart.name}" ditolak`);
                setRejectOpen(false);
                fetchPendingRequests(meta.page);
                fetchStats();
            } else {
                toast.error(result.error || "Gagal reject request");
            }
        } catch (error) {
            console.error("Error rejecting:", error);
            toast.error("Terjadi kesalahan saat reject");
        } finally {
            setIsRejecting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const isStockInsufficient = (item: StockOut) => {
        return item.sparepart.currentStock < item.quantity;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Approval Barang Keluar</h1>
                <p className="text-slate-600 mt-1">Kelola persetujuan request barang keluar</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Clock className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Total Pending</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.totalPending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Approved Hari Ini</p>
                                <p className="text-2xl font-bold text-green-600">{stats.approvedToday}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <XCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Rejected Hari Ini</p>
                                <p className="text-2xl font-bold text-red-600">{stats.rejectedToday}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Requests Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Request Menunggu Persetujuan</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <div className="mb-4">
                        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Cari sparepart, pemohon..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button type="submit">Cari</Button>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">No</TableHead>
                                    <TableHead>Tanggal Request</TableHead>
                                    <TableHead>Sparepart</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Stok Tersedia</TableHead>
                                    <TableHead>Unit Alat Berat</TableHead>
                                    <TableHead>Pemohon</TableHead>
                                    <TableHead>Keperluan</TableHead>
                                    <TableHead className="w-32 text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                                        </TableCell>
                                    </TableRow>
                                ) : pendingRequests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                                            Tidak ada request yang menunggu persetujuan
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    pendingRequests.map((item, index) => (
                                        <TableRow key={item.id} className={isStockInsufficient(item) ? "bg-red-50" : ""}>
                                            <TableCell>{(meta.page - 1) * meta.limit + index + 1}</TableCell>
                                            <TableCell className="text-sm">{formatDate(item.createdAt)}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{item.sparepart.name}</p>
                                                    <p className="text-sm text-slate-500">{item.sparepart.code}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {item.quantity} {item.sparepart.unit}
                                            </TableCell>
                                            <TableCell className={`text-right font-semibold ${isStockInsufficient(item) ? 'text-red-600' : 'text-green-600'}`}>
                                                {item.sparepart.currentStock} {item.sparepart.unit}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <div>
                                                    <p>{item.equipment.name}</p>
                                                    <p className="text-slate-500">{item.equipment.code}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <div>
                                                    <p>{item.employee.name}</p>
                                                    <p className="text-slate-500">{item.employee.position}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm max-w-32 truncate">
                                                {item.purpose || "-"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApprove(item)}
                                                        disabled={isApproving === item.id || isStockInsufficient(item)}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        {isApproving === item.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Check className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleRejectClick(item)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {meta.totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-sm text-slate-600">
                                Menampilkan {(meta.page - 1) * meta.limit + 1} -{" "}
                                {Math.min(meta.page * meta.limit, meta.total)} dari {meta.total} data
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchPendingRequests(meta.page - 1)}
                                    disabled={meta.page === 1 || isLoading}
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchPendingRequests(meta.page + 1)}
                                    disabled={meta.page === meta.totalPages || isLoading}
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Reject Dialog */}
            <RejectDialog
                open={rejectOpen}
                onOpenChange={setRejectOpen}
                onConfirm={handleReject}
                isLoading={isRejecting}
                itemName={selectedItem?.sparepart.name || ""}
            />
        </div>
    );
}
