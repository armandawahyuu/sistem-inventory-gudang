"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
    Shield,
    AlertTriangle,
    Users,
    Activity,
    RefreshCw,
    Filter,
    ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface SecurityStats {
    todayLogins: number;
    todayFailedLogins: number;
    activeSessions: number;
    highRiskEvents: number;
    recentEvents: SecurityEvent[];
}

interface SecurityEvent {
    id: string;
    eventType: string;
    userId: string | null;
    userName: string | null;
    ipAddress: string;
    userAgent: string | null;
    details: Record<string, unknown> | null;
    riskLevel: string;
    duration: number | null;
    createdAt: string;
}

const riskLevelColors: Record<string, string> = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
};

const eventTypeLabels: Record<string, string> = {
    LOGIN_SUCCESS: "Login Berhasil",
    LOGIN_FAILED: "Login Gagal",
    LOGOUT: "Logout",
    PASSWORD_CHANGE: "Ganti Password",
    ACCOUNT_LOCKED: "Akun Terkunci",
    RATE_LIMIT_HIT: "Rate Limit",
    SUSPICIOUS_ACTIVITY: "Aktivitas Mencurigakan",
    DATA_EXPORT: "Export Data",
    BULK_EXPORT: "Bulk Export",
    ADMIN_ACTION: "Aksi Admin",
    OFF_HOURS_ACCESS: "Akses Luar Jam Kerja",
};

export default function SecurityLogsPage() {
    const [stats, setStats] = useState<SecurityStats | null>(null);
    const [logs, setLogs] = useState<SecurityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters
    const [eventType, setEventType] = useState<string>("all");
    const [riskLevel, setRiskLevel] = useState<string>("all");
    const [searchIp, setSearchIp] = useState<string>("");

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/security-logs?type=stats");
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    };

    const fetchLogs = async () => {
        try {
            const params = new URLSearchParams({
                type: "logs",
                page: String(page),
                limit: "20",
            });

            if (eventType !== "all") params.set("eventType", eventType);
            if (riskLevel !== "all") params.set("riskLevel", riskLevel);
            if (searchIp) params.set("ipAddress", searchIp);

            const res = await fetch(`/api/security-logs?${params}`);
            const data = await res.json();

            setLogs(data.data || []);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        }
    };

    const refresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchStats(), fetchLogs()]);
        setRefreshing(false);
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchStats(), fetchLogs()]);
            setLoading(false);
        };
        loadData();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [page, eventType, riskLevel, searchIp]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(refresh, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64 mt-1" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                        <Shield className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Security Logs</h1>
                        <p className="text-slate-600 mt-1">
                            Monitor aktivitas keamanan dan deteksi ancaman
                        </p>
                    </div>
                </div>
                <Button onClick={refresh} disabled={refreshing} variant="outline">
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Login Hari Ini</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {stats?.todayLogins || 0}
                                </p>
                            </div>
                            <Users className="h-8 w-8 text-green-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Login Gagal</p>
                                <p className="text-3xl font-bold text-red-600">
                                    {stats?.todayFailedLogins || 0}
                                </p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Session Aktif</p>
                                <p className="text-3xl font-bold text-blue-600">
                                    {stats?.activeSessions || 0}
                                </p>
                            </div>
                            <Activity className="h-8 w-8 text-blue-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">High Risk Events</p>
                                <p className="text-3xl font-bold text-orange-600">
                                    {stats?.highRiskEvents || 0}
                                </p>
                            </div>
                            <Shield className="h-8 w-8 text-orange-200" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filter
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="w-48">
                            <Select value={eventType} onValueChange={setEventType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Event Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Event</SelectItem>
                                    <SelectItem value="LOGIN_SUCCESS">Login Berhasil</SelectItem>
                                    <SelectItem value="LOGIN_FAILED">Login Gagal</SelectItem>
                                    <SelectItem value="LOGOUT">Logout</SelectItem>
                                    <SelectItem value="RATE_LIMIT_HIT">Rate Limit</SelectItem>
                                    <SelectItem value="SUSPICIOUS_ACTIVITY">Mencurigakan</SelectItem>
                                    <SelectItem value="ADMIN_ACTION">Aksi Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-48">
                            <Select value={riskLevel} onValueChange={setRiskLevel}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Risk Level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Level</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-48">
                            <Input
                                placeholder="Cari IP Address..."
                                value={searchIp}
                                onChange={(e) => setSearchIp(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Security Events</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Waktu</TableHead>
                                <TableHead>Event</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>IP Address</TableHead>
                                <TableHead>Risk Level</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        Tidak ada security log
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {format(new Date(log.createdAt), "dd MMM HH:mm:ss", { locale: id })}
                                        </TableCell>
                                        <TableCell>
                                            {eventTypeLabels[log.eventType] || log.eventType}
                                        </TableCell>
                                        <TableCell>
                                            {log.userName || log.userId || "-"}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {log.ipAddress}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={riskLevelColors[log.riskLevel] || ""}>
                                                {log.riskLevel}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate text-sm text-slate-500">
                                            {log.details ? JSON.stringify(log.details).slice(0, 50) : "-"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </Button>
                            <span className="flex items-center px-4 text-sm text-slate-600">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
