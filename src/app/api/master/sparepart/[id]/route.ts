import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sparepartSchema } from "@/lib/validations/sparepart";

interface Params {
    params: Promise<{ id: string }>;
}

// GET - Get single sparepart
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        const sparepart = await prisma.sparepart.findUnique({
            where: { id },
            include: {
                category: true,
                compatibilities: true,
            },
        });

        if (!sparepart) {
            return NextResponse.json(
                { error: "Sparepart tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: sparepart });
    } catch (error) {
        console.error("Error fetching sparepart:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data sparepart" },
            { status: 500 }
        );
    }
}

// PUT - Update sparepart
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await request.json();

        const validationResult = sparepartSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const existing = await prisma.sparepart.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Sparepart tidak ditemukan" },
                { status: 404 }
            );
        }

        // Check duplicate code
        const duplicate = await prisma.sparepart.findFirst({
            where: {
                code: validationResult.data.code,
                NOT: { id },
            },
        });

        if (duplicate) {
            return NextResponse.json(
                { error: "Kode sparepart sudah ada" },
                { status: 400 }
            );
        }

        const data = {
            ...validationResult.data,
            brand: validationResult.data.brand || null,
            rackLocation: validationResult.data.rackLocation || null,
        };

        const sparepart = await prisma.sparepart.update({
            where: { id },
            data,
            include: { category: true },
        });

        return NextResponse.json({
            data: sparepart,
            message: "Sparepart berhasil diperbarui",
        });
    } catch (error) {
        console.error("Error updating sparepart:", error);
        return NextResponse.json(
            { error: "Gagal memperbarui sparepart" },
            { status: 500 }
        );
    }
}

// DELETE - Delete sparepart
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        const existing = await prisma.sparepart.findUnique({
            where: { id },
            include: {
                stockIns: { take: 1 },
                stockOuts: { take: 1 },
            },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Sparepart tidak ditemukan" },
                { status: 404 }
            );
        }

        if (existing.stockIns.length > 0 || existing.stockOuts.length > 0) {
            return NextResponse.json(
                { error: "Sparepart tidak dapat dihapus karena memiliki transaksi" },
                { status: 400 }
            );
        }

        await prisma.sparepart.delete({
            where: { id },
        });

        return NextResponse.json({
            message: "Sparepart berhasil dihapus",
        });
    } catch (error) {
        console.error("Error deleting sparepart:", error);
        return NextResponse.json(
            { error: "Gagal menghapus sparepart" },
            { status: 500 }
        );
    }
}
