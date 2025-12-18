"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { pettyCashExpenseSchema, type PettyCashExpenseInput, formatCurrency } from "@/lib/validations/petty-cash";
import { Loader2, Upload, Image as ImageIcon } from "lucide-react";

interface Category {
    id: string;
    name: string;
}

interface PengeluaranFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: PettyCashExpenseInput) => Promise<void>;
    isLoading: boolean;
    balance: number;
}

export function PengeluaranForm({ open, onClose, onSubmit, isLoading, balance }: PengeluaranFormProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

    const form = useForm<PettyCashExpenseInput>({
        resolver: zodResolver(pettyCashExpenseSchema),
        defaultValues: {
            date: new Date().toISOString().split("T")[0],
            categoryId: "",
            amount: 0,
            description: "",
            receipt: "",
        },
    });

    const amount = form.watch("amount");

    useEffect(() => {
        if (open) {
            fetchCategories();
        }
    }, [open]);

    const fetchCategories = async () => {
        try {
            const response = await fetch("/api/kas-kecil/kategori");
            const result = await response.json();
            if (response.ok) {
                setCategories(result.data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result as string;
                setReceiptPreview(base64);
                form.setValue("receipt", base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (data: PettyCashExpenseInput) => {
        await onSubmit(data);
        form.reset();
        setReceiptPreview(null);
    };

    const handleClose = () => {
        form.reset();
        setReceiptPreview(null);
        onClose();
    };

    const isOverBalance = amount > balance;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Tambah Pengeluaran</DialogTitle>
                </DialogHeader>

                {/* Balance Info */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-600">Saldo tersedia:</p>
                    <p className="font-bold text-blue-900">{formatCurrency(balance)}</p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tanggal *</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
                        </div>

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jumlah (Rp) *</FormLabel>
                                    <FormControl>
                                        <CurrencyInput
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    {isOverBalance && (
                                        <p className="text-sm text-red-600">Jumlah melebihi saldo tersedia!</p>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Keterangan *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Keterangan pengeluaran..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Receipt Upload */}
                        <div className="space-y-2">
                            <FormLabel>Foto Struk (Optional)</FormLabel>
                            <div className="border-2 border-dashed rounded-lg p-4">
                                {receiptPreview ? (
                                    <div className="relative">
                                        <img
                                            src={receiptPreview}
                                            alt="Preview"
                                            className="max-h-40 mx-auto rounded"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute top-0 right-0"
                                            onClick={() => {
                                                setReceiptPreview(null);
                                                form.setValue("receipt", "");
                                            }}
                                        >
                                            Hapus
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center cursor-pointer">
                                        <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                        <span className="text-sm text-slate-600">Klik untuk upload</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={isLoading || isOverBalance}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
