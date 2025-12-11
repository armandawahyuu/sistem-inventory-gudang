import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { kategoriSchema } from "@/lib/validations/kategori";

interface Params {
    params: Promise<{ id: string }>;
}

// GET - Get single category
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        const category = await prisma.category.findUnique({
            where: { id },
        });

        if (!category) {
            return NextResponse.json(
                { error: "Kategori tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: category });
    } catch (error) {
        console.error("Error fetching category:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data kategori" },
            { status: 500 }
        );
    }
}

// PUT - Update category
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Validate input
        const validationResult = kategoriSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        // Check if category exists
        const existing = await prisma.category.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Kategori tidak ditemukan" },
                { status: 404 }
            );
        }

        // Check if name already exists (exclude current)
        const duplicate = await prisma.category.findFirst({
            where: {
                name: validationResult.data.name,
                NOT: { id },
            },
        });

        if (duplicate) {
            return NextResponse.json(
                { error: "Nama kategori sudah ada" },
                { status: 400 }
            );
        }

        const category = await prisma.category.update({
            where: { id },
            data: validationResult.data,
        });

        return NextResponse.json({
            data: category,
            message: "Kategori berhasil diperbarui",
        });
    } catch (error) {
        console.error("Error updating category:", error);
        return NextResponse.json(
            { error: "Gagal memperbarui kategori" },
            { status: 500 }
        );
    }
}

// DELETE - Delete category
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        // Check if category exists
        const existing = await prisma.category.findUnique({
            where: { id },
            include: { spareparts: { take: 1 } },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Kategori tidak ditemukan" },
                { status: 404 }
            );
        }

        // Check if category has spareparts
        if (existing.spareparts.length > 0) {
            return NextResponse.json(
                { error: "Kategori tidak dapat dihapus karena masih memiliki sparepart" },
                { status: 400 }
            );
        }

        await prisma.category.delete({
            where: { id },
        });

        return NextResponse.json({
            message: "Kategori berhasil dihapus",
        });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json(
            { error: "Gagal menghapus kategori" },
            { status: 500 }
        );
    }
}
