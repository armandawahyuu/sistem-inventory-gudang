"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Trash2,
    Search,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Copy,
    Settings2,
    FileWarning,
    Wand2,
    Link2Off
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DuplicateItem {
    id: string;
    name?: string;
    code?: string;
    nik?: string;
    [key: string]: unknown;
}

interface DuplicateGroup {
    value: string;
    count: number;
    items: DuplicateItem[];
}

interface DuplicateResult {
    type: string;
    field: string;
    totalDuplicateGroups: number;
    duplicates: DuplicateGroup[];
}

interface EmptyItem {
    id: string;
    type: string;
    name: string;
    emptyFields: string[];
}

interface EmptyResult {
    action: string;
    totalItems: number;
    items: EmptyItem[];
}

interface ReferenceIssue {
    type: string;
    issue: string;
    count: number;
    items: { id: string; name: string; relatedField: string }[];
}

interface ReferenceResult {
    action: string;
    totalIssues: number;
    totalAffected: number;
    issues: ReferenceIssue[];
}

interface StandardizeResult {
    message: string;
    results: {
        spareparts: number;
        equipments: number;
        employees: number;
        categories: number;
    };
    totalUpdated: number;
}

const TYPE_OPTIONS = [
    { value: "sparepart", label: "Sparepart", fields: ["name", "code"] },
    { value: "alat-berat", label: "Alat Berat", fields: ["name", "code"] },
    { value: "karyawan", label: "Karyawan", fields: ["name", "nik"] },
];

const FIELD_LABELS: Record<string, string> = {
    name: "Nama",
    code: "Kode",
    nik: "NIK",
    unit: "Satuan",
    type: "Tipe",
};

export default function CleanupPage() {
    // Duplicate search state
    const [selectedType, setSelectedType] = useState<string>("");
    const [selectedField, setSelectedField] = useState<string>("");
    const [loadingDuplicates, setLoadingDuplicates] = useState(false);
    const [duplicateResult, setDuplicateResult] = useState<DuplicateResult | null>(null);

    // Empty fields state
    const [loadingEmpty, setLoadingEmpty] = useState(false);
    const [emptyResult, setEmptyResult] = useState<EmptyResult | null>(null);

    // References state
    const [loadingReferences, setLoadingReferences] = useState(false);
    const [referenceResult, setReferenceResult] = useState<ReferenceResult | null>(null);

    // Standardize state
    const [loadingStandardize, setLoadingStandardize] = useState(false);
    const [standardizeResult, setStandardizeResult] = useState<StandardizeResult | null>(null);

    // Delete dialog
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; name: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Standardize dialog
    const [showStandardizeDialog, setShowStandardizeDialog] = useState(false);

    // Get available fields for selected type
    const availableFields = TYPE_OPTIONS.find((t) => t.value === selectedType)?.fields || [];

    // Search duplicates
    const searchDuplicates = async () => {
        if (!selectedType || !selectedField) return;
        setLoadingDuplicates(true);
        setDuplicateResult(null);
        try {
            const response = await fetch(`/api/cleanup?type=${selectedType}&field=${selectedField}`);
            const data = await response.json();
            if (response.ok) setDuplicateResult(data);
            else alert(data.error || "Gagal mencari duplikat");
        } catch (error) {
            console.error("Error:", error);
            alert("Terjadi kesalahan");
        } finally {
            setLoadingDuplicates(false);
        }
    };

    // Search empty fields
    const searchEmptyFields = async () => {
        setLoadingEmpty(true);
        setEmptyResult(null);
        try {
            const response = await fetch("/api/cleanup?action=empty");
            const data = await response.json();
            if (response.ok) setEmptyResult(data);
            else alert(data.error || "Gagal scan data kosong");
        } catch (error) {
            console.error("Error:", error);
            alert("Terjadi kesalahan");
        } finally {
            setLoadingEmpty(false);
        }
    };

    // Check references
    const checkReferences = async () => {
        setLoadingReferences(true);
        setReferenceResult(null);
        try {
            const response = await fetch("/api/cleanup?action=references");
            const data = await response.json();
            if (response.ok) setReferenceResult(data);
            else alert(data.error || "Gagal cek referensi");
        } catch (error) {
            console.error("Error:", error);
            alert("Terjadi kesalahan");
        } finally {
            setLoadingReferences(false);
        }
    };

    // Execute standardize
    const executeStandardize = async () => {
        setShowStandardizeDialog(false);
        setLoadingStandardize(true);
        setStandardizeResult(null);
        try {
            const response = await fetch("/api/cleanup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "standardize" }),
            });
            const data = await response.json();
            if (response.ok) setStandardizeResult(data);
            else alert(data.error || "Gagal standardisasi");
        } catch (error) {
            console.error("Error:", error);
            alert("Terjadi kesalahan");
        } finally {
            setLoadingStandardize(false);
        }
    };

    // Confirm delete
    const confirmDelete = (type: string, id: string, name: string) => {
        setItemToDelete({ type, id, name });
        setShowDeleteDialog(true);
    };

    // Execute delete
    const executeDelete = async () => {
        if (!itemToDelete) return;
        setDeleting(true);
        try {
            const response = await fetch("/api/cleanup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "delete",
                    type: itemToDelete.type,
                    id: itemToDelete.id,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                // Refresh based on context
                if (duplicateResult) searchDuplicates();
                if (referenceResult) checkReferences();
                setShowDeleteDialog(false);
            } else {
                alert(data.error || "Gagal menghapus");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Terjadi kesalahan");
        } finally {
            setDeleting(false);
        }
    };

    const getItemDisplayName = (item: DuplicateItem): string => {
        return item.name || item.code || item.nik || item.id;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                    <Settings2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Cleanup Data</h1>
                    <p className="text-slate-600 mt-1">
                        Tools untuk membersihkan data setelah migrasi
                    </p>
                </div>
            </div>

            {/* Warning */}
            <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                    <strong>Perhatian:</strong> Semua aksi cleanup akan di-log. Backup data sebelum cleanup.
                </AlertDescription>
            </Alert>

            {/* Tabs */}
            <Tabs defaultValue="duplicates" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="duplicates" className="flex items-center gap-2">
                        <Copy className="h-4 w-4" />
                        Duplikat
                    </TabsTrigger>
                    <TabsTrigger value="empty" className="flex items-center gap-2">
                        <FileWarning className="h-4 w-4" />
                        Data Kosong
                    </TabsTrigger>
                    <TabsTrigger value="references" className="flex items-center gap-2">
                        <Link2Off className="h-4 w-4" />
                        Referensi
                    </TabsTrigger>
                    <TabsTrigger value="standardize" className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4" />
                        Standardisasi
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Cari Duplikat */}
                <TabsContent value="duplicates">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Copy className="h-5 w-5" />
                                Cari Duplikat
                            </CardTitle>
                            <CardDescription>
                                Temukan data duplikat berdasarkan field tertentu
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-64">
                                    <label className="text-sm font-medium mb-2 block">Tipe Data</label>
                                    <Select
                                        value={selectedType}
                                        onValueChange={(val) => { setSelectedType(val); setSelectedField(""); setDuplicateResult(null); }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih tipe data" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TYPE_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-64">
                                    <label className="text-sm font-medium mb-2 block">Field</label>
                                    <Select value={selectedField} onValueChange={setSelectedField} disabled={!selectedType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih field" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableFields.map((field) => (
                                                <SelectItem key={field} value={field}>{FIELD_LABELS[field] || field}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end">
                                    <Button onClick={searchDuplicates} disabled={!selectedType || !selectedField || loadingDuplicates}>
                                        {loadingDuplicates ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                                        Cari
                                    </Button>
                                </div>
                            </div>

                            {duplicateResult && (
                                <div className="space-y-4 pt-4 border-t">
                                    <Badge className={duplicateResult.totalDuplicateGroups === 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                        {duplicateResult.totalDuplicateGroups === 0 ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Tidak ada duplikat</> : <><AlertTriangle className="h-3 w-3 mr-1" /> {duplicateResult.totalDuplicateGroups} grup duplikat</>}
                                    </Badge>

                                    {duplicateResult.duplicates.length > 0 && (
                                        <ScrollArea className="h-[350px]">
                                            <div className="space-y-4">
                                                {duplicateResult.duplicates.map((group, idx) => (
                                                    <Card key={idx} className="border-red-200 bg-red-50">
                                                        <CardHeader className="py-3">
                                                            <CardTitle className="text-base">
                                                                Duplikat: "{group.value}" <Badge variant="destructive">{group.count}</Badge>
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="py-2">
                                                            <Table>
                                                                <TableBody>
                                                                    {group.items.map((item: DuplicateItem, itemIdx: number) => (
                                                                        <TableRow key={item.id} className={cn(itemIdx === 0 && "bg-white")}>
                                                                            <TableCell className="font-mono text-xs w-32">{item.id.slice(0, 8)}...</TableCell>
                                                                            <TableCell>{item.name || "-"}</TableCell>
                                                                            <TableCell>{item.code || item.nik || "-"}</TableCell>
                                                                            <TableCell className="text-right">
                                                                                {itemIdx === 0 ? (
                                                                                    <Badge className="bg-blue-100 text-blue-700">Pertahankan</Badge>
                                                                                ) : (
                                                                                    <Button variant="destructive" size="sm" onClick={() => confirmDelete(selectedType, item.id, getItemDisplayName(item))}>
                                                                                        <Trash2 className="h-3 w-3 mr-1" /> Hapus
                                                                                    </Button>
                                                                                )}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Data Kosong */}
                <TabsContent value="empty">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileWarning className="h-5 w-5" />
                                Data Kosong
                            </CardTitle>
                            <CardDescription>Scan field wajib yang kosong</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button onClick={searchEmptyFields} disabled={loadingEmpty}>
                                {loadingEmpty ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                                Scan Data Kosong
                            </Button>

                            {emptyResult && (
                                <div className="space-y-4 pt-4 border-t">
                                    <Badge className={emptyResult.totalItems === 0 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                                        {emptyResult.totalItems === 0 ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Semua data lengkap</> : <><AlertTriangle className="h-3 w-3 mr-1" /> {emptyResult.totalItems} data tidak lengkap</>}
                                    </Badge>

                                    {emptyResult.items.length > 0 && (
                                        <ScrollArea className="h-[350px]">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Tipe</TableHead>
                                                        <TableHead>Nama</TableHead>
                                                        <TableHead>Field Kosong</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {emptyResult.items.map((item) => (
                                                        <TableRow key={item.id} className="bg-yellow-50">
                                                            <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                                                            <TableCell>{item.name}</TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-1 flex-wrap">
                                                                    {item.emptyFields.map((field) => (
                                                                        <Badge key={field} className="bg-yellow-100 text-yellow-700">{FIELD_LABELS[field] || field}</Badge>
                                                                    ))}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Validasi Referensi */}
                <TabsContent value="references">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Link2Off className="h-5 w-5" />
                                Validasi Referensi
                            </CardTitle>
                            <CardDescription>Cek data dengan referensi yang tidak valid</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button onClick={checkReferences} disabled={loadingReferences}>
                                {loadingReferences ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                                Cek Referensi
                            </Button>

                            {referenceResult && (
                                <div className="space-y-4 pt-4 border-t">
                                    <Badge className={referenceResult.totalIssues === 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                        {referenceResult.totalIssues === 0 ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Semua referensi valid</> : <><AlertTriangle className="h-3 w-3 mr-1" /> {referenceResult.totalAffected} data bermasalah</>}
                                    </Badge>

                                    {referenceResult.issues.length > 0 && (
                                        <ScrollArea className="h-[350px]">
                                            <div className="space-y-4">
                                                {referenceResult.issues.map((issue, idx) => (
                                                    <Card key={idx} className="border-red-200 bg-red-50">
                                                        <CardHeader className="py-3">
                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                <Link2Off className="h-4 w-4 text-red-600" />
                                                                {issue.type}: {issue.issue}
                                                                <Badge variant="destructive">{issue.count}</Badge>
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="py-2">
                                                            <Table>
                                                                <TableBody>
                                                                    {issue.items.map((item) => (
                                                                        <TableRow key={item.id}>
                                                                            <TableCell className="font-mono text-xs">{item.id.slice(0, 8)}...</TableCell>
                                                                            <TableCell>{item.name}</TableCell>
                                                                            <TableCell className="text-red-600 text-xs">Ref: {item.relatedField.slice(0, 8)}...</TableCell>
                                                                            <TableCell className="text-right">
                                                                                <Button variant="destructive" size="sm" onClick={() => confirmDelete(issue.type, item.id, item.name)}>
                                                                                    <Trash2 className="h-3 w-3 mr-1" /> Hapus
                                                                                </Button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Standardisasi */}
                <TabsContent value="standardize">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wand2 className="h-5 w-5" />
                                Standardisasi Data
                            </CardTitle>
                            <CardDescription>Otomatis memperbaiki format data</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                <p className="text-sm font-medium">Preview - Yang akan dilakukan:</p>
                                <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                                    <li>Ubah kode sparepart & alat berat → UPPERCASE</li>
                                    <li>Ubah NIK karyawan → UPPERCASE</li>
                                    <li>Trim whitespace dari semua nama</li>
                                </ul>
                            </div>

                            <Button onClick={() => setShowStandardizeDialog(true)} disabled={loadingStandardize}>
                                {loadingStandardize ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                                Jalankan Standardisasi
                            </Button>

                            {standardizeResult && (
                                <Alert className="bg-green-50 border-green-200">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-800">
                                        <strong>Selesai!</strong> {standardizeResult.totalUpdated} record diupdate
                                        <div className="mt-2 grid grid-cols-2 gap-1 text-sm">
                                            <span>Sparepart:</span><span className="font-medium">{standardizeResult.results.spareparts}</span>
                                            <span>Alat Berat:</span><span className="font-medium">{standardizeResult.results.equipments}</span>
                                            <span>Karyawan:</span><span className="font-medium">{standardizeResult.results.employees}</span>
                                            <span>Kategori:</span><span className="font-medium">{standardizeResult.results.categories}</span>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Delete Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" /> Konfirmasi Hapus
                        </DialogTitle>
                        <DialogDescription className="pt-4">
                            <p className="mb-4">Hapus: <strong>{itemToDelete?.name}</strong></p>
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>Tindakan ini tidak dapat dibatalkan dan akan di-log.</AlertDescription>
                            </Alert>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Batal</Button>
                        <Button variant="destructive" onClick={executeDelete} disabled={deleting}>
                            {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Ya, Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Standardize Dialog */}
            <Dialog open={showStandardizeDialog} onOpenChange={setShowStandardizeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wand2 className="h-5 w-5 text-blue-600" /> Konfirmasi Standardisasi
                        </DialogTitle>
                        <DialogDescription className="pt-4">
                            <p className="mb-4">Proses ini akan mengubah format data dan di-log.</p>
                            <Alert className="bg-blue-50 border-blue-200">
                                <AlertTriangle className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-800">Pastikan sudah backup data.</AlertDescription>
                            </Alert>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowStandardizeDialog(false)}>Batal</Button>
                        <Button onClick={executeStandardize}>
                            <Wand2 className="h-4 w-4 mr-2" /> Ya, Jalankan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
