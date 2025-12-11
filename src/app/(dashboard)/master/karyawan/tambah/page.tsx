"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { KaryawanForm } from "../components/karyawan-form";
import { type KaryawanInput } from "@/lib/validations/karyawan";

export default function TambahKaryawanPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data: KaryawanInput) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/master/karyawan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || "Gagal menambahkan karyawan");
                return;
            }

            toast.success("Karyawan berhasil ditambahkan");
            router.push("/master/karyawan");
        } catch (error) {
            console.error("Error saving karyawan:", error);
            toast.error("Terjadi kesalahan saat menyimpan");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/master/karyawan">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Tambah Karyawan</h1>
                    <p className="text-slate-600 mt-1">Tambah data karyawan baru</p>
                </div>
            </div>

            {/* Form */}
            <KaryawanForm onSubmit={onSubmit} isLoading={isLoading} />
        </div>
    );
}
