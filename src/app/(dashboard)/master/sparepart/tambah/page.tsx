"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sparepartSchema, UNIT_OPTIONS, type SparepartInput } from "@/lib/validations/sparepart";
import { EQUIPMENT_TYPES } from "@/lib/validations/alat-berat";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Category {
    id: string;
    name: string;
}

interface Compatibility {
    equipmentType: string;
    equipmentBrand: string;
    equipmentModel: string;
}

export default function TambahSparepartPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [compatibilities, setCompatibilities] = useState<Compatibility[]>([]);
    const [newCompat, setNewCompat] = useState<Compatibility>({
        equipmentType: "",
        equipmentBrand: "",
        equipmentModel: "",
    });

    const form = useForm({
        resolver: zodResolver(sparepartSchema),
        defaultValues: {
            code: "",
            name: "",
            categoryId: "",
            brand: "",
            unit: "",
            minStock: 0,
            rackLocation: "",
        },
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch("/api/master/kategori?limit=100");
            const result = await response.json();
            if (response.ok) {
                setCategories(result.data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const addCompatibility = () => {
        if (!newCompat.equipmentType) {
            toast.error("Tipe alat wajib diisi");
            return;
        }
        setCompatibilities([...compatibilities, { ...newCompat }]);
        setNewCompat({ equipmentType: "", equipmentBrand: "", equipmentModel: "" });
    };

    const removeCompatibility = (index: number) => {
        setCompatibilities(compatibilities.filter((_, i) => i !== index));
    };

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/master/sparepart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || "Gagal menambahkan sparepart");
                return;
            }

            // Save compatibilities if any
            if (compatibilities.length > 0) {
                for (const compat of compatibilities) {
                    await fetch("/api/master/sparepart/compatibility", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            sparepartId: result.data.id,
                            ...compat,
                        }),
                    });
                }
            }

            toast.success("Sparepart berhasil ditambahkan");
            router.push("/master/sparepart");
        } catch (error) {
            console.error("Error saving sparepart:", error);
            toast.error("Terjadi kesalahan saat menyimpan");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/master/sparepart">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Tambah Sparepart</h1>
                    <p className="text-slate-600 mt-1">Tambah data sparepart baru</p>
                </div>
            </div>

            {/* Form */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Tabs defaultValue="data" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="data">Data Sparepart</TabsTrigger>
                            <TabsTrigger value="compatibility">Kompatibilitas Alat</TabsTrigger>
                        </TabsList>

                        <TabsContent value="data">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informasi Sparepart</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Kode Sparepart *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Contoh: SP-001" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nama Sparepart *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Nama sparepart" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="categoryId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Kategori *</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih kategori" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {categories.map((cat) => (
                                                                <SelectItem key={cat.id} value={cat.id}>
                                                                    {cat.name}
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
                                            name="brand"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Merk</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Merk/brand" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="unit"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Satuan *</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih satuan" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {UNIT_OPTIONS.map((unit) => (
                                                                <SelectItem key={unit} value={unit}>
                                                                    {unit.toUpperCase()}
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
                                            name="minStock"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Stok Minimum</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="rackLocation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Lokasi Rak</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Contoh: A-12" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="compatibility">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Kompatibilitas Alat Berat</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                                        <p className="text-sm font-medium">Tambah Kompatibilitas</p>
                                        <div className="grid grid-cols-3 gap-4">
                                            <Select
                                                value={newCompat.equipmentType}
                                                onValueChange={(val) => setNewCompat({ ...newCompat, equipmentType: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Tipe Alat *" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {EQUIPMENT_TYPES.map((type) => (
                                                        <SelectItem key={type} value={type}>
                                                            {type}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                placeholder="Merk (opsional)"
                                                value={newCompat.equipmentBrand}
                                                onChange={(e) => setNewCompat({ ...newCompat, equipmentBrand: e.target.value })}
                                            />
                                            <Input
                                                placeholder="Model (opsional)"
                                                value={newCompat.equipmentModel}
                                                onChange={(e) => setNewCompat({ ...newCompat, equipmentModel: e.target.value })}
                                            />
                                        </div>
                                        <Button type="button" onClick={addCompatibility} size="sm">
                                            Tambah
                                        </Button>
                                    </div>

                                    {compatibilities.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">Daftar Kompatibilitas:</p>
                                            {compatibilities.map((compat, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 border rounded">
                                                    <div>
                                                        <span className="font-medium">{compat.equipmentType}</span>
                                                        {compat.equipmentBrand && <span className="text-slate-600"> - {compat.equipmentBrand}</span>}
                                                        {compat.equipmentModel && <span className="text-slate-600"> {compat.equipmentModel}</span>}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeCompatibility(index)}
                                                    >
                                                        Hapus
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-3 mt-6">
                        <Link href="/master/sparepart">
                            <Button type="button" variant="outline">
                                Batal
                            </Button>
                        </Link>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
