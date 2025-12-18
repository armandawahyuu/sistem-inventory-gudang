"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
    ArrowLeft,
    Eye,
    ClipboardList,
    RefreshCw,
    Plus,
    Minus,
    Calendar
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface OpnameSummary {
    id: string;
    opnameDate: string;
    notes: string | null;
    status: string;
    createdAt: string;
    createdBy: string | null;
    totalItems: number;
    totalSelisih: number;
    totalPlus: number;
    totalMinus: number;
}

interface OpnameDetail {
    id: string;
    opnameDate: string;
    notes: string | null;
    status: string;
    createdAt: string;
    totalItems: number;
    totalSelisih: number;
    totalPlus: number;
    totalMinus: number;
    items: OpnameItem[];
}

interface OpnameItem {
    id: string;
    systemStock: number;
    physicalStock: number;
    difference: number;
    notes: string | null;
    sparepart: {
        code: string;
        name: string;
        unit: string;
        category: { name: string };
    };
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function StokOpnameHistoryPage() {
    const [opnames, setOpnames] = useState<OpnameSummary[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    // Detail dialog
    const [selectedOpname, setSelectedOpname] = useState<OpnameDetail | null>(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const fetchOpnames = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/stok-opname/history?page=${page}&limit=15`);
            const data = await response.json();

            if (response.ok) {
                setOpnames(data.data);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Error fetching opnames:", error);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchOpnames();
    }, [fetchOpnames]);

    const viewDetail = async (id: string) => {
        setLoadingDetail(true);
        setShowDetailDialog(true);
        try {
            const response = await fetch(`/api/stok-opname/history?id=${id}`);
            const data = await response.json();

            if (response.ok) {
                setSelectedOpname(data.data);
            }
        } catch (error) {
            console.error("Error fetching detail:", error);
        } finally {
            setLoadingDetail(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/transaksi/stok-opname">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">History Stok Opname</h1>
                        <p className="text-muted-foreground">Riwayat hasil stok opname</p>
                    </div>
                </div>
                <Button variant="outline" onClick={fetchOpnames} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5" />
                        Daftar Opname
                    </CardTitle>
                    <CardDescription>
                        {pagination ? `Total ${pagination.total} record` : "Memuat data..."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Catatan</TableHead>
                                <TableHead className="text-center">Total Item</TableHead>
                                <TableHead className="text-center">
                                    <span className="flex items-center justify-center gap-1">
                                        <Plus className="h-4 w-4 text-red-600" /> Lebih
                                    </span>
                                </TableHead>
                                <TableHead className="text-center">
                                    <span className="flex items-center justify-center gap-1">
                                        <Minus className="h-4 w-4 text-yellow-600" /> Kurang
                                    </span>
                                </TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-center">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        Memuat data...
                                    </TableCell>
                                </TableRow>
                            ) : opnames.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        Belum ada data opname
                                    </TableCell>
                                </TableRow>
                            ) : (
                                opnames.map((opname) => (
                                    <TableRow key={opname.id}>
                                        <TableCell className="whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                {formatDate(opname.createdAt)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {opname.notes || "-"}
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            {opname.totalItems}
                                        </TableCell>
                                        <TableCell className="text-center text-red-600 font-medium">
                                            +{opname.totalPlus}
                                        </TableCell>
                                        <TableCell className="text-center text-yellow-600 font-medium">
                                            -{opname.totalMinus}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={cn(
                                                opname.status === "COMPLETED" && "bg-green-100 text-green-700"
                                            )}>
                                                {opname.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => viewDetail(opname.id)}
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                Detail
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                Halaman {pagination.page} dari {pagination.totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(page - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= pagination.totalPages}
                                    onClick={() => setPage(page + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-orange-500" />
                            Detail Stok Opname
                        </DialogTitle>
                        <DialogDescription>
                            {selectedOpname && formatDate(selectedOpname.createdAt)}
                        </DialogDescription>
                    </DialogHeader>

                    {loadingDetail ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Memuat detail...
                        </div>
                    ) : selectedOpname ? (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-4 gap-3">
                                <Card className="bg-slate-50">
                                    <CardContent className="p-3 text-center">
                                        <p className="text-xl font-bold text-slate-700">{selectedOpname.totalItems}</p>
                                        <p className="text-xs text-slate-500">Total Item</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-blue-50">
                                    <CardContent className="p-3 text-center">
                                        <p className="text-xl font-bold text-blue-700">{selectedOpname.totalSelisih}</p>
                                        <p className="text-xs text-blue-600">Total Selisih</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-red-50">
                                    <CardContent className="p-3 text-center">
                                        <p className="text-xl font-bold text-red-700">+{selectedOpname.totalPlus}</p>
                                        <p className="text-xs text-red-600">Lebih</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-yellow-50">
                                    <CardContent className="p-3 text-center">
                                        <p className="text-xl font-bold text-yellow-700">-{selectedOpname.totalMinus}</p>
                                        <p className="text-xs text-yellow-600">Kurang</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {selectedOpname.notes && (
                                <div className="bg-slate-50 rounded-lg p-3 text-sm">
                                    <span className="font-medium">Catatan:</span> {selectedOpname.notes}
                                </div>
                            )}

                            {/* Items Table */}
                            <ScrollArea className="h-[300px] rounded-md border">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-white">
                                        <TableRow>
                                            <TableHead>Kode</TableHead>
                                            <TableHead>Nama Sparepart</TableHead>
                                            <TableHead className="text-center">Stok Sistem</TableHead>
                                            <TableHead className="text-center">Stok Fisik</TableHead>
                                            <TableHead className="text-center">Selisih</TableHead>
                                            <TableHead>Keterangan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedOpname.items.map((item) => (
                                            <TableRow
                                                key={item.id}
                                                className={cn(
                                                    item.difference < 0 && "bg-yellow-50",
                                                    item.difference > 0 && "bg-red-50"
                                                )}
                                            >
                                                <TableCell className="font-mono text-sm">{item.sparepart.code}</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{item.sparepart.name}</p>
                                                        <p className="text-xs text-slate-500">{item.sparepart.category.name}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">{item.systemStock}</TableCell>
                                                <TableCell className="text-center">{item.physicalStock}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={cn(
                                                        "min-w-12 justify-center",
                                                        item.difference === 0 && "bg-green-100 text-green-700",
                                                        item.difference < 0 && "bg-yellow-100 text-yellow-700",
                                                        item.difference > 0 && "bg-red-100 text-red-700"
                                                    )}>
                                                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-500">
                                                    {item.notes || "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}
