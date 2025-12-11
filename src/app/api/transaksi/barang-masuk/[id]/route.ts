import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Get single stock in by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const stockIn = await prisma.stockIn.findUnique({
            where: { id },
            include: {
                sparepart: { select: { id: true, code: true, name: true, unit: true } },
                supplier: { select: { id: true, name: true } },
                warranty: { select: { expiryDate: true, claimStatus: true } },
            },
        });

        if (!stockIn) {
            return NextResponse.json(
                { error: "Data barang masuk tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: stockIn });
    } catch (error) {
        console.error("Error fetching stock in:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data barang masuk" },
            { status: 500 }
        );
    }
}

// DELETE - Delete stock in (with stock rollback)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if stock in exists
        const existing = await prisma.stockIn.findUnique({
            where: { id },
            include: { sparepart: true },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Data barang masuk tidak ditemukan" },
                { status: 404 }
            );
        }

        // Use transaction to ensure data consistency
        await prisma.$transaction(async (tx) => {
            // Delete warranty if exists (cascade should handle this, but just in case)
            await tx.warranty.deleteMany({
                where: { stockInId: id },
            });

            // Delete stock in record
            await tx.stockIn.delete({
                where: { id },
            });

            // Rollback sparepart stock
            await tx.sparepart.update({
                where: { id: existing.sparepartId },
                data: {
                    currentStock: { decrement: existing.quantity },
                },
            });
        });

        return NextResponse.json({
            message: "Data barang masuk berhasil dihapus",
        });
    } catch (error) {
        console.error("Error deleting stock in:", error);
        return NextResponse.json(
            { error: "Gagal menghapus data barang masuk" },
            { status: 500 }
        );
    }
}
