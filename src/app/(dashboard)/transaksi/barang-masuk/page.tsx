"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Loader2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { toast } from "sonner";
import Link from "next/link";

interface StockIn {
    id: string;
    quantity: number;
    invoiceNumber: string | null;
    warrantyExpiry: string | null;
    notes: string | null;
    createdAt: string;
    sparepart: { code: string; name: string; unit: string };
    supplier: { name: string } | null;
    warranty: { expiryDate: string; claimStatus: string } | null;
}

interface Supplier {
    id: string;
    name: string;
}

interface Meta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function BarangMasukPage() {
    const [stockIns, setStockIns] = useState<StockIn[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [meta, setMeta] = useState<Meta>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [search, setSearch] = useState("");
    const [supplierFilter, setSupplierFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<StockIn | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchSuppliers = async () => {
        try {
            const response = await fetch("/api/master/supplier?limit=100");
            const result = await response.json();
            if (response.ok) {
                setSuppliers(result.data);
            }
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        }
    };

    const fetchStockIns = async (page = 1) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: meta.limit.toString(),
                search,
                ...(supplierFilter && { supplierId: supplierFilter }),
                ...(dateFrom && { dateFrom }),
                ...(dateTo && { dateTo }),
            });

            const response = await fetch(`/api/transaksi/barang-masuk?${params}`);
            const result = await response.json();

            if (response.ok) {
                setStockIns(result.data);
                setMeta(result.meta);
            } else {
                toast.error(result.error || "Gagal memuat data");
            }
        } catch (error) {
            console.error("Error fetching stock ins:", error);
            toast.error("Terjadi kesalahan saat memuat data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    useEffect(() => {
        fetchStockIns();
    }, [supplierFilter, dateFrom, dateTo]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStockIns(1);
    };

    const handleDeleteClick = (item: StockIn) => {
        setSelectedItem(item);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedItem) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/transaksi/barang-masuk/${selectedItem.id}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message || "Data berhasil dihapus");
                setDeleteOpen(false);
                fetchStockIns(meta.page);
            } else {
                toast.error(result.error || "Gagal menghapus data");
            }
        } catch (error) {
            console.error("Error deleting stock in:", error);
            toast.error("Terjadi kesalahan saat menghapus data");
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const isWarrantyExpired = (expiryDate: string) => {
        return new Date(expiryDate) < new Date();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Barang Masuk</h1>
                    <p className="text-slate-600 mt-1">Kelola transaksi barang masuk</p>
                </div>
                <Link href="/transaksi/barang-masuk/tambah">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Barang Masuk
                    </Button>
                </Link>
            </div>

            {/* Filters & Table Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Barang Masuk</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Search & Filters */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-end mb-4">
                        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Cari kode, nama sparepart, invoice..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button type="submit">Cari</Button>
                        </form>
                        <div className="flex gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-40"
                                    placeholder="Dari"
                                />
                                <span className="text-slate-400">-</span>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-40"
                                    placeholder="Sampai"
                                />
                            </div>
                            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Semua Supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Supplier</SelectItem>
                                    {suppliers.map((sup) => (
                                        <SelectItem key={sup.id} value={sup.id}>
                                            {sup.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">No</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Kode Sparepart</TableHead>
                                    <TableHead>Nama Sparepart</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>No. Invoice</TableHead>
                                    <TableHead>Garansi s/d</TableHead>
                                    <TableHead className="w-20 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                                        </TableCell>
                                    </TableRow>
                                ) : stockIns.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center text-slate-500">
                                            Tidak ada data barang masuk
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stockIns.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{(meta.page - 1) * meta.limit + index + 1}</TableCell>
                                            <TableCell>{formatDate(item.createdAt)}</TableCell>
                                            <TableCell className="font-mono text-sm">{item.sparepart.code}</TableCell>
                                            <TableCell>{item.sparepart.name}</TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {item.quantity} {item.sparepart.unit}
                                            </TableCell>
                                            <TableCell>{item.supplier?.name || "-"}</TableCell>
                                            <TableCell>{item.invoiceNumber || "-"}</TableCell>
                                            <TableCell>
                                                {item.warranty ? (
                                                    <Badge
                                                        variant={isWarrantyExpired(item.warranty.expiryDate) ? "secondary" : "default"}
                                                    >
                                                        {formatDate(item.warranty.expiryDate)}
                                                    </Badge>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(item)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
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
                                    onClick={() => fetchStockIns(meta.page - 1)}
                                    disabled={meta.page === 1 || isLoading}
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchStockIns(meta.page + 1)}
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
                title="Hapus Barang Masuk"
                description={`Apakah Anda yakin ingin menghapus data barang masuk "${selectedItem?.sparepart.name}" (${selectedItem?.quantity} ${selectedItem?.sparepart.unit})? Stok akan dikurangi kembali.`}
            />
        </div>
    );
}
