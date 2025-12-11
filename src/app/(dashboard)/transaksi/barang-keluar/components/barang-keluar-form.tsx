"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stockOutSchema, type StockOutInput } from "@/lib/validations/stock-out";
import { Loader2, Search, Package, Camera, AlertTriangle } from "lucide-react";
import { BarcodeScanner } from "./barcode-scanner";
import { toast } from "sonner";

interface Sparepart {
    id: string;
    code: string;
    name: string;
    unit: string;
    currentStock: number;
    category: { name: string };
}

interface Equipment {
    id: string;
    code: string;
    name: string;
    type: string;
}

interface Employee {
    id: string;
    nik: string;
    name: string;
    position: string;
}

interface BarangKeluarFormProps {
    onSubmit: (data: StockOutInput) => Promise<void>;
    isLoading: boolean;
}

export function BarangKeluarForm({ onSubmit, isLoading }: BarangKeluarFormProps) {
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
    const [sparepartSearch, setSparepartSearch] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedSparepart, setSelectedSparepart] = useState<Sparepart | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);

    const form = useForm<StockOutInput>({
        resolver: zodResolver(stockOutSchema),
        defaultValues: {
            sparepartId: "",
            equipmentId: "",
            employeeId: "",
            quantity: 1,
            purpose: "",
            scannedBarcode: "",
        },
    });

    const quantity = form.watch("quantity");

    useEffect(() => {
        fetchEquipments();
        fetchEmployees();
    }, []);

    const fetchEquipments = async () => {
        try {
            const response = await fetch("/api/master/alat-berat?limit=100&status=active");
            const result = await response.json();
            if (response.ok) {
                setEquipments(result.data);
            }
        } catch (error) {
            console.error("Error fetching equipments:", error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await fetch("/api/master/karyawan?limit=100&status=active");
            const result = await response.json();
            if (response.ok) {
                setEmployees(result.data);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    const searchSpareparts = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSpareparts([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`/api/master/sparepart?search=${encodeURIComponent(query)}&limit=10`);
            const result = await response.json();
            if (response.ok) {
                setSpareparts(result.data);
                setShowDropdown(true);
            }
        } catch (error) {
            console.error("Error searching spareparts:", error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const fetchSparepartByCode = async (code: string) => {
        try {
            const response = await fetch(`/api/master/sparepart?search=${encodeURIComponent(code)}&limit=1`);
            const result = await response.json();
            if (response.ok && result.data.length > 0) {
                const sp = result.data[0];
                if (sp.code === code) {
                    handleSelectSparepart(sp);
                    toast.success(`Sparepart ditemukan: ${sp.name}`);
                } else {
                    toast.error("Sparepart dengan kode tersebut tidak ditemukan");
                }
            } else {
                toast.error("Sparepart tidak ditemukan");
            }
        } catch (error) {
            console.error("Error fetching sparepart by code:", error);
            toast.error("Gagal mencari sparepart");
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (sparepartSearch) {
                searchSpareparts(sparepartSearch);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [sparepartSearch, searchSpareparts]);

    const handleSelectSparepart = (sparepart: Sparepart) => {
        setSelectedSparepart(sparepart);
        form.setValue("sparepartId", sparepart.id);
        setSparepartSearch(sparepart.name);
        setShowDropdown(false);
    };

    const handleBarcodeScan = (code: string) => {
        form.setValue("scannedBarcode", code);
        setSparepartSearch(code);
        fetchSparepartByCode(code);
    };

    const handleSubmit = async (data: StockOutInput) => {
        await onSubmit(data);
    };

    const isStockInsufficient = selectedSparepart && quantity > selectedSparepart.currentStock;

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Barang Keluar</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Scan Barcode Button */}
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setScannerOpen(true)}
                                    className="flex-1"
                                >
                                    <Camera className="mr-2 h-4 w-4" />
                                    Scan Barcode
                                </Button>
                            </div>

                            {/* Sparepart Search */}
                            <div className="space-y-2">
                                <FormLabel>Sparepart *</FormLabel>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        placeholder="Cari kode atau nama sparepart..."
                                        value={sparepartSearch}
                                        onChange={(e) => {
                                            setSparepartSearch(e.target.value);
                                            if (!e.target.value) {
                                                setSelectedSparepart(null);
                                                form.setValue("sparepartId", "");
                                            }
                                        }}
                                        onFocus={() => sparepartSearch && setShowDropdown(true)}
                                        className="pl-9"
                                    />
                                    {isSearching && (
                                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                                    )}

                                    {/* Dropdown Results */}
                                    {showDropdown && spareparts.length > 0 && (
                                        <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto">
                                            {spareparts.map((sp) => (
                                                <button
                                                    key={sp.id}
                                                    type="button"
                                                    className="w-full px-4 py-2 text-left hover:bg-slate-100 flex items-center justify-between"
                                                    onClick={() => handleSelectSparepart(sp)}
                                                >
                                                    <div>
                                                        <p className="font-medium">{sp.name}</p>
                                                        <p className="text-sm text-slate-500">
                                                            {sp.code} • {sp.category.name}
                                                        </p>
                                                    </div>
                                                    <span className={`text-sm ${sp.currentStock <= 0 ? 'text-red-600' : 'text-slate-600'}`}>
                                                        Stok: {sp.currentStock} {sp.unit}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {form.formState.errors.sparepartId && (
                                    <p className="text-sm text-red-500">{form.formState.errors.sparepartId.message}</p>
                                )}
                            </div>

                            {/* Selected Sparepart Preview */}
                            {selectedSparepart && (
                                <div className={`p-4 rounded-lg border ${isStockInsufficient ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isStockInsufficient ? 'bg-red-100' : 'bg-blue-100'}`}>
                                            <Package className={`h-6 w-6 ${isStockInsufficient ? 'text-red-600' : 'text-blue-600'}`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-semibold ${isStockInsufficient ? 'text-red-900' : 'text-blue-900'}`}>
                                                {selectedSparepart.name}
                                            </p>
                                            <p className={`text-sm ${isStockInsufficient ? 'text-red-700' : 'text-blue-700'}`}>
                                                Kode: {selectedSparepart.code} • Kategori: {selectedSparepart.category.name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm ${isStockInsufficient ? 'text-red-600' : 'text-blue-600'}`}>Stok Tersedia</p>
                                            <p className={`font-bold ${isStockInsufficient ? 'text-red-900' : 'text-blue-900'}`}>
                                                {selectedSparepart.currentStock} {selectedSparepart.unit}
                                            </p>
                                        </div>
                                    </div>
                                    {isStockInsufficient && (
                                        <div className="mt-3 flex items-center gap-2 text-red-700">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-sm font-medium">Stok tidak mencukupi!</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Jumlah *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="equipmentId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unit Alat Berat *</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih unit" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {equipments.map((eq) => (
                                                        <SelectItem key={eq.id} value={eq.id}>
                                                            {eq.code} - {eq.name} ({eq.type})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="employeeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pemohon/Karyawan *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih karyawan" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {employees.map((emp) => (
                                                    <SelectItem key={emp.id} value={emp.id}>
                                                        {emp.nik} - {emp.name} ({emp.position})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="purpose"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Keperluan</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Keperluan pengambilan sparepart..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button type="submit" disabled={isLoading || !!isStockInsufficient}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    </div>
                </form>
            </Form>

            <BarcodeScanner
                open={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onScan={handleBarcodeScan}
            />
        </>
    );
}
