import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { kategoriSchema } from "@/lib/validations/kategori";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLog, generateDescription } from "@/lib/audit-log";

// GET - List all categories with pagination and search
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";

        const skip = (page - 1) * limit;

        const where = search
            ? {
                name: {
                    contains: search,
                    mode: "insensitive" as const,
                },
            }
            : {};

        const [categories, total] = await Promise.all([
            prisma.category.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.category.count({ where }),
        ]);

        return NextResponse.json({
            data: categories,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data kategori" },
            { status: 500 }
        );
    }
}

// POST - Create new category
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validationResult = kategoriSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        // Check if name already exists
        const existing = await prisma.category.findUnique({
            where: { name: validationResult.data.name },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Nama kategori sudah ada" },
                { status: 400 }
            );
        }

        const category = await prisma.category.create({
            data: validationResult.data,
        });

        // Audit log
        const session = await getServerSession(authOptions);
        if (session?.user) {
            await createAuditLog({
                userId: session.user.id,
                userName: session.user.name || "",
                action: "CREATE",
                tableName: "Category",
                recordId: category.id,
                dataAfter: { name: category.name },
                description: generateDescription("CREATE", "Category", category.name),
            });
        }

        return NextResponse.json(
            { data: category, message: "Kategori berhasil ditambahkan" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating category:", error);
        return NextResponse.json(
            { error: "Gagal menambahkan kategori" },
            { status: 500 }
        );
    }
}
