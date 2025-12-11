"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
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
import { KategoriForm } from "./components/kategori-form";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { toast } from "sonner";

interface Category {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

interface Meta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function KategoriPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [meta, setMeta] = useState<Meta>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCategories = async (page = 1, searchQuery = search) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: meta.limit.toString(),
                search: searchQuery,
            });

            const response = await fetch(`/api/master/kategori?${params}`);
            const result = await response.json();

            if (response.ok) {
                setCategories(result.data);
                setMeta(result.meta);
            } else {
                toast.error(result.error || "Gagal memuat data");
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error("Terjadi kesalahan saat memuat data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchCategories(1, search);
    };

    const handleAdd = () => {
        setSelectedCategory(null);
        setFormOpen(true);
    };

    const handleEdit = (category: Category) => {
        setSelectedCategory(category);
        setFormOpen(true);
    };

    const handleDeleteClick = (category: Category) => {
        setSelectedCategory(category);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedCategory) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/master/kategori/${selectedCategory.id}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message || "Kategori berhasil dihapus");
                setDeleteOpen(false);
                fetchCategories(meta.page);
            } else {
                toast.error(result.error || "Gagal menghapus kategori");
            }
        } catch (error) {
            console.error("Error deleting category:", error);
            toast.error("Terjadi kesalahan saat menghapus kategori");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFormSuccess = () => {
        toast.success(
            selectedCategory
                ? "Kategori berhasil diperbarui"
                : "Kategori berhasil ditambahkan"
        );
        fetchCategories(meta.page);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Master Kategori</h1>
                    <p className="text-slate-600 mt-1">Kelola kategori sparepart</p>
                </div>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Kategori
                </Button>
            </div>

            {/* Search & Table Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Kategori</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <form onSubmit={handleSearch} className="mb-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Cari nama kategori..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button type="submit">Cari</Button>
                        </div>
                    </form>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">No</TableHead>
                                    <TableHead>Nama Kategori</TableHead>
                                    <TableHead>Tanggal Dibuat</TableHead>
                                    <TableHead className="w-32 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                                        </TableCell>
                                    </TableRow>
                                ) : categories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                                            Tidak ada data kategori
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    categories.map((category, index) => (
                                        <TableRow key={category.id}>
                                            <TableCell>
                                                {(meta.page - 1) * meta.limit + index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">{category.name}</TableCell>
                                            <TableCell>{formatDate(category.createdAt)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(category)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(category)}
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
                                    onClick={() => fetchCategories(meta.page - 1)}
                                    disabled={meta.page === 1 || isLoading}
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchCategories(meta.page + 1)}
                                    disabled={meta.page === meta.totalPages || isLoading}
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Form Dialog */}
            <KategoriForm
                open={formOpen}
                onOpenChange={setFormOpen}
                category={selectedCategory}
                onSuccess={handleFormSuccess}
            />

            {/* Delete Dialog */}
            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                title="Hapus Kategori"
                description={`Apakah Anda yakin ingin menghapus kategori "${selectedCategory?.name}"? Tindakan ini tidak dapat dibatalkan.`}
            />
        </div>
    );
}
