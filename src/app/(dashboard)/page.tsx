"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Package,
    Truck,
    ArrowRightLeft,
    Wallet,
    AlertTriangle,
    Clock,
    Shield,
    Plus,
    FileText,
    Users,
    Loader2,
    ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/validations/petty-cash";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface DashboardData {
    stats: {
        totalSpareparts: number;
        totalEquipments: number;
        todayTransactions: number;
        pettyCashBalance: number;
    };
    alerts: {
        lowStockItems: {
            id: string;
            code: string;
            name: string;
            currentStock: number;
            minStock: number;
            unit: string;
        }[];
        expiringWarranties: {
            id: string;
            expiryDate: string;
            sparepart: { code: string; name: string };
        }[];
        pendingRequests: number;
    };
    charts: {
        trendData: { date: string; label: string; masuk: number; keluar: number }[];
        topSpareparts: { name: string; code: string; total: number }[];
    };
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch("/api/dashboard");
            const result = await response.json();
            if (response.ok) {
                setData(result.data);
            }
        } catch (error) {
            console.error("Error fetching dashboard:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getDaysUntil = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-600">Selamat datang di Sistem Inventory Gudang Sparepart Alat Berat</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Total Sparepart</p>
                                <p className="text-2xl font-bold text-slate-900">{data?.stats.totalSpareparts || 0}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Package className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Total Alat Berat</p>
                                <p className="text-2xl font-bold text-slate-900">{data?.stats.totalEquipments || 0}</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-full">
                                <Truck className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Transaksi Hari Ini</p>
                                <p className="text-2xl font-bold text-green-600">{data?.stats.todayTransactions || 0}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <ArrowRightLeft className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Saldo Kas Kecil</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {formatCurrency(data?.stats.pettyCashBalance || 0)}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Wallet className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Aksi Cepat</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/transaksi/barang-masuk/tambah">
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Barang Masuk
                            </Button>
                        </Link>
                        <Link href="/transaksi/barang-keluar/request">
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Request Barang Keluar
                            </Button>
                        </Link>
                        <Link href="/transaksi/approval">
                            <Button variant="outline">
                                <Clock className="mr-2 h-4 w-4" />
                                Approval ({data?.alerts.pendingRequests || 0})
                            </Button>
                        </Link>
                        <Link href="/kas-kecil/pemasukan">
                            <Button variant="outline">
                                <Wallet className="mr-2 h-4 w-4" />
                                Kas Kecil
                            </Button>
                        </Link>
                        <Link href="/absensi/input">
                            <Button variant="outline">
                                <Users className="mr-2 h-4 w-4" />
                                Input Absensi
                            </Button>
                        </Link>
                        <Link href="/kas-kecil/laporan">
                            <Button variant="outline">
                                <FileText className="mr-2 h-4 w-4" />
                                Laporan
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Alerts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Low Stock */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-orange-600">
                                <AlertTriangle className="h-5 w-5" />
                                Stok Menipis
                            </CardTitle>
                            <Badge variant="secondary">{data?.alerts.lowStockItems.length || 0}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {data?.alerts.lowStockItems.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">Semua stok aman</p>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-auto">
                                {data?.alerts.lowStockItems.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium">{item.name}</p>
                                            <p className="text-xs text-slate-500">{item.code}</p>
                                        </div>
                                        <Badge variant="destructive">
                                            {item.currentStock} / {item.minStock} {item.unit}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Expiring Warranties */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-yellow-600">
                                <Shield className="h-5 w-5" />
                                Garansi Akan Expired
                            </CardTitle>
                            <Badge variant="secondary">{data?.alerts.expiringWarranties.length || 0}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {data?.alerts.expiringWarranties.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">Tidak ada garansi akan expired</p>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-auto">
                                {data?.alerts.expiringWarranties.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium">{item.sparepart.name}</p>
                                            <p className="text-xs text-slate-500">{item.sparepart.code}</p>
                                        </div>
                                        <Badge variant="outline" className="text-yellow-700">
                                            H-{getDaysUntil(item.expiryDate)}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pending Requests */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-blue-600">
                                <Clock className="h-5 w-5" />
                                Request Pending
                            </CardTitle>
                            <Badge variant="secondary">{data?.alerts.pendingRequests || 0}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {(data?.alerts.pendingRequests || 0) === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">Tidak ada request pending</p>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-4xl font-bold text-blue-600 mb-2">{data?.alerts.pendingRequests}</p>
                                <p className="text-sm text-slate-600 mb-4">Request menunggu approval</p>
                                <Link href="/transaksi/approval">
                                    <Button size="sm">
                                        Lihat Semua
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Trend Barang Masuk/Keluar (30 Hari)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data?.charts.trendData || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="masuk" name="Masuk" stroke="#22c55e" strokeWidth={2} />
                                <Line type="monotone" dataKey="keluar" name="Keluar" stroke="#ef4444" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Spareparts */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 10 Sparepart Paling Sering Dipakai</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(data?.charts.topSpareparts.length || 0) === 0 ? (
                            <div className="h-64 flex items-center justify-center text-slate-500">
                                Belum ada data pemakaian
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data?.charts.topSpareparts || []} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                                    <Tooltip />
                                    <Bar dataKey="total" name="Total Pemakaian" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
