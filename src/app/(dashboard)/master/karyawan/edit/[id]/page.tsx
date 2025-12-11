"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { KaryawanForm } from "../../components/karyawan-form";
import { type KaryawanInput } from "@/lib/validations/karyawan";

interface Props {
    params: Promise<{ id: string }>;
}

export default function EditKaryawanPage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [initialData, setInitialData] = useState<KaryawanInput | null>(null);

    useEffect(() => {
        const fetchKaryawan = async () => {
            try {
                const response = await fetch(`/api/master/karyawan/${id}`);
                const result = await response.json();

                if (!response.ok) {
                    toast.error(result.error || "Gagal memuat data karyawan");
                    router.push("/master/karyawan");
                    return;
                }

                setInitialData({
                    nik: result.data.nik,
                    name: result.data.name,
                    position: result.data.position,
                    department: result.data.department || "",
                    phone: result.data.phone || "",
                    isActive: result.data.isActive,
                });
            } catch (error) {
                console.error("Error fetching karyawan:", error);
                toast.error("Terjadi kesalahan saat memuat data");
                router.push("/master/karyawan");
            } finally {
                setIsFetching(false);
            }
        };

        fetchKaryawan();
    }, [id, router]);

    const onSubmit = async (data: KaryawanInput) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/master/karyawan/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || "Gagal memperbarui data karyawan");
                return;
            }

            toast.success("Data karyawan berhasil diperbarui");
            router.push("/master/karyawan");
        } catch (error) {
            console.error("Error updating karyawan:", error);
            toast.error("Terjadi kesalahan saat menyimpan");
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!initialData) {
        return null;
    }

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
                    <h1 className="text-3xl font-bold text-slate-900">Edit Karyawan</h1>
                    <p className="text-slate-600 mt-1">Perbarui data karyawan</p>
                </div>
            </div>

            {/* Form */}
            <KaryawanForm
                defaultValues={initialData}
                onSubmit={onSubmit}
                isLoading={isLoading}
                submitLabel="Perbarui"
            />
        </div>
    );
}
