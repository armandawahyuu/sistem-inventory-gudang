"use client";

import { useState, useEffect } from "react";
import { Download, FileSpreadsheet, Loader2, Shield, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Warranty {
    id: string;
    expiryDate: string;
    claimedAt: string | null;
    claimReason: string | null;
    daysRemaining: number;
    warrantyStatus: string;
    sparepart: { code: string; name: string };
    stockIn: { date: string; supplier: { name: string } | null };
}

interface Counts {
    active: number;
    expiring: number;
    expired: number;
    claimed: number;
}

export default function LaporanGaransiPage() {
    const [warranties, setWarranties] = useState<Warranty[]>([]);
    const [counts, setCounts] = useState<Counts>({ active: 0, expiring: 0, expired: 0, claimed: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("active");

    // Claim dialog
    const [claimOpen, setClaimOpen] = useState(false);
    const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
    const [claimReason, setClaimReason] = useState("");
    const [isClaiming, setIsClaiming] = useState(false);

    useEffect(() => {
        fetchWarranties();
    }, [activeTab]);

    const fetchWarranties = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/laporan/garansi?status=${activeTab}`);
            const result = await response.json();

            if (response.ok) {
                setWarranties(result.data);
                setCounts(result.counts);
            } else {
                toast.error(result.error || "Gagal memuat data");
            }
        } catch (error) {
            console.error("Error fetching warranties:", error);
            toast.error("Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClaimClick = (warranty: Warranty) => {
        setSelectedWarranty(warranty);
        setClaimReason("");
        setClaimOpen(true);
    };

    const handleClaim = async () => {
        if (!selectedWarranty) return;

        setIsClaiming(true);
        try {
            const response = await fetch(`/api/laporan/garansi/${selectedWarranty.id}/claim`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ claimReason }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message);
                setClaimOpen(false);
                fetchWarranties();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setIsClaiming(false);
        }
    };

    const handleExportExcel = () => {
        if (warranties.length === 0) {
            toast.error("Tidak ada data untuk diexport");
            return;
        }

        const data = [
            ["LAPORAN GARANSI"],
            [`Status: ${getTabLabel(activeTab)}`],
            [`Tanggal: ${new Date().toLocaleDateString("id-ID")}`],
            [],
            ["Kode Sparepart", "Nama Sparepart", "Supplier", "Tgl Beli", "Tgl Expired", "Sisa Hari", "Status"],
            ...warranties.map(w => [
                w.sparepart.code,
                w.sparepart.name,
                w.stockIn.supplier?.name || "-",
                formatDate(w.stockIn.date),
                formatDate(w.expiryDate),
                w.daysRemaining,
                getStatusLabel(w.warrantyStatus),
            ]),
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Garansi");

        XLSX.writeFile(wb, `laporan_garansi_${activeTab}_${new Date().toISOString().split("T")[0]}.xlsx`);
        toast.success("Laporan berhasil diexport");
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getTabLabel = (tab: string) => {
        switch (tab) {
            case "active": return "Aktif";
            case "expiring": return "Akan Expired";
            case "expired": return "Sudah Expired";
            case "claimed": return "Diklaim";
            default: return tab;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "active": return "Aktif";
            case "expiring": return "Akan Expired";
            case "expired": return "Sudah Expired";
            case "claimed": return "Diklaim";
            default: return status;
        }
    };

    const getStatusBadge = (status: string, daysRemaining: number) => {
        switch (status) {
            case "active":
                return <Badge className="bg-green-100 text-green-800">Aktif</Badge>;
            case "expiring":
                return <Badge className="bg-yellow-100 text-yellow-800">H-{daysRemaining}</Badge>;
            case "expired":
                return <Badge variant="destructive">Expired</Badge>;
            case "claimed":
                return <Badge className="bg-blue-100 text-blue-800">Diklaim</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Laporan Garansi</h1>
                    <p className="text-slate-600 mt-1">Monitoring status garansi sparepart</p>
                </div>
                <Button variant="outline" onClick={handleExportExcel} disabled={warranties.length === 0}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export Excel
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="active" className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Aktif ({counts.active})
                    </TabsTrigger>
                    <TabsTrigger value="expiring" className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Akan Expired ({counts.expiring})
                    </TabsTrigger>
                    <TabsTrigger value="expired" className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Sudah Expired ({counts.expired})
                    </TabsTrigger>
                    <TabsTrigger value="claimed" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Diklaim ({counts.claimed})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar Garansi - {getTabLabel(activeTab)}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Sparepart</TableHead>
                                                <TableHead>Supplier</TableHead>
                                                <TableHead>Tgl Beli</TableHead>
                                                <TableHead>Tgl Expired</TableHead>
                                                <TableHead className="text-center">Sisa Hari</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {warranties.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                                                        Tidak ada data garansi
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                warranties.map((w) => (
                                                    <TableRow key={w.id} className={w.warrantyStatus === "expiring" ? "bg-yellow-50" : w.warrantyStatus === "expired" ? "bg-red-50" : ""}>
                                                        <TableCell>
                                                            <p className="font-medium">{w.sparepart.name}</p>
                                                            <p className="text-xs text-slate-500">{w.sparepart.code}</p>
                                                        </TableCell>
                                                        <TableCell>{w.stockIn.supplier?.name || "-"}</TableCell>
                                                        <TableCell>{formatDate(w.stockIn.date)}</TableCell>
                                                        <TableCell>{formatDate(w.expiryDate)}</TableCell>
                                                        <TableCell className="text-center">
                                                            <span className={w.daysRemaining < 0 ? "text-red-600 font-semibold" : w.daysRemaining <= 30 ? "text-yellow-600 font-semibold" : ""}>
                                                                {w.daysRemaining < 0 ? `${Math.abs(w.daysRemaining)} hari lalu` : `${w.daysRemaining} hari`}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(w.warrantyStatus, w.daysRemaining)}</TableCell>
                                                        <TableCell className="text-right">
                                                            {w.warrantyStatus !== "claimed" && w.daysRemaining >= 0 && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleClaimClick(w)}
                                                                >
                                                                    Klaim
                                                                </Button>
                                                            )}
                                                            {w.warrantyStatus === "claimed" && w.claimReason && (
                                                                <span className="text-xs text-slate-500">{w.claimReason}</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Claim Dialog */}
            <Dialog open={claimOpen} onOpenChange={setClaimOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Klaim Garansi</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedWarranty && (
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="font-medium">{selectedWarranty.sparepart.name}</p>
                                <p className="text-sm text-slate-500">{selectedWarranty.sparepart.code}</p>
                                <p className="text-sm text-slate-500 mt-1">Expired: {formatDate(selectedWarranty.expiryDate)}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Alasan Klaim</label>
                            <Textarea
                                value={claimReason}
                                onChange={(e) => setClaimReason(e.target.value)}
                                placeholder="Deskripsi kerusakan atau alasan klaim..."
                                className="resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setClaimOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleClaim} disabled={isClaiming}>
                            {isClaiming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Klaim Garansi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
