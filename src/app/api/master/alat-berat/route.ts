import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { alatBeratSchema } from "@/lib/validations/alat-berat";

// GET - List all heavy equipment with pagination, search, and filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const type = searchParams.get("type") || "";
        const status = searchParams.get("status") || "";
        const site = searchParams.get("site") || "";

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { code: { contains: search, mode: "insensitive" as const } },
                { name: { contains: search, mode: "insensitive" as const } },
                { brand: { contains: search, mode: "insensitive" as const } },
                { model: { contains: search, mode: "insensitive" as const } },
            ];
        }

        if (type) {
            where.type = type;
        }

        if (status) {
            where.status = status;
        }

        if (site) {
            where.site = { contains: site, mode: "insensitive" as const };
        }

        const [equipment, total] = await Promise.all([
            prisma.heavyEquipment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.heavyEquipment.count({ where }),
        ]);

        return NextResponse.json({
            data: equipment,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching heavy equipment:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data alat berat" },
            { status: 500 }
        );
    }
}

// POST - Create new heavy equipment
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validationResult = alatBeratSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        // Check if code already exists
        const existing = await prisma.heavyEquipment.findUnique({
            where: { code: validationResult.data.code },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Kode unit sudah ada" },
                { status: 400 }
            );
        }

        // Clean up data
        const data = {
            ...validationResult.data,
            site: validationResult.data.site || null,
            year: validationResult.data.year || null,
        };

        const equipment = await prisma.heavyEquipment.create({
            data,
        });

        return NextResponse.json(
            { data: equipment, message: "Alat berat berhasil ditambahkan" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating heavy equipment:", error);
        return NextResponse.json(
            { error: "Gagal menambahkan alat berat" },
            { status: 500 }
        );
    }
}
