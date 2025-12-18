"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { BarangKeluarForm } from "../components/barang-keluar-form";

export default function RequestBarangKeluarPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (
        items: { sparepartId: string; quantity: number; scannedBarcode?: string }[],
        equipmentId: string,
        employeeId: string,
        purpose: string
    ) => {
        setIsLoading(true);

        try {
            // Submit each item as a separate request
            const results = await Promise.all(
                items.map(item =>
                    fetch("/api/transaksi/barang-keluar", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            sparepartId: item.sparepartId,
                            equipmentId,
                            employeeId,
                            quantity: item.quantity,
                            purpose,
                            scannedBarcode: item.scannedBarcode || "",
                        }),
                    }).then(res => res.json())
                )
            );

            // Check for errors
            const errors = results.filter(r => r.error);
            const successes = results.filter(r => !r.error);

            if (successes.length > 0) {
                toast.success(`${successes.length} request berhasil dibuat, menunggu approval`);
            }

            if (errors.length > 0) {
                toast.error(`${errors.length} request gagal: ${errors[0].error}`);
            }

            if (successes.length > 0) {
                router.push("/transaksi/barang-keluar");
            }
        } catch (error) {
            console.error("Error creating stock out requests:", error);
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
                    <p className="text-slate-600 mt-1">Scan dan pilih sparepart untuk request pengambilan</p>
                </div>
            </div>

            {/* Form */}
            <BarangKeluarForm onSubmit={onSubmit} isLoading={isLoading} />
        </div>
    );
}
