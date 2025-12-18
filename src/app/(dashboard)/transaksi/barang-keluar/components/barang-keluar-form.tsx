"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, Search, Package, Camera, Trash2, Plus, ShoppingCart, AlertTriangle } from "lucide-react";
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

interface CartItem {
    sparepart: Sparepart;
    quantity: number;
    scannedBarcode?: string;
}

interface BarangKeluarFormProps {
    onSubmit: (items: { sparepartId: string; quantity: number; scannedBarcode?: string }[], equipmentId: string, employeeId: string, purpose: string) => Promise<void>;
    isLoading: boolean;
}

export function BarangKeluarForm({ onSubmit, isLoading }: BarangKeluarFormProps) {
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
    const [sparepartSearch, setSparepartSearch] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);

    // Cart state
    const [cart, setCart] = useState<CartItem[]>([]);
    const [equipmentId, setEquipmentId] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [purpose, setPurpose] = useState("");

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
                    addToCart(sp, code);
                    toast.success(`Ditambahkan: ${sp.name}`);
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

    const addToCart = (sparepart: Sparepart, scannedBarcode?: string) => {
        setCart(prev => {
            // Check if item already exists
            const existingIndex = prev.findIndex(item => item.sparepart.id === sparepart.id);

            if (existingIndex >= 0) {
                // Increment quantity
                const updated = [...prev];
                const newQty = updated[existingIndex].quantity + 1;

                // Check stock
                if (newQty > sparepart.currentStock) {
                    toast.error(`Stok tidak mencukupi! Tersedia: ${sparepart.currentStock} ${sparepart.unit}`);
                    return prev;
                }

                updated[existingIndex].quantity = newQty;
                return updated;
            } else {
                // Add new item
                if (sparepart.currentStock < 1) {
                    toast.error(`Stok tidak tersedia untuk ${sparepart.name}`);
                    return prev;
                }

                return [...prev, { sparepart, quantity: 1, scannedBarcode }];
            }
        });

        setSparepartSearch("");
        setShowDropdown(false);
    };

    const updateQuantity = (index: number, newQuantity: number) => {
        if (newQuantity < 1) return;

        setCart(prev => {
            const updated = [...prev];
            const item = updated[index];

            if (newQuantity > item.sparepart.currentStock) {
                toast.error(`Stok tidak mencukupi! Tersedia: ${item.sparepart.currentStock} ${item.sparepart.unit}`);
                return prev;
            }

            updated[index].quantity = newQuantity;
            return updated;
        });
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const handleBarcodeScan = (code: string) => {
        fetchSparepartByCode(code);
    };

    const handleSubmit = async () => {
        if (cart.length === 0) {
            toast.error("Keranjang kosong! Scan atau pilih sparepart terlebih dahulu.");
            return;
        }

        if (!equipmentId) {
            toast.error("Pilih unit alat berat terlebih dahulu.");
            return;
        }

        if (!employeeId) {
            toast.error("Pilih pemohon/karyawan terlebih dahulu.");
            return;
        }

        const items = cart.map(item => ({
            sparepartId: item.sparepart.id,
            quantity: item.quantity,
            scannedBarcode: item.scannedBarcode,
        }));

        await onSubmit(items, equipmentId, employeeId, purpose);

        // Clear cart after successful submit
        setCart([]);
        setPurpose("");
    };

    const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <>
            <div className="space-y-6">
                {/* Scanner & Search Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Scan / Tambah Barang
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Scan Barcode Button */}
                        <Button
                            type="button"
                            variant="default"
                            size="lg"
                            onClick={() => setScannerOpen(true)}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            <Camera className="mr-2 h-5 w-5" />
                            Scan Barcode
                        </Button>

                        {/* Manual Search */}
                        <div className="space-y-2">
                            <Label>Atau cari manual</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Ketik kode atau nama sparepart..."
                                    value={sparepartSearch}
                                    onChange={(e) => setSparepartSearch(e.target.value)}
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
                                                onClick={() => addToCart(sp)}
                                            >
                                                <div>
                                                    <p className="font-medium">{sp.name}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {sp.code} • {sp.category.name}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm ${sp.currentStock <= 0 ? 'text-red-600' : 'text-slate-600'}`}>
                                                        Stok: {sp.currentStock} {sp.unit}
                                                    </span>
                                                    <Plus className="h-4 w-4 text-blue-600" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Cart Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Keranjang ({cart.length} jenis, {getTotalItems()} item)
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {cart.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                <p>Keranjang kosong</p>
                                <p className="text-sm">Scan barcode atau cari sparepart untuk menambahkan</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sparepart</TableHead>
                                        <TableHead className="text-center w-32">Jumlah</TableHead>
                                        <TableHead className="text-center w-24">Stok</TableHead>
                                        <TableHead className="w-16"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cart.map((item, index) => (
                                        <TableRow key={item.sparepart.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{item.sparepart.name}</p>
                                                    <p className="text-sm text-slate-500">{item.sparepart.code}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => updateQuantity(index, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        -
                                                    </Button>
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                                                        className="w-16 h-8 text-center"
                                                        min="1"
                                                        max={item.sparepart.currentStock}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => updateQuantity(index, item.quantity + 1)}
                                                        disabled={item.quantity >= item.sparepart.currentStock}
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={item.quantity > item.sparepart.currentStock ? 'text-red-600 font-medium' : 'text-slate-600'}>
                                                    {item.sparepart.currentStock} {item.sparepart.unit}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeFromCart(index)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Equipment, Employee & Purpose */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Pengambilan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Unit Alat Berat *</Label>
                                <Select value={equipmentId} onValueChange={setEquipmentId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {equipments.map((eq) => (
                                            <SelectItem key={eq.id} value={eq.id}>
                                                {eq.code} - {eq.name} ({eq.type})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Pemohon/Karyawan *</Label>
                                <Select value={employeeId} onValueChange={setEmployeeId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih karyawan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id}>
                                                {emp.nik} - {emp.name} ({emp.position})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Keperluan</Label>
                            <Textarea
                                placeholder="Keperluan pengambilan sparepart..."
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                className="resize-none"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading || cart.length === 0 || !equipmentId || !employeeId}
                        size="lg"
                        className="min-w-40"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Request ({getTotalItems()} item)
                    </Button>
                </div>
            </div>

            <BarcodeScanner
                open={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onScan={handleBarcodeScan}
            />
        </>
    );
}
