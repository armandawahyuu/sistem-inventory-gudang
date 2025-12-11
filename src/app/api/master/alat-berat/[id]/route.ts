import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { alatBeratSchema } from "@/lib/validations/alat-berat";

interface Params {
    params: Promise<{ id: string }>;
}

// GET - Get single heavy equipment
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        const equipment = await prisma.heavyEquipment.findUnique({
            where: { id },
        });

        if (!equipment) {
            return NextResponse.json(
                { error: "Alat berat tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: equipment });
    } catch (error) {
        console.error("Error fetching heavy equipment:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data alat berat" },
            { status: 500 }
        );
    }
}

// PUT - Update heavy equipment
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Validate input
        const validationResult = alatBeratSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        // Check if equipment exists
        const existing = await prisma.heavyEquipment.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Alat berat tidak ditemukan" },
                { status: 404 }
            );
        }

        // Check if code already exists (exclude current)
        const duplicate = await prisma.heavyEquipment.findFirst({
            where: {
                code: validationResult.data.code,
                NOT: { id },
            },
        });

        if (duplicate) {
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

        const equipment = await prisma.heavyEquipment.update({
            where: { id },
            data,
        });

        return NextResponse.json({
            data: equipment,
            message: "Alat berat berhasil diperbarui",
        });
    } catch (error) {
        console.error("Error updating heavy equipment:", error);
        return NextResponse.json(
            { error: "Gagal memperbarui alat berat" },
            { status: 500 }
        );
    }
}

// DELETE - Delete heavy equipment
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        // Check if equipment exists
        const existing = await prisma.heavyEquipment.findUnique({
            where: { id },
            include: { stockOuts: { take: 1 } },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Alat berat tidak ditemukan" },
                { status: 404 }
            );
        }

        // Check if equipment has stock transactions
        if (existing.stockOuts.length > 0) {
            return NextResponse.json(
                { error: "Alat berat tidak dapat dihapus karena masih memiliki transaksi barang keluar" },
                { status: 400 }
            );
        }

        await prisma.heavyEquipment.delete({
            where: { id },
        });

        return NextResponse.json({
            message: "Alat berat berhasil dihapus",
        });
    } catch (error) {
        console.error("Error deleting heavy equipment:", error);
        return NextResponse.json(
            { error: "Gagal menghapus alat berat" },
            { status: 500 }
        );
    }
}
