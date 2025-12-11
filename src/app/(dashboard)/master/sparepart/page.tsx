"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Loader2, Barcode as BarcodeIcon } from "lucide-react";
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
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { toast } from "sonner";
import Link from "next/link";

interface Sparepart {
    id: string;
    code: string;
    name: string;
    categoryId: string;
    brand: string | null;
    unit: string;
    minStock: number;
    currentStock: number;
    rackLocation: string | null;
    category: { name: string };
}

interface Category {
    id: string;
    name: string;
}

interface Meta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function SparepartPage() {
    const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [meta, setMeta] = useState<Meta>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [stockFilter, setStockFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedSparepart, setSelectedSparepart] = useState<Sparepart | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCategories = async () => {
        try {
            const response = await fetch("/api/master/kategori?limit=100");
            const result = await response.json();
            if (response.ok) {
                setCategories(result.data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchSpareparts = async (page = 1) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: meta.limit.toString(),
                search,
                ...(categoryFilter && categoryFilter !== "all" && { categoryId: categoryFilter }),
                ...(stockFilter && stockFilter !== "all" && { stockFilter }),
            });

            const response = await fetch(`/api/master/sparepart?${params}`);
            const result = await response.json();

            if (response.ok) {
                setSpareparts(result.data);
                setMeta(result.meta);
            } else {
                toast.error(result.error || "Gagal memuat data");
            }
        } catch (error) {
            console.error("Error fetching spareparts:", error);
            toast.error("Terjadi kesalahan saat memuat data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchSpareparts();
    }, [categoryFilter, stockFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchSpareparts(1);
    };

    const handleDeleteClick = (sparepart: Sparepart) => {
        setSelectedSparepart(sparepart);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedSparepart) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/master/sparepart/${selectedSparepart.id}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message || "Sparepart berhasil dihapus");
                setDeleteOpen(false);
                fetchSpareparts(meta.page);
            } else {
                toast.error(result.error || "Gagal menghapus sparepart");
            }
        } catch (error) {
            console.error("Error deleting sparepart:", error);
            toast.error("Terjadi kesalahan saat menghapus sparepart");
        } finally {
            setIsDeleting(false);
        }
    };

    const isLowStock = (current: number, min: number) => current <= min;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Master Sparepart</h1>
                    <p className="text-slate-600 mt-1">Kelola data sparepart dengan barcode</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/master/sparepart/print-barcode">
                        <Button variant="outline">
                            <BarcodeIcon className="mr-2 h-4 w-4" />
                            Print Barcode
                        </Button>
                    </Link>
                    <Link href="/master/sparepart/tambah">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Sparepart
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters & Table Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Sparepart</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Search & Filters */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-end mb-4">
                        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Cari kode, nama, merk..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button type="submit">Cari</Button>
                        </form>
                        <div className="flex gap-2">
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Semua Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={stockFilter} onValueChange={setStockFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Semua Stok" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Stok</SelectItem>
                                    <SelectItem value="low">Stok Menipis</SelectItem>
                                    <SelectItem value="empty">Stok Habis</SelectItem>
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
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead>Merk</TableHead>
                                    <TableHead>Satuan</TableHead>
                                    <TableHead className="text-right">Stok</TableHead>
                                    <TableHead className="text-right">Min. Stok</TableHead>
                                    <TableHead>Lokasi Rak</TableHead>
                                    <TableHead className="w-32 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-32 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                                        </TableCell>
                                    </TableRow>
                                ) : spareparts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-32 text-center text-slate-500">
                                            Tidak ada data sparepart
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    spareparts.map((sp, index) => (
                                        <TableRow
                                            key={sp.id}
                                            className={isLowStock(sp.currentStock, sp.minStock) ? "bg-red-50" : ""}
                                        >
                                            <TableCell>{(meta.page - 1) * meta.limit + index + 1}</TableCell>
                                            <TableCell className="font-medium font-mono text-sm">{sp.code}</TableCell>
                                            <TableCell>{sp.name}</TableCell>
                                            <TableCell>{sp.category.name}</TableCell>
                                            <TableCell>{sp.brand || "-"}</TableCell>
                                            <TableCell className="uppercase">{sp.unit}</TableCell>
                                            <TableCell
                                                className={`text-right font-semibold ${isLowStock(sp.currentStock, sp.minStock) ? "text-red-600" : ""}`}
                                            >
                                                {sp.currentStock}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-500">{sp.minStock}</TableCell>
                                            <TableCell>{sp.rackLocation || "-"}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/master/sparepart/edit/${sp.id}`}>
                                                        <Button variant="ghost" size="icon">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(sp)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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
                                    onClick={() => fetchSpareparts(meta.page - 1)}
                                    disabled={meta.page === 1 || isLoading}
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchSpareparts(meta.page + 1)}
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
                title="Hapus Sparepart"
                description={`Apakah Anda yakin ingin menghapus sparepart "${selectedSparepart?.name}" (${selectedSparepart?.code})? Tindakan ini tidak dapat dibatalkan.`}
            />
        </div>
    );
}
