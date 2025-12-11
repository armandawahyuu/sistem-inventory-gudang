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
import { Button } from "@/components/ui/button";
import { kategoriSchema, type KategoriInput } from "@/lib/validations/kategori";
import { Loader2 } from "lucide-react";

interface Category {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

interface KategoriFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category?: Category | null;
    onSuccess: () => void;
}

export function KategoriForm({
    open,
    onOpenChange,
    category,
    onSuccess,
}: KategoriFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!category;

    const form = useForm<KategoriInput>({
        resolver: zodResolver(kategoriSchema),
        defaultValues: {
            name: "",
        },
    });

    // Reset form when category changes
    useEffect(() => {
        if (category) {
            form.reset({ name: category.name });
        } else {
            form.reset({ name: "" });
        }
    }, [category, form]);

    const onSubmit = async (data: KategoriInput) => {
        setIsLoading(true);
        try {
            const url = isEditing
                ? `/api/master/kategori/${category.id}`
                : "/api/master/kategori";
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
            console.error("Error saving category:", error);
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
                        {isEditing ? "Edit Kategori" : "Tambah Kategori"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Kategori</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Masukkan nama kategori"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-3">
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
