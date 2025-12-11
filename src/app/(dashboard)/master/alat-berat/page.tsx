"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, Pencil, Trash2, Loader2, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { AlatBeratForm } from "./components/alat-berat-form";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { EQUIPMENT_TYPES, EQUIPMENT_STATUS } from "@/lib/validations/alat-berat";
import { toast } from "sonner";

interface HeavyEquipment {
    id: string;
    code: string;
    name: string;
    type: string;
    brand: string;
    model: string;
    year: number | null;
    site: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
}

interface Meta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function AlatBeratPage() {
    const [equipment, setEquipment] = useState<HeavyEquipment[]>([]);
    const [meta, setMeta] = useState<Meta>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [siteFilter, setSiteFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<HeavyEquipment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchEquipment = async (page = 1) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: meta.limit.toString(),
                search,
                ...(typeFilter && typeFilter !== "all" && { type: typeFilter }),
                ...(statusFilter && statusFilter !== "all" && { status: statusFilter }),
                ...(siteFilter && { site: siteFilter }),
            });

            const response = await fetch(`/api/master/alat-berat?${params}`);
            const result = await response.json();

            if (response.ok) {
                setEquipment(result.data);
                setMeta(result.meta);
            } else {
                toast.error(result.error || "Gagal memuat data");
            }
        } catch (error) {
            console.error("Error fetching equipment:", error);
            toast.error("Terjadi kesalahan saat memuat data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEquipment();
    }, [typeFilter, statusFilter, siteFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchEquipment(1);
    };

    const handleAdd = () => {
        setSelectedEquipment(null);
        setFormOpen(true);
    };

    const handleEdit = (equip: HeavyEquipment) => {
        setSelectedEquipment(equip);
        setFormOpen(true);
    };

    const handleDeleteClick = (equip: HeavyEquipment) => {
        setSelectedEquipment(equip);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedEquipment) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/master/alat-berat/${selectedEquipment.id}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message || "Alat berat berhasil dihapus");
                setDeleteOpen(false);
                fetchEquipment(meta.page);
            } else {
                toast.error(result.error || "Gagal menghapus alat berat");
            }
        } catch (error) {
            console.error("Error deleting equipment:", error);
            toast.error("Terjadi kesalahan saat menghapus alat berat");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFormSuccess = () => {
        toast.success(
            selectedEquipment
                ? "Alat berat berhasil diperbarui"
                : "Alat berat berhasil ditambahkan"
        );
        fetchEquipment(meta.page);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/master/alat-berat/import", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message);
                fetchEquipment(1);
            } else {
                toast.error(result.error || "Gagal import data");
            }
        } catch (error) {
            console.error("Error importing:", error);
            toast.error("Terjadi kesalahan saat import data");
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const downloadTemplate = () => {
        const template = "Kode Unit,Nama,Tipe,Merk,Model,Tahun,Lokasi,Status\nEX-001,Excavator PC200,Excavator,Komatsu,PC200-8,2020,Site A,active\n";
        const blob = new Blob([template], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "template-alat-berat.csv";
        a.click();
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
            active: { variant: "default", className: "bg-green-500 hover:bg-green-600" },
            maintenance: { variant: "secondary", className: "bg-yellow-500 hover:bg-yellow-600 text-white" },
            inactive: { variant: "destructive", className: "" },
        };

        const config = variants[status] || variants.active;
        const label = EQUIPMENT_STATUS[status as keyof typeof EQUIPMENT_STATUS] || status;

        return (
            <Badge variant={config.variant} className={config.className}>
                {label}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Master Alat Berat</h1>
                    <p className="text-slate-600 mt-1">Kelola data heavy equipment</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={downloadTemplate}>
                        <Download className="mr-2 h-4 w-4" />
                        Template
                    </Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                        {isImporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Import...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Import Excel
                            </>
                        )}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleImport}
                        className="hidden"
                    />
                    <Button onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Alat Berat
                    </Button>
                </div>
            </div>

            {/* Filters & Table Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Alat Berat</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Search & Filters */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-end mb-4">
                        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Cari kode, nama, merk, model..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button type="submit">Cari</Button>
                        </form>
                        <div className="flex gap-2">
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Semua Tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Tipe</SelectItem>
                                    {EQUIPMENT_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
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
                                    {Object.entries(EQUIPMENT_STATUS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
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
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Merk</TableHead>
                                    <TableHead>Model</TableHead>
                                    <TableHead>Tahun</TableHead>
                                    <TableHead>Lokasi</TableHead>
                                    <TableHead>Status</TableHead>
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
                                ) : equipment.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-32 text-center text-slate-500">
                                            Tidak ada data alat berat
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    equipment.map((equip, index) => (
                                        <TableRow key={equip.id}>
                                            <TableCell>{(meta.page - 1) * meta.limit + index + 1}</TableCell>
                                            <TableCell className="font-medium">{equip.code}</TableCell>
                                            <TableCell>{equip.name}</TableCell>
                                            <TableCell>{equip.type}</TableCell>
                                            <TableCell>{equip.brand}</TableCell>
                                            <TableCell>{equip.model}</TableCell>
                                            <TableCell>{equip.year || "-"}</TableCell>
                                            <TableCell>{equip.site || "-"}</TableCell>
                                            <TableCell>{getStatusBadge(equip.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(equip)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(equip)}
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
                                    onClick={() => fetchEquipment(meta.page - 1)}
                                    disabled={meta.page === 1 || isLoading}
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchEquipment(meta.page + 1)}
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
            <AlatBeratForm
                open={formOpen}
                onOpenChange={setFormOpen}
                equipment={selectedEquipment}
                onSuccess={handleFormSuccess}
            />

            {/* Delete Dialog */}
            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                title="Hapus Alat Berat"
                description={`Apakah Anda yakin ingin menghapus alat berat "${selectedEquipment?.name}" (${selectedEquipment?.code})? Tindakan ini tidak dapat dibatalkan.`}
            />
        </div>
    );
}
