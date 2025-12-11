"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Loader2, Check, X } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";

interface StockOut {
    id: string;
    quantity: number;
    purpose: string | null;
    status: string;
    rejectedReason: string | null;
    createdAt: string;
    approvedAt: string | null;
    sparepart: { code: string; name: string; unit: string };
    equipment: { code: string; name: string; type: string };
    employee: { nik: string; name: string; position: string };
}

interface Meta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function BarangKeluarPage() {
    const [stockOuts, setStockOuts] = useState<StockOut[]>([]);
    const [meta, setMeta] = useState<Meta>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);

    // Delete dialog
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<StockOut | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Reject dialog
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [isRejecting, setIsRejecting] = useState(false);

    // Approve
    const [isApproving, setIsApproving] = useState<string | null>(null);

    const fetchStockOuts = async (page = 1) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: meta.limit.toString(),
                search,
                status: statusFilter,
            });

            const response = await fetch(`/api/transaksi/barang-keluar?${params}`);
            const result = await response.json();

            if (response.ok) {
                setStockOuts(result.data);
                setMeta(result.meta);
            } else {
                toast.error(result.error || "Gagal memuat data");
            }
        } catch (error) {
            console.error("Error fetching stock outs:", error);
            toast.error("Terjadi kesalahan saat memuat data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStockOuts();
    }, [statusFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStockOuts(1);
    };

    const handleDeleteClick = (item: StockOut) => {
        setSelectedItem(item);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedItem) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/transaksi/barang-keluar/${selectedItem.id}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message || "Request berhasil dihapus");
                setDeleteOpen(false);
                fetchStockOuts(meta.page);
            } else {
                toast.error(result.error || "Gagal menghapus request");
            }
        } catch (error) {
            console.error("Error deleting stock out:", error);
            toast.error("Terjadi kesalahan saat menghapus");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleApprove = async (item: StockOut) => {
        setIsApproving(item.id);
        try {
            const response = await fetch(`/api/transaksi/barang-keluar/${item.id}/approve`, {
                method: "POST",
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message || "Request berhasil di-approve");
                fetchStockOuts(meta.page);
            } else {
                toast.error(result.error || "Gagal approve request");
            }
        } catch (error) {
            console.error("Error approving stock out:", error);
            toast.error("Terjadi kesalahan saat approve");
        } finally {
            setIsApproving(null);
        }
    };

    const handleRejectClick = (item: StockOut) => {
        setSelectedItem(item);
        setRejectReason("");
        setRejectOpen(true);
    };

    const handleReject = async () => {
        if (!selectedItem || !rejectReason.trim()) {
            toast.error("Alasan penolakan wajib diisi");
            return;
        }

        setIsRejecting(true);
        try {
            const response = await fetch(`/api/transaksi/barang-keluar/${selectedItem.id}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: rejectReason }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message || "Request berhasil ditolak");
                setRejectOpen(false);
                fetchStockOuts(meta.page);
            } else {
                toast.error(result.error || "Gagal reject request");
            }
        } catch (error) {
            console.error("Error rejecting stock out:", error);
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            case "approved":
                return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
            case "rejected":
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Barang Keluar</h1>
                    <p className="text-slate-600 mt-1">Kelola request barang keluar</p>
                </div>
                <Link href="/transaksi/barang-keluar/request">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Request Barang Keluar
                    </Button>
                </Link>
            </div>

            {/* Filters & Table Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Daftar Request</CardTitle>
                        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                            <TabsList>
                                <TabsTrigger value="all">Semua</TabsTrigger>
                                <TabsTrigger value="pending">Pending</TabsTrigger>
                                <TabsTrigger value="approved">Approved</TabsTrigger>
                                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <div className="mb-4">
                        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Cari kode, nama, pemohon..."
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
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama Sparepart</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead>Unit Alat Berat</TableHead>
                                    <TableHead>Pemohon</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-32 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                                        </TableCell>
                                    </TableRow>
                                ) : stockOuts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                                            Tidak ada data barang keluar
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stockOuts.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{(meta.page - 1) * meta.limit + index + 1}</TableCell>
                                            <TableCell className="text-sm">{formatDate(item.createdAt)}</TableCell>
                                            <TableCell className="font-mono text-sm">{item.sparepart.code}</TableCell>
                                            <TableCell>{item.sparepart.name}</TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {item.quantity} {item.sparepart.unit}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {item.equipment.code} - {item.equipment.name}
                                            </TableCell>
                                            <TableCell className="text-sm">{item.employee.name}</TableCell>
                                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    {item.status === "pending" && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleApprove(item)}
                                                                disabled={isApproving === item.id}
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            >
                                                                {isApproving === item.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Check className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRejectClick(item)}
                                                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeleteClick(item)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
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
                                    onClick={() => fetchStockOuts(meta.page - 1)}
                                    disabled={meta.page === 1 || isLoading}
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchStockOuts(meta.page + 1)}
                                    disabled={meta.page === meta.totalPages || isLoading}
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Dialog */}
            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                title="Hapus Request"
                description={`Apakah Anda yakin ingin menghapus request barang keluar "${selectedItem?.sparepart.name}"?`}
            />

            {/* Reject Dialog */}
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Request</DialogTitle>
                        <DialogDescription>
                            Berikan alasan penolakan untuk request barang keluar "{selectedItem?.sparepart.name}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Alasan penolakan..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isRejecting || !rejectReason.trim()}
                        >
                            {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Tolak Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
