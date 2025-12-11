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
import { SupplierForm } from "./components/supplier-form";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { toast } from "sonner";

interface Supplier {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    createdAt: string;
    updatedAt: string;
}

interface Meta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function SupplierPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchSuppliers = async (page = 1, searchQuery = search) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: meta.limit.toString(),
                search: searchQuery,
            });

            const response = await fetch(`/api/master/supplier?${params}`);
            const result = await response.json();

            if (response.ok) {
                setSuppliers(result.data);
                setMeta(result.meta);
            } else {
                toast.error(result.error || "Gagal memuat data");
            }
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            toast.error("Terjadi kesalahan saat memuat data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchSuppliers(1, search);
    };

    const handleAdd = () => {
        setSelectedSupplier(null);
        setFormOpen(true);
    };

    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setFormOpen(true);
    };

    const handleDeleteClick = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedSupplier) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/master/supplier/${selectedSupplier.id}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message || "Supplier berhasil dihapus");
                setDeleteOpen(false);
                fetchSuppliers(meta.page);
            } else {
                toast.error(result.error || "Gagal menghapus supplier");
            }
        } catch (error) {
            console.error("Error deleting supplier:", error);
            toast.error("Terjadi kesalahan saat menghapus supplier");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFormSuccess = () => {
        toast.success(
            selectedSupplier
                ? "Supplier berhasil diperbarui"
                : "Supplier berhasil ditambahkan"
        );
        fetchSuppliers(meta.page);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Master Supplier</h1>
                    <p className="text-slate-600 mt-1">Kelola data supplier</p>
                </div>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Supplier
                </Button>
            </div>

            {/* Search & Table Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Supplier</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <form onSubmit={handleSearch} className="mb-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Cari nama, telepon, atau email..."
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
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Telepon</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Alamat</TableHead>
                                    <TableHead className="w-32 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                                        </TableCell>
                                    </TableRow>
                                ) : suppliers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                            Tidak ada data supplier
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    suppliers.map((supplier, index) => (
                                        <TableRow key={supplier.id}>
                                            <TableCell>
                                                {(meta.page - 1) * meta.limit + index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">{supplier.name}</TableCell>
                                            <TableCell>{supplier.phone || "-"}</TableCell>
                                            <TableCell>{supplier.email || "-"}</TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {supplier.address || "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(supplier)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(supplier)}
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
                                    onClick={() => fetchSuppliers(meta.page - 1)}
                                    disabled={meta.page === 1 || isLoading}
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchSuppliers(meta.page + 1)}
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
            <SupplierForm
                open={formOpen}
                onOpenChange={setFormOpen}
                supplier={selectedSupplier}
                onSuccess={handleFormSuccess}
            />

            {/* Delete Dialog */}
            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                title="Hapus Supplier"
                description={`Apakah Anda yakin ingin menghapus supplier "${selectedSupplier?.name}"? Tindakan ini tidak dapat dibatalkan.`}
            />
        </div>
    );
}
