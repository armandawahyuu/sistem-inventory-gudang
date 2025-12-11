"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Loader2, Wallet } from "lucide-react";
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
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { toast } from "sonner";
import { formatCurrency, type PettyCashIncomeInput } from "@/lib/validations/petty-cash";
import { PemasukanForm } from "./components/pemasukan-form";

interface Transaction {
    id: string;
    date: string;
    amount: number;
    description: string;
}

interface Meta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function PemasukanKasKecilPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [balance, setBalance] = useState(0);
    const [meta, setMeta] = useState<Meta>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Form dialog
    const [formOpen, setFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete dialog
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Transaction | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchTransactions = async (page = 1) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: meta.limit.toString(),
                ...(dateFrom && { dateFrom }),
                ...(dateTo && { dateTo }),
            });

            const response = await fetch(`/api/kas-kecil/pemasukan?${params}`);
            const result = await response.json();

            if (response.ok) {
                setTransactions(result.data);
                setBalance(result.balance);
                setMeta(result.meta);
            } else {
                toast.error(result.error || "Gagal memuat data");
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast.error("Terjadi kesalahan saat memuat data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleFilter = () => {
        fetchTransactions(1);
    };

    const handleSubmit = async (data: PettyCashIncomeInput) => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/kas-kecil/pemasukan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message);
                setFormOpen(false);
                fetchTransactions(1);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (item: Transaction) => {
        setSelectedItem(item);
        setDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedItem) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/kas-kecil/pemasukan/${selectedItem.id}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message);
                setDeleteOpen(false);
                fetchTransactions(meta.page);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Pemasukan Kas Kecil</h1>
                    <p className="text-slate-600 mt-1">Kelola pemasukan kas kecil</p>
                </div>
                <Button onClick={() => setFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Pemasukan
                </Button>
            </div>

            {/* Balance Card */}
            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <Wallet className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-green-100">Saldo Kas Kecil Saat Ini</p>
                            <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pemasukan</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Date Filter */}
                    <div className="mb-4 flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Dari:</span>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Sampai:</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <Button onClick={handleFilter}>
                            <Search className="mr-2 h-4 w-4" />
                            Filter
                        </Button>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">No</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Keterangan</TableHead>
                                    <TableHead className="text-right">Jumlah</TableHead>
                                    <TableHead className="w-20 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                                        </TableCell>
                                    </TableRow>
                                ) : transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                                            Tidak ada data pemasukan
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{(meta.page - 1) * meta.limit + index + 1}</TableCell>
                                            <TableCell>{formatDate(item.date)}</TableCell>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">
                                                {formatCurrency(item.amount)}
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
                                    onClick={() => fetchTransactions(meta.page - 1)}
                                    disabled={meta.page === 1 || isLoading}
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchTransactions(meta.page + 1)}
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
            <PemasukanForm
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleSubmit}
                isLoading={isSubmitting}
            />

            {/* Delete Dialog */}
            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                title="Hapus Pemasukan"
                description={`Apakah Anda yakin ingin menghapus pemasukan "${selectedItem?.description}"?`}
            />
        </div>
    );
}
