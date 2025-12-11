import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Stock report
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId") || "";
        const stockStatus = searchParams.get("stockStatus") || "all";

        // Build where clause
        const where: any = {};
        if (categoryId) {
            where.categoryId = categoryId;
        }

        // Get all spareparts with their latest stock-in for price
        let spareparts = await prisma.sparepart.findMany({
            where,
            include: {
                category: { select: { id: true, name: true } },
                stockIns: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { purchasePrice: true },
                },
            },
            orderBy: { name: "asc" },
        });

        // Filter by stock status
        if (stockStatus === "low") {
            spareparts = spareparts.filter(sp => sp.currentStock <= sp.minStock && sp.currentStock > 0);
        } else if (stockStatus === "empty") {
            spareparts = spareparts.filter(sp => sp.currentStock === 0);
        } else if (stockStatus === "normal") {
            spareparts = spareparts.filter(sp => sp.currentStock > sp.minStock);
        }

        // Get all spareparts for summary
        const allSpareparts = await prisma.sparepart.findMany({
            where: categoryId ? { categoryId } : {},
            include: {
                stockIns: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { purchasePrice: true },
                },
            },
        });

        // Calculate value from latest purchase price
        const getPrice = (sp: typeof allSpareparts[0]) => sp.stockIns[0]?.purchasePrice || 0;

        const summary = {
            totalItems: allSpareparts.length,
            totalNormal: allSpareparts.filter(sp => sp.currentStock > sp.minStock).length,
            totalLow: allSpareparts.filter(sp => sp.currentStock <= sp.minStock && sp.currentStock > 0).length,
            totalEmpty: allSpareparts.filter(sp => sp.currentStock === 0).length,
            totalValue: allSpareparts.reduce((sum, sp) => sum + (sp.currentStock * getPrice(sp)), 0),
        };

        // Add status and value to each sparepart
        const data = spareparts.map(sp => {
            const price = sp.stockIns[0]?.purchasePrice || 0;
            return {
                id: sp.id,
                code: sp.code,
                name: sp.name,
                unit: sp.unit,
                currentStock: sp.currentStock,
                minStock: sp.minStock,
                category: sp.category,
                price,
                status: sp.currentStock === 0 ? "empty" : sp.currentStock <= sp.minStock ? "low" : "normal",
                value: sp.currentStock * price,
            };
        });

        return NextResponse.json({
            data,
            summary,
        });
    } catch (error) {
        console.error("Error fetching stock report:", error);
        return NextResponse.json(
            { error: "Gagal mengambil laporan stok" },
            { status: 500 }
        );
    }
}
