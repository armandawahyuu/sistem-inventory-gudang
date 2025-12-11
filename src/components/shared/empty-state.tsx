"use client";

import { LucideIcon, Package, Users, FileText, Inbox, Search, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    variant?: "default" | "search" | "filter";
}

const variantIcons = {
    default: Inbox,
    search: Search,
    filter: Calendar,
};

export function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    variant = "default",
}: EmptyStateProps) {
    const Icon = icon || variantIcons[variant];

    return (
        <Card>
            <CardContent className="py-12 text-center">
                <div className="mx-auto mb-4 p-4 bg-slate-100 rounded-full w-fit">
                    <Icon className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
                {description && (
                    <p className="text-slate-500 mb-4 max-w-md mx-auto">{description}</p>
                )}
                {actionLabel && onAction && (
                    <Button onClick={onAction}>{actionLabel}</Button>
                )}
            </CardContent>
        </Card>
    );
}

// Preset empty states untuk kebutuhan umum
export function DataEmptyState({ onAdd }: { onAdd?: () => void }) {
    return (
        <EmptyState
            icon={Package}
            title="Belum Ada Data"
            description="Data belum tersedia. Tambahkan data baru untuk memulai."
            actionLabel={onAdd ? "Tambah Data" : undefined}
            onAction={onAdd}
        />
    );
}

export function SearchEmptyState({ query }: { query: string }) {
    return (
        <EmptyState
            variant="search"
            title="Tidak Ditemukan"
            description={`Tidak ada hasil untuk pencarian "${query}". Coba kata kunci lain.`}
        />
    );
}

export function FilterEmptyState() {
    return (
        <EmptyState
            variant="filter"
            title="Tidak Ada Data"
            description="Tidak ada data yang sesuai dengan filter yang dipilih. Coba ubah filter Anda."
        />
    );
}
