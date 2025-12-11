import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { stockInSchema } from "@/lib/validations/stock-in";

// GET - List all stock ins with pagination, search, and filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const supplierId = searchParams.get("supplierId") || "";
        const dateFrom = searchParams.get("dateFrom") || "";
        const dateTo = searchParams.get("dateTo") || "";

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { invoiceNumber: { contains: search, mode: "insensitive" as const } },
                { sparepart: { code: { contains: search, mode: "insensitive" as const } } },
                { sparepart: { name: { contains: search, mode: "insensitive" as const } } },
            ];
        }

        if (supplierId) {
            where.supplierId = supplierId;
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                where.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                where.createdAt.lte = endDate;
            }
        }

        const [stockIns, total] = await Promise.all([
            prisma.stockIn.findMany({
                where,
                skip,
                take: limit,
                include: {
                    sparepart: { select: { code: true, name: true, unit: true } },
                    supplier: { select: { name: true } },
                    warranty: { select: { expiryDate: true, claimStatus: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.stockIn.count({ where }),
        ]);

        return NextResponse.json({
            data: stockIns,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching stock ins:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data barang masuk" },
            { status: 500 }
        );
    }
}

// POST - Create new stock in with stock update and optional warranty
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validationResult = stockInSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const { sparepartId, quantity, supplierId, invoiceNumber, purchasePrice, warrantyExpiry, notes } = validationResult.data;

        // Check if sparepart exists
        const sparepart = await prisma.sparepart.findUnique({
            where: { id: sparepartId },
        });

        if (!sparepart) {
            return NextResponse.json(
                { error: "Sparepart tidak ditemukan" },
                { status: 404 }
            );
        }

        // Use transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // Create stock in record
            const stockIn = await tx.stockIn.create({
                data: {
                    sparepartId,
                    quantity,
                    supplierId: supplierId || null,
                    invoiceNumber: invoiceNumber || null,
                    purchasePrice: purchasePrice || null,
                    warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
                    notes: notes || null,
                },
                include: {
                    sparepart: { select: { code: true, name: true } },
                    supplier: { select: { name: true } },
                },
            });

            // Update sparepart current stock
            await tx.sparepart.update({
                where: { id: sparepartId },
                data: {
                    currentStock: { increment: quantity },
                },
            });

            // Create warranty record if warranty expiry is provided
            if (warrantyExpiry) {
                await tx.warranty.create({
                    data: {
                        stockInId: stockIn.id,
                        sparepartId,
                        expiryDate: new Date(warrantyExpiry),
                        claimStatus: "active",
                    },
                });
            }

            return stockIn;
        });

        return NextResponse.json(
            { data: result, message: "Barang masuk berhasil ditambahkan" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating stock in:", error);
        return NextResponse.json(
            { error: "Gagal menambahkan barang masuk" },
            { status: 500 }
        );
    }
}
