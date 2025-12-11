"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
    FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { karyawanSchema, POSITION_OPTIONS, type KaryawanInput } from "@/lib/validations/karyawan";
import { Loader2 } from "lucide-react";

interface KaryawanFormProps {
    defaultValues?: Partial<KaryawanInput>;
    onSubmit: (data: KaryawanInput) => Promise<void>;
    isLoading: boolean;
    submitLabel?: string;
}

export function KaryawanForm({
    defaultValues,
    onSubmit,
    isLoading,
    submitLabel = "Simpan",
}: KaryawanFormProps) {
    const form = useForm<KaryawanInput>({
        resolver: zodResolver(karyawanSchema),
        defaultValues: {
            nik: "",
            name: "",
            position: "",
            department: "",
            phone: "",
            isActive: true,
            ...defaultValues,
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Karyawan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="nik"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>NIK *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Contoh: EMP001" {...field} />
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
                                        <FormLabel>Nama *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nama lengkap karyawan" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="position"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Jabatan *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih jabatan" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {POSITION_OPTIONS.map((pos) => (
                                                    <SelectItem key={pos} value={pos}>
                                                        {pos}
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
                                name="department"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Departemen</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Departemen/divisi" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telepon</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nomor telepon" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Status Aktif</FormLabel>
                                            <FormDescription>
                                                Karyawan aktif dapat melakukan transaksi
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 mt-6">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
