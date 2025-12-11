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
import { stockInSchema, type StockInInput } from "@/lib/validations/stock-in";
import { Loader2, Search, Package } from "lucide-react";

interface Sparepart {
    id: string;
    code: string;
    name: string;
    unit: string;
    currentStock: number;
    category: { name: string };
}

interface Supplier {
    id: string;
    name: string;
}

interface BarangMasukFormProps {
    onSubmit: (data: StockInInput) => Promise<void>;
    isLoading: boolean;
}

export function BarangMasukForm({ onSubmit, isLoading }: BarangMasukFormProps) {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
    const [sparepartSearch, setSparepartSearch] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedSparepart, setSelectedSparepart] = useState<Sparepart | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    const form = useForm<StockInInput>({
        resolver: zodResolver(stockInSchema),
        defaultValues: {
            sparepartId: "",
            quantity: 1,
            supplierId: "",
            invoiceNumber: "",
            purchasePrice: null,
            warrantyExpiry: "",
            notes: "",
        },
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await fetch("/api/master/supplier?limit=100");
            const result = await response.json();
            if (response.ok) {
                setSuppliers(result.data);
            }
        } catch (error) {
            console.error("Error fetching suppliers:", error);
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

    const handleSubmit = async (data: StockInInput) => {
        await onSubmit(data);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Barang Masuk</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                                                <span className="text-sm text-slate-600">
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
                            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Package className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-blue-900">{selectedSparepart.name}</p>
                                        <p className="text-sm text-blue-700">
                                            Kode: {selectedSparepart.code} • Kategori: {selectedSparepart.category.name}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-blue-600">Stok Saat Ini</p>
                                        <p className="font-bold text-blue-900">
                                            {selectedSparepart.currentStock} {selectedSparepart.unit}
                                        </p>
                                    </div>
                                </div>
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
                                name="supplierId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Supplier</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih supplier" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="all">Tidak ada</SelectItem>
                                                {suppliers.map((sup) => (
                                                    <SelectItem key={sup.id} value={sup.id}>
                                                        {sup.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="invoiceNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>No. Invoice</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nomor invoice/surat jalan" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="warrantyExpiry"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Garansi Expired</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Catatan</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Catatan tambahan..."
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
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan
                    </Button>
                </div>
            </form>
        </Form>
    );
}
