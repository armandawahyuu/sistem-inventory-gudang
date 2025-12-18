"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useId } from "react";
import { useSession, signOut } from "next-auth/react";
import {
    LayoutDashboard,
    Truck,
    Package,
    Tag,
    Users,
    Building2,
    ArrowDownToLine,
    ArrowUpFromLine,
    CheckCircle,
    Clock,
    FileInput,
    Edit,
    ListChecks,
    Wallet,
    TrendingUp,
    TrendingDown,
    FileText,
    BarChart3,
    Shield,
    UserCircle,
    ChevronDown,
    LogOut,
    Settings,
    Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface NavItem {
    title: string;
    href?: string;
    icon: React.ReactNode;
    children?: { title: string; href: string; icon: React.ReactNode }[];
}

const navItems: NavItem[] = [
    {
        title: "Dashboard",
        href: "/",
        icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
        title: "Master Data",
        icon: <Boxes className="h-5 w-5" />,
        children: [
            { title: "Alat Berat", href: "/master/alat-berat", icon: <Truck className="h-4 w-4" /> },
            { title: "Sparepart", href: "/master/sparepart", icon: <Package className="h-4 w-4" /> },
            { title: "Kategori", href: "/master/kategori", icon: <Tag className="h-4 w-4" /> },
            { title: "Supplier", href: "/master/supplier", icon: <Building2 className="h-4 w-4" /> },
            { title: "Karyawan", href: "/master/karyawan", icon: <Users className="h-4 w-4" /> },
        ],
    },
    {
        title: "Transaksi",
        icon: <ArrowDownToLine className="h-5 w-5" />,
        children: [
            { title: "Barang Masuk", href: "/transaksi/barang-masuk", icon: <ArrowDownToLine className="h-4 w-4" /> },
            { title: "Barang Keluar", href: "/transaksi/barang-keluar", icon: <ArrowUpFromLine className="h-4 w-4" /> },
            { title: "Approval", href: "/transaksi/approval", icon: <CheckCircle className="h-4 w-4" /> },
        ],
    },
    {
        title: "Absensi",
        icon: <Clock className="h-5 w-5" />,
        children: [
            { title: "Import Data", href: "/absensi/import", icon: <FileInput className="h-4 w-4" /> },
            { title: "Input Manual", href: "/absensi/manual", icon: <Edit className="h-4 w-4" /> },
            { title: "Rekap", href: "/absensi/rekap", icon: <ListChecks className="h-4 w-4" /> },
        ],
    },
    {
        title: "Kas Kecil",
        icon: <Wallet className="h-5 w-5" />,
        children: [
            { title: "Pemasukan", href: "/kas-kecil/pemasukan", icon: <TrendingUp className="h-4 w-4" /> },
            { title: "Pengeluaran", href: "/kas-kecil/pengeluaran", icon: <TrendingDown className="h-4 w-4" /> },
            { title: "Laporan", href: "/kas-kecil/laporan", icon: <FileText className="h-4 w-4" /> },
        ],
    },
    {
        title: "Laporan",
        icon: <BarChart3 className="h-5 w-5" />,
        children: [
            { title: "Stok", href: "/laporan/stok", icon: <Package className="h-4 w-4" /> },
            { title: "Barang Masuk", href: "/laporan/barang-masuk", icon: <ArrowDownToLine className="h-4 w-4" /> },
            { title: "Barang Keluar", href: "/laporan/barang-keluar", icon: <ArrowUpFromLine className="h-4 w-4" /> },
            { title: "Per Alat Berat", href: "/laporan/per-alat-berat", icon: <Truck className="h-4 w-4" /> },
            { title: "Garansi", href: "/laporan/garansi", icon: <Shield className="h-4 w-4" /> },
            { title: "Kehadiran", href: "/laporan/kehadiran", icon: <UserCircle className="h-4 w-4" /> },
        ],
    },
    {
        title: "Settings",
        icon: <Settings className="h-5 w-5" />,
        children: [
            { title: "Import Data", href: "/settings/import", icon: <FileInput className="h-4 w-4" /> },
            { title: "History Import", href: "/settings/import/history", icon: <Clock className="h-4 w-4" /> },
            { title: "Cleanup Data", href: "/settings/cleanup", icon: <ListChecks className="h-4 w-4" /> },
            { title: "Migrasi", href: "/settings/migrasi", icon: <ArrowUpFromLine className="h-4 w-4" /> },
            { title: "Activity Log", href: "/settings/activity-log", icon: <FileText className="h-4 w-4" /> },
            { title: "Security Logs", href: "/settings/security-logs", icon: <Shield className="h-4 w-4" /> },
        ],
    },
];

interface SidebarProps {
    className?: string;
    onNavItemClick?: () => void;
}

export function Sidebar({ className, onNavItemClick }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [openMenus, setOpenMenus] = useState<string[]>(["Master Data", "Transaksi"]);
    const baseId = useId();

    const toggleMenu = (title: string) => {
        setOpenMenus((prev) =>
            prev.includes(title)
                ? prev.filter((item) => item !== title)
                : [...prev, title]
        );
    };

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/login" });
    };

    return (
        <div className={cn("flex h-full flex-col bg-slate-900 text-white", className)}>
            {/* Logo */}
            <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-800 px-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
                    <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h1 className="text-base font-semibold">Inventory</h1>
                    <p className="text-[10px] text-slate-400">Gudang Sparepart</p>
                </div>
            </div>

            {/* Navigation - scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4">
                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <div key={item.title}>
                            {item.children ? (
                                <Collapsible
                                    open={openMenus.includes(item.title)}
                                    onOpenChange={() => toggleMenu(item.title)}
                                >
                                    <CollapsibleTrigger asChild>
                                        <button
                                            className={cn(
                                                "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                                "text-slate-300 hover:bg-slate-800 hover:text-white"
                                            )}
                                        >
                                            <span className="flex items-center gap-3">
                                                {item.icon}
                                                {item.title}
                                            </span>
                                            <ChevronDown
                                                className={cn(
                                                    "h-4 w-4 transition-transform duration-200",
                                                    openMenus.includes(item.title) && "rotate-180"
                                                )}
                                            />
                                        </button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-1 space-y-1 pl-4">
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                onClick={onNavItemClick}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                                                    isActive(child.href)
                                                        ? "bg-blue-600 text-white font-medium"
                                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                                )}
                                            >
                                                {child.icon}
                                                {child.title}
                                            </Link>
                                        ))}
                                    </CollapsibleContent>
                                </Collapsible>
                            ) : (
                                <Link
                                    href={item.href!}
                                    onClick={onNavItemClick}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                        isActive(item.href!)
                                            ? "bg-blue-600 text-white"
                                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                    )}
                                >
                                    {item.icon}
                                    {item.title}
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            {/* User Info & Logout */}
            <div className="shrink-0 border-t border-slate-800 p-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-slate-700 text-white">
                            {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium">
                            {session?.user?.name || "User"}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                            {session?.user?.role || "Staff"}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="h-8 w-8 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>

                {/* Copyright */}
                <p className="mt-3 text-[10px] text-slate-500 text-center">
                    © {new Date().getFullYear()} PT WAHYU KREASI DIGITAL
                </p>
            </div>
        </div>
    );
}
