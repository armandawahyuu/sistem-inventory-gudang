"use client";

import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, Bell, ChevronRight, Home, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
    onMenuClick: () => void;
}

// Mapping untuk breadcrumb
const pathNames: Record<string, string> = {
    "/": "Dashboard",
    "/master": "Master Data",
    "/master/alat-berat": "Alat Berat",
    "/master/sparepart": "Sparepart",
    "/master/kategori": "Kategori",
    "/master/supplier": "Supplier",
    "/master/karyawan": "Karyawan",
    "/transaksi": "Transaksi",
    "/transaksi/barang-masuk": "Barang Masuk",
    "/transaksi/barang-keluar": "Barang Keluar",
    "/transaksi/approval": "Approval",
    "/absensi": "Absensi",
    "/absensi/import": "Import Data",
    "/absensi/manual": "Input Manual",
    "/absensi/rekap": "Rekap",
    "/kas-kecil": "Kas Kecil",
    "/kas-kecil/pemasukan": "Pemasukan",
    "/kas-kecil/pengeluaran": "Pengeluaran",
    "/kas-kecil/laporan": "Laporan",
    "/laporan": "Laporan",
    "/laporan/stok": "Stok",
    "/laporan/barang-masuk": "Barang Masuk",
    "/laporan/barang-keluar": "Barang Keluar",
    "/laporan/per-alat-berat": "Per Alat Berat",
    "/laporan/garansi": "Garansi",
    "/laporan/kehadiran": "Kehadiran",
};

export function Header({ onMenuClick }: HeaderProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    // Generate breadcrumbs
    const generateBreadcrumbs = () => {
        if (pathname === "/") {
            return [{ label: "Dashboard", href: "/" }];
        }

        const segments = pathname.split("/").filter(Boolean);
        const breadcrumbs = [{ label: "Dashboard", href: "/" }];

        let currentPath = "";
        segments.forEach((segment) => {
            currentPath += `/${segment}`;
            const label = pathNames[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
            breadcrumbs.push({ label, href: currentPath });
        });

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/login" });
    };

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-4 lg:px-6">
            {/* Mobile Menu Button */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={onMenuClick}
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
            </Button>

            {/* Breadcrumb */}
            <nav className="flex-1">
                <ol className="flex items-center gap-1 text-sm">
                    {breadcrumbs.map((crumb, index) => (
                        <li key={crumb.href} className="flex items-center gap-1">
                            {index === 0 && <Home className="h-4 w-4 text-slate-400" />}
                            {index > 0 && <ChevronRight className="h-4 w-4 text-slate-300" />}
                            <span
                                className={
                                    index === breadcrumbs.length - 1
                                        ? "font-medium text-slate-900"
                                        : "text-slate-500"
                                }
                            >
                                {crumb.label}
                            </span>
                        </li>
                    ))}
                </ol>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2">
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-slate-600" />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
                    <span className="sr-only">Notifikasi</span>
                </Button>

                {/* User Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 px-2">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-slate-200 text-slate-700">
                                    {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden text-left md:block">
                                <p className="text-sm font-medium">
                                    {session?.user?.name || "User"}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {session?.user?.role || "Staff"}
                                </p>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            Profil
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Pengaturan
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                            <LogOut className="mr-2 h-4 w-4" />
                            Keluar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
