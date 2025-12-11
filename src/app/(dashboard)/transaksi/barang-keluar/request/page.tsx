"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { BarangKeluarForm } from "../components/barang-keluar-form";
import { type StockOutInput } from "@/lib/validations/stock-out";

export default function RequestBarangKeluarPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data: StockOutInput) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/transaksi/barang-keluar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || "Gagal membuat request barang keluar");
                return;
            }

            toast.success("Request barang keluar berhasil dibuat, menunggu approval");
            router.push("/transaksi/barang-keluar");
        } catch (error) {
            console.error("Error creating stock out request:", error);
            toast.error("Terjadi kesalahan saat menyimpan");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/transaksi/barang-keluar">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Request Barang Keluar</h1>
                    <p className="text-slate-600 mt-1">Buat request pengambilan sparepart</p>
                </div>
            </div>

            {/* Form */}
            <BarangKeluarForm onSubmit={onSubmit} isLoading={isLoading} />
        </div>
    );
}
