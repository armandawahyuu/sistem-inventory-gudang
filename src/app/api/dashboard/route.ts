import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Dashboard data
export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // H+30 for warranty expiry
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        // ========== STATISTICS ==========
        const [
            totalSpareparts,
            totalEquipments,
            todayStockIn,
            todayStockOut,
            totalIncomePC,
            totalExpensePC,
        ] = await Promise.all([
            prisma.sparepart.count(),
            prisma.heavyEquipment.count({ where: { status: "active" } }),
            prisma.stockIn.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
            prisma.stockOut.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
            prisma.pettyCash.aggregate({ where: { type: "in" }, _sum: { amount: true } }),
            prisma.pettyCash.aggregate({ where: { type: "out" }, _sum: { amount: true } }),
        ]);

        const pettyCashBalance = (totalIncomePC._sum.amount || 0) - (totalExpensePC._sum.amount || 0);

        // ========== ALERTS ==========
        // Low stock items - use raw query to compare fields
        const lowStockItems = await prisma.$queryRaw`
            SELECT id, code, name, "currentStock", "minStock", unit
            FROM "Sparepart"
            WHERE "currentStock" <= "minStock"
            ORDER BY "currentStock" ASC
            LIMIT 10
        ` as any[];

        // Expiring warranties (within 30 days)
        const expiringWarranties = await prisma.warranty.findMany({
            where: {
                expiryDate: {
                    gte: today,
                    lte: thirtyDaysFromNow,
                },
                claimDate: null,
            },
            include: {
                sparepart: { select: { code: true, name: true } },
            },
            orderBy: { expiryDate: "asc" },
            take: 10,
        });

        // Pending requests
        const pendingRequests = await prisma.stockOut.count({
            where: { status: "pending" },
        });

        // ========== CHARTS ==========
        // Stock In trend (30 days) - group by createdAt
        const stockInData = await prisma.stockIn.groupBy({
            by: ["createdAt"],
            where: { createdAt: { gte: thirtyDaysAgo } },
            _sum: { quantity: true },
        });

        const stockOutData = await prisma.stockOut.groupBy({
            by: ["createdAt"],
            where: {
                status: "approved",
                approvedAt: { gte: thirtyDaysAgo },
            },
            _sum: { quantity: true },
        });

        // Generate 30-day trend data
        const trendData = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const dateStr = date.toISOString().split("T")[0];

            // Sum all stock-ins for this date
            const stockInSum = stockInData
                .filter((d) => d.createdAt.toISOString().split("T")[0] === dateStr)
                .reduce((sum, d) => sum + (d._sum.quantity || 0), 0);

            // Sum all stock-outs for this date
            const stockOutSum = stockOutData
                .filter((d) => d.createdAt.toISOString().split("T")[0] === dateStr)
                .reduce((sum, d) => sum + (d._sum.quantity || 0), 0);

            trendData.push({
                date: dateStr,
                label: date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
                masuk: stockInSum,
                keluar: stockOutSum,
            });
        }

        // Top 10 most used spareparts
        const topSpareparts = await prisma.stockOut.groupBy({
            by: ["sparepartId"],
            where: { status: "approved" },
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: "desc" } },
            take: 10,
        });

        const sparepartIds = topSpareparts.map((t) => t.sparepartId);
        const sparepartDetails = await prisma.sparepart.findMany({
            where: { id: { in: sparepartIds } },
            select: { id: true, name: true, code: true },
        });

        const topSparepartsData = topSpareparts.map((t) => {
            const sp = sparepartDetails.find((s) => s.id === t.sparepartId);
            return {
                name: sp?.name || "Unknown",
                code: sp?.code || "",
                total: t._sum.quantity || 0,
            };
        });

        return NextResponse.json({
            data: {
                stats: {
                    totalSpareparts,
                    totalEquipments,
                    todayTransactions: todayStockIn + todayStockOut,
                    pettyCashBalance,
                },
                alerts: {
                    lowStockItems,
                    expiringWarranties,
                    pendingRequests,
                },
                charts: {
                    trendData,
                    topSpareparts: topSparepartsData,
                },
            },
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data dashboard" },
            { status: 500 }
        );
    }
}
