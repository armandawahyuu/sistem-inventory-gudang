import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Stock In Report
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

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

        const stockIns = await prisma.stockIn.findMany({
            where,
            include: {
                sparepart: {
                    select: { code: true, name: true, unit: true },
                },
                supplier: {
                    select: { name: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Calculate summary
        const summary = {
            totalTransactions: stockIns.length,
            totalQuantity: stockIns.reduce((sum, s) => sum + s.quantity, 0),
            totalValue: stockIns.reduce((sum, s) => sum + (s.quantity * (s.purchasePrice || 0)), 0),
        };

        const data = stockIns.map((si) => ({
            id: si.id,
            date: si.createdAt,
            sparepartCode: si.sparepart.code,
            sparepartName: si.sparepart.name,
            unit: si.sparepart.unit,
            quantity: si.quantity,
            supplierName: si.supplier?.name || "-",
            invoiceNumber: si.invoiceNumber || "-",
            purchasePrice: si.purchasePrice || 0,
            totalPrice: si.quantity * (si.purchasePrice || 0),
            notes: si.notes || "-",
        }));

        return NextResponse.json({ data, summary });
    } catch (error) {
        console.error("Error fetching stock in report:", error);
        return NextResponse.json(
            { error: "Gagal mengambil laporan" },
            { status: 500 }
        );
    }
}
