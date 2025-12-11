"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
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
import { POSITION_OPTIONS } from "@/lib/validations/karyawan";

interface Karyawan {
    id: string;
    nik: string;
    name: string;
    position: string;
    department: string | null;
    phone: string | null;
    isActive: boolean;
}

interface Meta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function KaryawanPage() {
    const [karyawan, setKaryawan] = useState<Karyawan[]>([]);
    const [meta, setMeta] = useState<Meta>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [search, setSearch] = useState("");
    const [positionFilter, setPositionFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedKaryawan, setSelectedKaryawan] = useState<Karyawan | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchKaryawan = async (page = 1) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: meta.limit.toString(),
                search,
                ...(positionFilter && positionFilter !== "all" && { position: positionFilter }),
                ...(statusFilter && statusFilter !== "all" && { status: statusFilter }),
            });

            const response = await fetch(`/api/master/karyawan?${params}`);
            const result = await response.json();

            if (response.ok) {
                setKaryawan(result.data);
                setMeta(result.meta);
            } else {
                toast.error(result.error || "Gagal memuat data");
            }
        } catch (error) {
            console.error("Error fetching karyawan:", error);
            toast.error("Terjadi kesalahan saat memuat data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchKaryawan();
    }, [positionFilter, statusFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchKaryawan(1);
    };

    const handleDeleteClick = (k: Karyawan) => {
        setSelectedKaryawan(k);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedKaryawan) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/master/karyawan/${selectedKaryawan.id}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message || "Karyawan berhasil dihapus");
                setDeleteOpen(false);
                fetchKaryawan(meta.page);
            } else {
                toast.error(result.error || "Gagal menghapus karyawan");
            }
        } catch (error) {
            console.error("Error deleting karyawan:", error);
            toast.error("Terjadi kesalahan saat menghapus karyawan");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Master Karyawan</h1>
                    <p className="text-slate-600 mt-1">Kelola data karyawan</p>
                </div>
                <Link href="/master/karyawan/tambah">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Karyawan
                    </Button>
                </Link>
            </div>

            {/* Filters & Table Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Karyawan</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Search & Filters */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-end mb-4">
                        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Cari NIK, nama, telepon..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button type="submit">Cari</Button>
                        </form>
                        <div className="flex gap-2">
                            <Select value={positionFilter} onValueChange={setPositionFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Semua Jabatan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Jabatan</SelectItem>
                                    {POSITION_OPTIONS.map((pos) => (
                                        <SelectItem key={pos} value={pos}>
                                            {pos}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="active">Aktif</SelectItem>
                                    <SelectItem value="inactive">Non-aktif</SelectItem>
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
                                    <TableHead>NIK</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Jabatan</TableHead>
                                    <TableHead>Departemen</TableHead>
                                    <TableHead>Telepon</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-32 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-32 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                                        </TableCell>
                                    </TableRow>
                                ) : karyawan.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                                            Tidak ada data karyawan
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    karyawan.map((k, index) => (
                                        <TableRow key={k.id}>
                                            <TableCell>{(meta.page - 1) * meta.limit + index + 1}</TableCell>
                                            <TableCell className="font-medium font-mono text-sm">{k.nik}</TableCell>
                                            <TableCell>{k.name}</TableCell>
                                            <TableCell>{k.position}</TableCell>
                                            <TableCell>{k.department || "-"}</TableCell>
                                            <TableCell>{k.phone || "-"}</TableCell>
                                            <TableCell>
                                                <Badge variant={k.isActive ? "default" : "secondary"}>
                                                    {k.isActive ? "Aktif" : "Non-aktif"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/master/karyawan/edit/${k.id}`}>
                                                        <Button variant="ghost" size="icon">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(k)}
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
                                    onClick={() => fetchKaryawan(meta.page - 1)}
                                    disabled={meta.page === 1 || isLoading}
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchKaryawan(meta.page + 1)}
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
                title="Hapus Karyawan"
                description={`Apakah Anda yakin ingin menghapus karyawan "${selectedKaryawan?.name}" (${selectedKaryawan?.nik})? Tindakan ini tidak dapat dibatalkan.`}
            />
        </div>
    );
}
