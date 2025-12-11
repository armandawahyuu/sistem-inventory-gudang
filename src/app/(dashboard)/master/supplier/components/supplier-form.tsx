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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supplierSchema, type SupplierInput } from "@/lib/validations/supplier";
import { Loader2 } from "lucide-react";

interface Supplier {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    createdAt: string;
    updatedAt: string;
}

interface SupplierFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    supplier?: Supplier | null;
    onSuccess: () => void;
}

export function SupplierForm({
    open,
    onOpenChange,
    supplier,
    onSuccess,
}: SupplierFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!supplier;

    const form = useForm<SupplierInput>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            name: "",
            phone: "",
            email: "",
            address: "",
        },
    });

    // Reset form when supplier changes
    useEffect(() => {
        if (supplier) {
            form.reset({
                name: supplier.name,
                phone: supplier.phone || "",
                email: supplier.email || "",
                address: supplier.address || "",
            });
        } else {
            form.reset({
                name: "",
                phone: "",
                email: "",
                address: "",
            });
        }
    }, [supplier, form]);

    const onSubmit = async (data: SupplierInput) => {
        setIsLoading(true);
        try {
            const url = isEditing
                ? `/api/master/supplier/${supplier.id}`
                : "/api/master/supplier";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                form.setError("name", { message: result.error });
                return;
            }

            onSuccess();
            onOpenChange(false);
            form.reset();
        } catch (error) {
            console.error("Error saving supplier:", error);
            form.setError("name", { message: "Terjadi kesalahan. Silakan coba lagi." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Supplier" : "Tambah Supplier"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Nama Supplier <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Masukkan nama supplier"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telepon</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Masukkan nomor telepon"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="Masukkan email"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Alamat</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Masukkan alamat lengkap"
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-3 pt-2">
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
