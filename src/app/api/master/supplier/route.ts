import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supplierSchema } from "@/lib/validations/supplier";

// GET - List all suppliers with pagination and search
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";

        const skip = (page - 1) * limit;

        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    { phone: { contains: search, mode: "insensitive" as const } },
                    { email: { contains: search, mode: "insensitive" as const } },
                ],
            }
            : {};

        const [suppliers, total] = await Promise.all([
            prisma.supplier.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.supplier.count({ where }),
        ]);

        return NextResponse.json({
            data: suppliers,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data supplier" },
            { status: 500 }
        );
    }
}

// POST - Create new supplier
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validationResult = supplierSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        // Clean up empty strings to null
        const data = {
            ...validationResult.data,
            phone: validationResult.data.phone || null,
            email: validationResult.data.email || null,
            address: validationResult.data.address || null,
        };

        const supplier = await prisma.supplier.create({
            data,
        });

        return NextResponse.json(
            { data: supplier, message: "Supplier berhasil ditambahkan" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating supplier:", error);
        return NextResponse.json(
            { error: "Gagal menambahkan supplier" },
            { status: 500 }
        );
    }
}
