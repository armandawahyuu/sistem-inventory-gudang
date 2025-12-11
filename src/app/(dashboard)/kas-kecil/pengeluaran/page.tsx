"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Loader2, Wallet, Image as ImageIcon } from "lucide-react";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { toast } from "sonner";
import { formatCurrency, type PettyCashExpenseInput } from "@/lib/validations/petty-cash";
import { PengeluaranForm } from "./components/pengeluaran-form";

interface Category {
    id: string;
    name: string;
}

interface Transaction {
    id: string;
    date: string;
    amount: number;
    description: string;
    receipt: string | null;
    category: Category | null;
}

interface Meta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function PengeluaranKasKecilPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [balance, setBalance] = useState(0);
    const [meta, setMeta] = useState<Meta>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Form dialog
    const [formOpen, setFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete dialog
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Transaction | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Receipt preview dialog
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [receiptImage, setReceiptImage] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [categoryId]);

    const fetchCategories = async () => {
        try {
            const response = await fetch("/api/kas-kecil/kategori");
            const result = await response.json();
            if (response.ok) {
                setCategories(result.data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchTransactions = async (page = 1) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: meta.limit.toString(),
                ...(dateFrom && { dateFrom }),
                ...(dateTo && { dateTo }),
                ...(categoryId && { categoryId }),
            });

            const response = await fetch(`/api/kas-kecil/pengeluaran?${params}`);
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

    const handleFilter = () => {
        fetchTransactions(1);
    };

    const handleSubmit = async (data: PettyCashExpenseInput) => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/kas-kecil/pengeluaran", {
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
            const response = await fetch(`/api/kas-kecil/pengeluaran/${selectedItem.id}`, {
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

    const handleViewReceipt = (receipt: string) => {
        setReceiptImage(receipt);
        setReceiptOpen(true);
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
                    <h1 className="text-3xl font-bold text-slate-900">Pengeluaran Kas Kecil</h1>
                    <p className="text-slate-600 mt-1">Kelola pengeluaran kas kecil</p>
                </div>
                <Button onClick={() => setFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Pengeluaran
                </Button>
            </div>

            {/* Balance Card */}
            <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <Wallet className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-blue-100">Saldo Kas Kecil Saat Ini</p>
                            <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pengeluaran</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
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
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Kategori:</span>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Semua" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                    <TableHead>Kategori</TableHead>
                                    <TableHead>Keterangan</TableHead>
                                    <TableHead className="text-right">Jumlah</TableHead>
                                    <TableHead className="text-center">Bukti</TableHead>
                                    <TableHead className="w-20 text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                                        </TableCell>
                                    </TableRow>
                                ) : transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                                            Tidak ada data pengeluaran
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{(meta.page - 1) * meta.limit + index + 1}</TableCell>
                                            <TableCell>{formatDate(item.date)}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {item.category?.name || "-"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-48 truncate">{item.description}</TableCell>
                                            <TableCell className="text-right font-semibold text-red-600">
                                                {formatCurrency(item.amount)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.receipt ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleViewReceipt(item.receipt!)}
                                                        className="text-blue-600"
                                                    >
                                                        <ImageIcon className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
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
            <PengeluaranForm
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleSubmit}
                isLoading={isSubmitting}
                balance={balance}
            />

            {/* Delete Dialog */}
            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                title="Hapus Pengeluaran"
                description={`Apakah Anda yakin ingin menghapus pengeluaran "${selectedItem?.description}"?`}
            />

            {/* Receipt Preview Dialog */}
            <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Bukti Struk</DialogTitle>
                    </DialogHeader>
                    {receiptImage && (
                        <img src={receiptImage} alt="Receipt" className="w-full rounded-lg" />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
