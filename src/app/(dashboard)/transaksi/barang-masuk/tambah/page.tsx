"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { BarangMasukForm } from "../components/barang-masuk-form";
import { type StockInInput } from "@/lib/validations/stock-in";

export default function TambahBarangMasukPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data: StockInInput) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/transaksi/barang-masuk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || "Gagal menambahkan barang masuk");
                return;
            }

            toast.success("Barang masuk berhasil ditambahkan, stok telah diperbarui");
            router.push("/transaksi/barang-masuk");
        } catch (error) {
            console.error("Error saving stock in:", error);
            toast.error("Terjadi kesalahan saat menyimpan");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/transaksi/barang-masuk">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Tambah Barang Masuk</h1>
                    <p className="text-slate-600 mt-1">Catat transaksi barang masuk baru</p>
                </div>
            </div>

            {/* Form */}
            <BarangMasukForm onSubmit={onSubmit} isLoading={isLoading} />
        </div>
    );
}
