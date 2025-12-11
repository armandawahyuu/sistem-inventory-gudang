import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Warranty report
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "active";

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        let where: any = {};

        switch (status) {
            case "active":
                where = {
                    expiryDate: { gt: thirtyDaysFromNow },
                    claimDate: null,
                };
                break;
            case "expiring":
                where = {
                    expiryDate: { gte: today, lte: thirtyDaysFromNow },
                    claimDate: null,
                };
                break;
            case "expired":
                where = {
                    expiryDate: { lt: today },
                    claimDate: null,
                };
                break;
            case "claimed":
                where = {
                    claimDate: { not: null },
                };
                break;
        }

        const warranties = await prisma.warranty.findMany({
            where,
            include: {
                sparepart: { select: { code: true, name: true } },
                stockIn: { select: { createdAt: true, supplier: { select: { name: true } } } },
            },
            orderBy: { expiryDate: "asc" },
        });

        // Add days remaining
        const data = warranties.map((w) => {
            const expiryDate = new Date(w.expiryDate);
            const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            let warrantyStatus = "active";
            if (w.claimDate) {
                warrantyStatus = "claimed";
            } else if (daysRemaining < 0) {
                warrantyStatus = "expired";
            } else if (daysRemaining <= 30) {
                warrantyStatus = "expiring";
            }

            return {
                ...w,
                daysRemaining,
                warrantyStatus,
            };
        });

        // Get counts for tabs
        const [activeCount, expiringCount, expiredCount, claimedCount] = await Promise.all([
            prisma.warranty.count({ where: { expiryDate: { gt: thirtyDaysFromNow }, claimDate: null } }),
            prisma.warranty.count({ where: { expiryDate: { gte: today, lte: thirtyDaysFromNow }, claimDate: null } }),
            prisma.warranty.count({ where: { expiryDate: { lt: today }, claimDate: null } }),
            prisma.warranty.count({ where: { claimDate: { not: null } } }),
        ]);

        return NextResponse.json({
            data,
            counts: {
                active: activeCount,
                expiring: expiringCount,
                expired: expiredCount,
                claimed: claimedCount,
            },
        });
    } catch (error) {
        console.error("Error fetching warranty report:", error);
        return NextResponse.json(
            { error: "Gagal mengambil laporan garansi" },
            { status: 500 }
        );
    }
}
