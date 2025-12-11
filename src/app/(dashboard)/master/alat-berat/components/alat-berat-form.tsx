"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { alatBeratSchema, EQUIPMENT_TYPES, EQUIPMENT_STATUS, type AlatBeratInput } from "@/lib/validations/alat-berat";
import { Loader2 } from "lucide-react";

interface HeavyEquipment {
    id: string;
    code: string;
    name: string;
    type: string;
    brand: string;
    model: string;
    year: number | null;
    site: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
}

interface AlatBeratFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    equipment?: HeavyEquipment | null;
    onSuccess: () => void;
}

export function AlatBeratForm({
    open,
    onOpenChange,
    equipment,
    onSuccess,
}: AlatBeratFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!equipment;

    const form = useForm<AlatBeratInput>({
        resolver: zodResolver(alatBeratSchema),
        defaultValues: {
            code: "",
            name: "",
            type: "",
            brand: "",
            model: "",
            year: null,
            site: "",
            status: "active",
        },
    });

    useEffect(() => {
        if (equipment) {
            form.reset({
                code: equipment.code,
                name: equipment.name,
                type: equipment.type,
                brand: equipment.brand,
                model: equipment.model,
                year: equipment.year,
                site: equipment.site || "",
                status: equipment.status as "active" | "maintenance" | "inactive",
            });
        } else {
            form.reset({
                code: "",
                name: "",
                type: "",
                brand: "",
                model: "",
                year: null,
                site: "",
                status: "active",
            });
        }
    }, [equipment, form]);

    const onSubmit = async (data: AlatBeratInput) => {
        setIsLoading(true);
        try {
            const url = isEditing
                ? `/api/master/alat-berat/${equipment.id}`
                : "/api/master/alat-berat";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                form.setError("code", { message: result.error });
                return;
            }

            onSuccess();
            onOpenChange(false);
            form.reset();
        } catch (error) {
            console.error("Error saving equipment:", error);
            form.setError("code", { message: "Terjadi kesalahan. Silakan coba lagi." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Alat Berat" : "Tambah Alat Berat"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Kode Unit <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Contoh: EX-001" {...field} disabled={isLoading} />
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
                                        <FormLabel>
                                            Nama <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nama alat berat" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Tipe <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih tipe" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {EQUIPMENT_TYPES.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {type}
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
                                        <FormLabel>
                                            Merk <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Contoh: Komatsu" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Model <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Contoh: PC200-8" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="year"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tahun</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Tahun pembuatan"
                                                {...field}
                                                value={field.value || ""}
                                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="site"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lokasi/Site</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Lokasi project" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Status <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.entries(EQUIPMENT_STATUS).map(([value, label]) => (
                                                    <SelectItem key={value} value={value}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Simpan" : "Tambah"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
