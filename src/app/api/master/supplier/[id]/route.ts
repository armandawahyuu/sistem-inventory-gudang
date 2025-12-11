import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supplierSchema } from "@/lib/validations/supplier";

interface Params {
    params: Promise<{ id: string }>;
}

// GET - Get single supplier
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        const supplier = await prisma.supplier.findUnique({
            where: { id },
        });

        if (!supplier) {
            return NextResponse.json(
                { error: "Supplier tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: supplier });
    } catch (error) {
        console.error("Error fetching supplier:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data supplier" },
            { status: 500 }
        );
    }
}

// PUT - Update supplier
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Validate input
        const validationResult = supplierSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        // Check if supplier exists
        const existing = await prisma.supplier.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Supplier tidak ditemukan" },
                { status: 404 }
            );
        }

        // Clean up empty strings to null
        const data = {
            ...validationResult.data,
            phone: validationResult.data.phone || null,
            email: validationResult.data.email || null,
            address: validationResult.data.address || null,
        };

        const supplier = await prisma.supplier.update({
            where: { id },
            data,
        });

        return NextResponse.json({
            data: supplier,
            message: "Supplier berhasil diperbarui",
        });
    } catch (error) {
        console.error("Error updating supplier:", error);
        return NextResponse.json(
            { error: "Gagal memperbarui supplier" },
            { status: 500 }
        );
    }
}

// DELETE - Delete supplier
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        // Check if supplier exists
        const existing = await prisma.supplier.findUnique({
            where: { id },
            include: { stockIns: { take: 1 } },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Supplier tidak ditemukan" },
                { status: 404 }
            );
        }

        // Check if supplier has stock transactions
        if (existing.stockIns.length > 0) {
            return NextResponse.json(
                { error: "Supplier tidak dapat dihapus karena masih memiliki transaksi barang masuk" },
                { status: 400 }
            );
        }

        await prisma.supplier.delete({
            where: { id },
        });

        return NextResponse.json({
            message: "Supplier berhasil dihapus",
        });
    } catch (error) {
        console.error("Error deleting supplier:", error);
        return NextResponse.json(
            { error: "Gagal menghapus supplier" },
            { status: 500 }
        );
    }
}
