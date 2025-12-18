import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface OpnameItem {
    difference: number;
}

// GET - Fetch opname history with pagination
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const id = searchParams.get("id"); // For detail view

        // If id is provided, return single opname with details
        if (id) {
            const opname = await prisma.stockOpname.findUnique({
                where: { id },
                include: {
                    items: {
                        include: {
                            sparepart: {
                                select: {
                                    code: true,
                                    name: true,
                                    unit: true,
                                    category: { select: { name: true } },
                                },
                            },
                        },
                        orderBy: { createdAt: "asc" },
                    },
                },
            });

            if (!opname) {
                return NextResponse.json({ error: "Opname tidak ditemukan" }, { status: 404 });
            }

            // Calculate totals
            const totalItems = opname.items.length;
            const totalSelisih = opname.items.reduce((sum: number, item: OpnameItem) => sum + Math.abs(item.difference), 0);
            const totalPlus = opname.items.filter((item: OpnameItem) => item.difference > 0).reduce((sum: number, item: OpnameItem) => sum + item.difference, 0);
            const totalMinus = opname.items.filter((item: OpnameItem) => item.difference < 0).reduce((sum: number, item: OpnameItem) => sum + Math.abs(item.difference), 0);

            return NextResponse.json({
                data: {
                    ...opname,
                    totalItems,
                    totalSelisih,
                    totalPlus,
                    totalMinus,
                },
            });
        }

        // Get total count
        const total = await prisma.stockOpname.count();

        // Get list with summary
        const opnames = await prisma.stockOpname.findMany({
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                _count: {
                    select: { items: true },
                },
                items: {
                    select: { difference: true },
                },
            },
        });

        // Transform to include calculated fields
        const data = opnames.map((opname) => {
            const totalSelisih = opname.items.reduce((sum: number, item: OpnameItem) => sum + Math.abs(item.difference), 0);
            const totalPlus = opname.items.filter((item: OpnameItem) => item.difference > 0).reduce((sum: number, item: OpnameItem) => sum + item.difference, 0);
            const totalMinus = opname.items.filter((item: OpnameItem) => item.difference < 0).reduce((sum: number, item: OpnameItem) => sum + Math.abs(item.difference), 0);

            return {
                id: opname.id,
                opnameDate: opname.opnameDate,
                notes: opname.notes,
                status: opname.status,
                createdAt: opname.createdAt,
                createdBy: opname.createdBy,
                totalItems: opname._count.items,
                totalSelisih,
                totalPlus,
                totalMinus,
            };
        });

        return NextResponse.json({
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching opname history:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data history opname" },
            { status: 500 }
        );
    }
}
