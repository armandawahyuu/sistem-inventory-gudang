import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Report per heavy equipment
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const equipmentId = searchParams.get("equipmentId") || "";
        const dateFrom = searchParams.get("dateFrom") || "";
        const dateTo = searchParams.get("dateTo") || "";

        if (!equipmentId) {
            return NextResponse.json({
                data: null,
                message: "Pilih unit alat berat terlebih dahulu",
            });
        }

        // Get equipment details
        const equipment = await prisma.heavyEquipment.findUnique({
            where: { id: equipmentId },
        });

        if (!equipment) {
            return NextResponse.json(
                { error: "Unit alat berat tidak ditemukan" },
                { status: 404 }
            );
        }

        // Build where clause for stock out
        const where: any = {
            equipmentId: equipmentId,
            status: "approved",
        };

        if (dateFrom) {
            where.approvedAt = { ...where.approvedAt, gte: new Date(dateFrom) };
        }
        if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);
            where.approvedAt = { ...where.approvedAt, lte: endDate };
        }

        // Get usage history with sparepart and employee relations
        const usageHistory = await prisma.stockOut.findMany({
            where,
            include: {
                sparepart: {
                    select: {
                        code: true,
                        name: true,
                        stockIns: {
                            orderBy: { createdAt: "desc" },
                            take: 1,
                            select: { purchasePrice: true },
                        },
                    },
                },
                employee: { select: { name: true, position: true } },
            },
            orderBy: { approvedAt: "desc" },
        });

        // Calculate totals
        let totalQuantity = 0;
        let totalCost = 0;

        const history = usageHistory.map((item) => {
            const price = item.sparepart.stockIns[0]?.purchasePrice || 0;
            const cost = item.quantity * price;
            totalQuantity += item.quantity;
            totalCost += cost;

            return {
                id: item.id,
                date: item.approvedAt,
                sparepart: {
                    code: item.sparepart.code,
                    name: item.sparepart.name,
                    price,
                },
                quantity: item.quantity,
                employee: item.employee,
                purpose: item.purpose,
                cost,
            };
        });

        return NextResponse.json({
            data: {
                equipment,
                history,
                summary: {
                    totalTransactions: history.length,
                    totalQuantity,
                    totalCost,
                },
            },
        });
    } catch (error) {
        console.error("Error fetching equipment report:", error);
        return NextResponse.json(
            { error: "Gagal mengambil laporan" },
            { status: 500 }
        );
    }
}
