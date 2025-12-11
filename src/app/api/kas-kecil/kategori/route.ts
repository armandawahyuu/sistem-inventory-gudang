import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - List all categories
export async function GET() {
    try {
        const categories = await prisma.pettyCashCategory.findMany({
            orderBy: { name: "asc" },
        });

        return NextResponse.json({ data: categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data kategori" },
            { status: 500 }
        );
    }
}

// POST - Create category (for seeding)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Nama kategori wajib diisi" },
                { status: 400 }
            );
        }

        const existing = await prisma.pettyCashCategory.findUnique({
            where: { name },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Kategori sudah ada" },
                { status: 400 }
            );
        }

        const category = await prisma.pettyCashCategory.create({
            data: { name },
        });

        return NextResponse.json({
            data: category,
            message: "Kategori berhasil ditambahkan",
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating category:", error);
        return NextResponse.json(
            { error: "Gagal menambahkan kategori" },
            { status: 500 }
        );
    }
}
