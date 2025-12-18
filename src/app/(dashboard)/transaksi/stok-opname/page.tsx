"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    ClipboardCheck,
    Save,
    RefreshCw,
    Search,
    AlertTriangle,
    CheckCircle2,
    Minus,
    Plus,
    History
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Sparepart {
    id: string;
    code: string;
    name: string;
    unit: string;
    currentStock: number;
    rackLocation: string | null;
    category: { name: string };
}

interface Category {
    id: string;
    name: string;
}

interface OpnameItem {
    sparepartId: string;
    physicalStock: number | null;
    notes: string;
}

export default function StokOpnamePage() {
    // Data
    const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Filters
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Opname data
    const [opnameData, setOpnameData] = useState<Map<string, OpnameItem>>(new Map());
    const [opnameNotes, setOpnameNotes] = useState("");

    // Dialog
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("/api/categories");
                const data = await response.json();
                if (response.ok) {
                    setCategories(data.data || data);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        fetchCategories();
    }, []);

    // Fetch spareparts
    const fetchSpareparts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
            if (searchQuery) params.set("search", searchQuery);

            const response = await fetch(`/api/stok-opname?${params}`);
            const data = await response.json();

            if (response.ok) {
                setSpareparts(data.data);
            }
        } catch (error) {
            console.error("Error fetching spareparts:", error);
        } finally {
            setLoading(false);
        }
    }, [categoryFilter, searchQuery]);

    useEffect(() => {
        fetchSpareparts();
    }, [fetchSpareparts]);

    // Update physical stock input
    const updatePhysicalStock = (sparepartId: string, value: string) => {
        const numValue = value === "" ? null : parseInt(value);
        const newData = new Map(opnameData);
        const existing = newData.get(sparepartId) || { sparepartId, physicalStock: null, notes: "" };
        newData.set(sparepartId, { ...existing, physicalStock: numValue });
        setOpnameData(newData);
    };

    // Update notes
    const updateNotes = (sparepartId: string, notes: string) => {
        const newData = new Map(opnameData);
        const existing = newData.get(sparepartId) || { sparepartId, physicalStock: null, notes: "" };
        newData.set(sparepartId, { ...existing, notes });
        setOpnameData(newData);
    };

    // Get difference
    const getDifference = (sparepart: Sparepart): number | null => {
        const item = opnameData.get(sparepart.id);
        if (!item || item.physicalStock === null) return null;
        return item.physicalStock - sparepart.currentStock;
    };

    // Get items with input
    const getFilledItems = () => {
        return [...opnameData.values()].filter((item) => item.physicalStock !== null);
    };

    // Get items with difference
    const getItemsWithDifference = () => {
        return spareparts.filter((sp) => {
            const diff = getDifference(sp);
            return diff !== null && diff !== 0;
        });
    };

    // Handle save
    const handleSave = async () => {
        setShowConfirmDialog(false);
        setSaving(true);

        try {
            const items = getFilledItems().map((item) => {
                const sparepart = spareparts.find((sp) => sp.id === item.sparepartId);
                return {
                    sparepartId: item.sparepartId,
                    systemStock: sparepart?.currentStock || 0,
                    physicalStock: item.physicalStock!,
                    notes: item.notes || undefined,
                };
            });

            const response = await fetch("/api/stok-opname", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    notes: opnameNotes || undefined,
                    items,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Berhasil menyimpan hasil opname. ${data.adjustedCount} item disesuaikan.`);
                // Reset dan refresh
                setOpnameData(new Map());
                setOpnameNotes("");
                fetchSpareparts();
            } else {
                alert(data.error || "Gagal menyimpan hasil opname");
            }
        } catch (error) {
            console.error("Error saving opname:", error);
            alert("Terjadi kesalahan saat menyimpan");
        } finally {
            setSaving(false);
        }
    };

    const filledCount = getFilledItems().length;
    const differenceCount = getItemsWithDifference().length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                        <ClipboardCheck className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Stok Opname</h1>
                        <p className="text-slate-600 mt-1">
                            Lakukan pengecekan dan penyesuaian stok fisik dengan stok sistem
                        </p>
                    </div>
                </div>
                <Link href="/transaksi/stok-opname/history">
                    <Button variant="outline">
                        <History className="h-4 w-4 mr-2" />
                        History Opname
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="w-64">
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
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
                        </div>
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Cari kode atau nama..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button variant="outline" onClick={fetchSpareparts} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="bg-slate-50">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-slate-700">{spareparts.length}</p>
                        <p className="text-sm text-slate-500">Total Sparepart</p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-blue-700">{filledCount}</p>
                        <p className="text-sm text-blue-600">Sudah Diinput</p>
                    </CardContent>
                </Card>
                <Card className={cn("bg-yellow-50", differenceCount > 0 && "bg-red-50")}>
                    <CardContent className="p-4 text-center">
                        <p className={cn("text-3xl font-bold", differenceCount > 0 ? "text-red-700" : "text-yellow-700")}>
                            {differenceCount}
                        </p>
                        <p className={cn("text-sm", differenceCount > 0 ? "text-red-600" : "text-yellow-600")}>
                            Ada Selisih
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Sparepart</CardTitle>
                    <CardDescription>
                        Masukkan jumlah stok fisik untuk setiap sparepart. Baris dengan selisih akan ditandai.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[500px]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white z-10">
                                <TableRow>
                                    <TableHead className="w-32">Kode</TableHead>
                                    <TableHead>Nama Sparepart</TableHead>
                                    <TableHead className="w-24">Satuan</TableHead>
                                    <TableHead className="w-28 text-center">Stok Sistem</TableHead>
                                    <TableHead className="w-32 text-center">Stok Fisik</TableHead>
                                    <TableHead className="w-28 text-center">Selisih</TableHead>
                                    <TableHead className="w-48">Keterangan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Memuat data...
                                        </TableCell>
                                    </TableRow>
                                ) : spareparts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Tidak ada sparepart
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    spareparts.map((sp) => {
                                        const item = opnameData.get(sp.id);
                                        const diff = getDifference(sp);
                                        const hasInput = item?.physicalStock !== null && item?.physicalStock !== undefined;
                                        const hasDiff = diff !== null && diff !== 0;

                                        return (
                                            <TableRow
                                                key={sp.id}
                                                className={cn(
                                                    hasDiff && diff! < 0 && "bg-yellow-50",
                                                    hasDiff && diff! > 0 && "bg-red-50"
                                                )}
                                            >
                                                <TableCell className="font-mono text-sm">{sp.code}</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{sp.name}</p>
                                                        <p className="text-xs text-slate-500">{sp.category.name}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{sp.unit}</TableCell>
                                                <TableCell className="text-center font-medium">{sp.currentStock}</TableCell>
                                                <TableCell className="text-center">
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={item?.physicalStock ?? ""}
                                                        onChange={(e) => updatePhysicalStock(sp.id, e.target.value)}
                                                        className="w-24 text-center mx-auto"
                                                        placeholder="-"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {hasInput ? (
                                                        <Badge
                                                            variant={diff === 0 ? "secondary" : "destructive"}
                                                            className={cn(
                                                                "min-w-16 justify-center",
                                                                diff === 0 && "bg-green-100 text-green-700",
                                                                diff !== null && diff < 0 && "bg-yellow-100 text-yellow-700",
                                                                diff !== null && diff > 0 && "bg-red-100 text-red-700"
                                                            )}
                                                        >
                                                            {diff === 0 ? (
                                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            ) : diff! > 0 ? (
                                                                <Plus className="h-3 w-3 mr-1" />
                                                            ) : (
                                                                <Minus className="h-3 w-3 mr-1" />
                                                            )}
                                                            {diff! > 0 ? `+${diff}` : diff}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="text"
                                                        value={item?.notes || ""}
                                                        onChange={(e) => updateNotes(sp.id, e.target.value)}
                                                        className="w-full text-sm"
                                                        placeholder="Keterangan..."
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                    <div className="text-sm text-slate-500">
                        {filledCount > 0 ? (
                            <>
                                <span className="font-medium">{filledCount}</span> item sudah diinput,{" "}
                                <span className="font-medium text-red-600">{differenceCount}</span> ada selisih
                            </>
                        ) : (
                            "Belum ada input stok fisik"
                        )}
                    </div>
                    <Button
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={saving || differenceCount === 0}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        Simpan Hasil Opname
                    </Button>
                </CardFooter>
            </Card>

            {/* Confirm Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            Konfirmasi Simpan Opname
                        </DialogTitle>
                        <DialogDescription className="pt-4 space-y-4">
                            <p>
                                Anda akan menyimpan hasil opname dan menyesuaikan stok untuk{" "}
                                <strong>{differenceCount}</strong> item.
                            </p>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                                <p className="font-medium mb-2">Perhatian:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Stok sistem akan disesuaikan dengan stok fisik</li>
                                    <li>Perubahan ini akan tercatat dalam history opname</li>
                                    <li>Pastikan data sudah benar sebelum menyimpan</li>
                                </ul>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Catatan Opname (opsional):
                                </label>
                                <Textarea
                                    value={opnameNotes}
                                    onChange={(e) => setOpnameNotes(e.target.value)}
                                    placeholder="Contoh: Stok opname akhir bulan Desember 2024"
                                    className="mt-2"
                                />
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                            Batal
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Ya, Simpan Opname
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
