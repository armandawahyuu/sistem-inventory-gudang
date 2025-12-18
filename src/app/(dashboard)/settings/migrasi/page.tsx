"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
    Database,
    FileSpreadsheet,
    Settings2,
    ClipboardCheck,
    Play,
    Rocket,
    AlertTriangle,
    ExternalLink,
    CheckCircle2,
    Save
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ChecklistItem {
    id: string;
    label: string;
    link?: string;
    hasInput?: boolean;
    inputType?: "number" | "date" | "text";
    inputPlaceholder?: string;
    suffix?: string;
}

interface ChecklistSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    color: string;
    items: ChecklistItem[];
}

const CHECKLIST_SECTIONS: ChecklistSection[] = [
    {
        id: "pre",
        title: "Pre-Migration",
        icon: <FileSpreadsheet className="h-5 w-5" />,
        color: "bg-slate-500",
        items: [
            { id: "pre-1", label: "Backup semua file Excel" },
            { id: "pre-2", label: "Audit struktur data Excel" },
            { id: "pre-3", label: "Mapping kolom Excel → Database" },
            { id: "pre-4", label: "Bersihkan data di Excel (hapus duplikat, fix typo)" },
            { id: "pre-5", label: "Siapkan template import", link: "/settings/import" },
        ],
    },
    {
        id: "migration",
        title: "Migration",
        icon: <Database className="h-5 w-5" />,
        color: "bg-blue-500",
        items: [
            { id: "mig-1", label: "Import Kategori", link: "/settings/import", hasInput: true, inputType: "number", inputPlaceholder: "Jumlah" },
            { id: "mig-2", label: "Import Supplier", link: "/settings/import", hasInput: true, inputType: "number", inputPlaceholder: "Jumlah" },
            { id: "mig-3", label: "Import Alat Berat", link: "/settings/import", hasInput: true, inputType: "number", inputPlaceholder: "Jumlah" },
            { id: "mig-4", label: "Import Karyawan", link: "/settings/import", hasInput: true, inputType: "number", inputPlaceholder: "Jumlah" },
            { id: "mig-5", label: "Import Sparepart", link: "/settings/import", hasInput: true, inputType: "number", inputPlaceholder: "Jumlah" },
            { id: "mig-6", label: "Import Stok Awal", link: "/settings/import", hasInput: true, inputType: "number", inputPlaceholder: "Jumlah" },
        ],
    },
    {
        id: "validation",
        title: "Validation",
        icon: <Settings2 className="h-5 w-5" />,
        color: "bg-orange-500",
        items: [
            { id: "val-1", label: "Cek duplikat", link: "/settings/cleanup", suffix: "CLEAR" },
            { id: "val-2", label: "Cek data kosong", link: "/settings/cleanup", suffix: "CLEAR" },
            { id: "val-3", label: "Cek referensi", link: "/settings/cleanup", suffix: "CLEAR" },
            { id: "val-4", label: "Stok sistem = Stok fisik", link: "/transaksi/stok-opname", suffix: "VERIFIED" },
            { id: "val-5", label: "User sign-off", suffix: "APPROVED" },
        ],
    },
    {
        id: "golive",
        title: "Go Live",
        icon: <Rocket className="h-5 w-5" />,
        color: "bg-green-500",
        items: [
            { id: "go-1", label: "Parallel run 1 minggu", suffix: "DONE" },
            { id: "go-2", label: "Training user", suffix: "DONE" },
            { id: "go-3", label: "Go live date", hasInput: true, inputType: "date" },
            { id: "go-4", label: "Excel archived", hasInput: true, inputType: "date" },
        ],
    },
];

const STORAGE_KEY = "migration-checklist";

interface ChecklistState {
    completed: string[];
    inputs: Record<string, string>;
}

export default function MigrasiPage() {
    const [state, setState] = useState<ChecklistState>({ completed: [], inputs: {} });
    const [saved, setSaved] = useState(false);

    // Load from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setState(JSON.parse(stored));
            } catch (e) {
                console.error("Error loading checklist state:", e);
            }
        }
    }, []);

    // Save to localStorage
    const saveState = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const toggleItem = (id: string) => {
        setState((prev) => {
            const completed = prev.completed.includes(id)
                ? prev.completed.filter((i) => i !== id)
                : [...prev.completed, id];
            return { ...prev, completed };
        });
    };

    const updateInput = (id: string, value: string) => {
        setState((prev) => ({
            ...prev,
            inputs: { ...prev.inputs, [id]: value },
        }));
    };

    const totalItems = CHECKLIST_SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
    const completedCount = state.completed.length;
    const progress = Math.round((completedCount / totalItems) * 100);

    const getSectionProgress = (section: ChecklistSection) => {
        const completed = section.items.filter((i) => state.completed.includes(i.id)).length;
        return { completed, total: section.items.length };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                        <Database className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Checklist Migrasi</h1>
                        <p className="text-slate-600 mt-1">Tracking progress migrasi dari Excel ke sistem baru</p>
                    </div>
                </div>
                <Button onClick={saveState} className={cn(saved && "bg-green-600")}>
                    {saved ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {saved ? "Tersimpan!" : "Simpan Progress"}
                </Button>
            </div>

            {/* Overall Progress */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Progress Migrasi</span>
                        <span className="text-sm font-bold text-blue-700">{completedCount}/{totalItems} ({progress}%)</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                </CardContent>
            </Card>

            {/* Warning */}
            <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                    <strong>Penting:</strong> Progress checklist disimpan di browser lokal. Klik "Simpan Progress" untuk menyimpan.
                </AlertDescription>
            </Alert>

            {/* Sections */}
            <div className="grid gap-4">
                {CHECKLIST_SECTIONS.map((section) => {
                    const sectionProgress = getSectionProgress(section);
                    const isComplete = sectionProgress.completed === sectionProgress.total;

                    return (
                        <Card key={section.id} className={cn(isComplete && "border-green-300 bg-green-50/30")}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-white", section.color)}>
                                        {isComplete ? <CheckCircle2 className="h-5 w-5" /> : section.icon}
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="flex items-center gap-2">
                                            {section.title}
                                            {isComplete && <Badge className="bg-green-100 text-green-700">Complete</Badge>}
                                        </CardTitle>
                                        <CardDescription>{sectionProgress.completed}/{sectionProgress.total} selesai</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {section.items.map((item) => {
                                        const isCompleted = state.completed.includes(item.id);
                                        return (
                                            <div
                                                key={item.id}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                                                    isCompleted ? "bg-green-50 border-green-200" : "bg-white border-slate-200 hover:bg-slate-50"
                                                )}
                                            >
                                                <Checkbox
                                                    checked={isCompleted}
                                                    onCheckedChange={() => toggleItem(item.id)}
                                                />
                                                <span className={cn("flex-1 text-sm", isCompleted && "text-green-700")}>
                                                    {item.label}
                                                    {isCompleted && item.suffix && (
                                                        <Badge className="ml-2 bg-green-100 text-green-700">{item.suffix}</Badge>
                                                    )}
                                                </span>
                                                {item.hasInput && (
                                                    <Input
                                                        type={item.inputType || "text"}
                                                        placeholder={item.inputPlaceholder}
                                                        value={state.inputs[item.id] || ""}
                                                        onChange={(e) => updateInput(item.id, e.target.value)}
                                                        className="w-32 h-8 text-sm"
                                                    />
                                                )}
                                                {item.link && (
                                                    <Link href={item.link}>
                                                        <Button variant="ghost" size="sm">
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Quick Links */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Links</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Link href="/settings/import">
                            <Button variant="outline" className="w-full justify-start">
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Import Data
                            </Button>
                        </Link>
                        <Link href="/settings/import/history">
                            <Button variant="outline" className="w-full justify-start">
                                <Database className="h-4 w-4 mr-2" />
                                History Import
                            </Button>
                        </Link>
                        <Link href="/settings/cleanup">
                            <Button variant="outline" className="w-full justify-start">
                                <Settings2 className="h-4 w-4 mr-2" />
                                Cleanup Data
                            </Button>
                        </Link>
                        <Link href="/transaksi/stok-opname">
                            <Button variant="outline" className="w-full justify-start">
                                <ClipboardCheck className="h-4 w-4 mr-2" />
                                Stok Opname
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
