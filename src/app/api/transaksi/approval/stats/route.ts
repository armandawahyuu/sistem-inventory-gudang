import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Get approval statistics
export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [totalPending, approvedToday, rejectedToday] = await Promise.all([
            prisma.stockOut.count({
                where: { status: "pending" },
            }),
            prisma.stockOut.count({
                where: {
                    status: "approved",
                    approvedAt: {
                        gte: today,
                        lt: tomorrow,
                    },
                },
            }),
            prisma.stockOut.count({
                where: {
                    status: "rejected",
                    updatedAt: {
                        gte: today,
                        lt: tomorrow,
                    },
                },
            }),
        ]);

        return NextResponse.json({
            data: {
                totalPending,
                approvedToday,
                rejectedToday,
            },
        });
    } catch (error) {
        console.error("Error fetching approval stats:", error);
        return NextResponse.json(
            { error: "Gagal mengambil statistik approval" },
            { status: 500 }
        );
    }
}
