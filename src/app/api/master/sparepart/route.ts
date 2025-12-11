import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sparepartSchema } from "@/lib/validations/sparepart";

// GET - List all spareparts with pagination, search, and filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const categoryId = searchParams.get("categoryId") || "";
        const stockFilter = searchParams.get("stockFilter") || ""; // all, low, empty

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { code: { contains: search, mode: "insensitive" as const } },
                { name: { contains: search, mode: "insensitive" as const } },
                { brand: { contains: search, mode: "insensitive" as const } },
            ];
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        // Stock filter
        if (stockFilter === "low") {
            where.AND = [
                { currentStock: { lte: prisma.sparepart.fields.minStock } },
                { currentStock: { gt: 0 } },
            ];
        } else if (stockFilter === "empty") {
            where.currentStock = 0;
        }

        const [spareparts, total] = await Promise.all([
            prisma.sparepart.findMany({
                where,
                skip,
                take: limit,
                include: {
                    category: { select: { name: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.sparepart.count({ where }),
        ]);

        return NextResponse.json({
            data: spareparts,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching spareparts:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data sparepart" },
            { status: 500 }
        );
    }
}

// POST - Create new sparepart
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validationResult = sparepartSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        // Check if code already exists
        const existing = await prisma.sparepart.findUnique({
            where: { code: validationResult.data.code },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Kode sparepart sudah ada" },
                { status: 400 }
            );
        }

        // Clean up data
        const data = {
            ...validationResult.data,
            brand: validationResult.data.brand || null,
            rackLocation: validationResult.data.rackLocation || null,
        };

        const sparepart = await prisma.sparepart.create({
            data,
            include: { category: true },
        });

        return NextResponse.json(
            { data: sparepart, message: "Sparepart berhasil ditambahkan" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating sparepart:", error);
        return NextResponse.json(
            { error: "Gagal menambahkan sparepart" },
            { status: 500 }
        );
    }
}
