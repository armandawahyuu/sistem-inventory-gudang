import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Stock Out Report
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const status = searchParams.get("status");

        const where: Record<string, unknown> = {};

        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate + "T23:59:59"),
            };
        } else if (startDate) {
            where.createdAt = { gte: new Date(startDate) };
        } else if (endDate) {
            where.createdAt = { lte: new Date(endDate + "T23:59:59") };
        }

        if (status && status !== "all") {
            where.status = status;
        }

        const stockOuts = await prisma.stockOut.findMany({
            where,
            include: {
                sparepart: {
                    select: { code: true, name: true, unit: true },
                },
                equipment: {
                    select: { code: true, name: true },
                },
                employee: {
                    select: { name: true, position: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Calculate summary
        const summary = {
            totalTransactions: stockOuts.length,
            totalQuantity: stockOuts.reduce((sum, s) => sum + s.quantity, 0),
            pending: stockOuts.filter((s) => s.status === "pending").length,
            approved: stockOuts.filter((s) => s.status === "approved").length,
            rejected: stockOuts.filter((s) => s.status === "rejected").length,
        };

        const data = stockOuts.map((so) => ({
            id: so.id,
            date: so.createdAt,
            sparepartCode: so.sparepart.code,
            sparepartName: so.sparepart.name,
            unit: so.sparepart.unit,
            quantity: so.quantity,
            equipmentCode: so.equipment?.code || "-",
            equipmentName: so.equipment?.name || "-",
            employeeName: so.employee?.name || "-",
            employeePosition: so.employee?.position || "-",
            purpose: so.purpose || "-",
            status: so.status,
            approvedAt: so.approvedAt,
        }));

        return NextResponse.json({ data, summary });
    } catch (error) {
        console.error("Error fetching stock out report:", error);
        return NextResponse.json(
            { error: "Gagal mengambil laporan" },
            { status: 500 }
        );
    }
}
