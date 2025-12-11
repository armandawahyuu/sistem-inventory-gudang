import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Get single stock out by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const stockOut = await prisma.stockOut.findUnique({
            where: { id },
            include: {
                sparepart: { select: { id: true, code: true, name: true, unit: true, currentStock: true } },
                equipment: { select: { id: true, code: true, name: true, type: true } },
                employee: { select: { id: true, nik: true, name: true, position: true } },
            },
        });

        if (!stockOut) {
            return NextResponse.json(
                { error: "Data barang keluar tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: stockOut });
    } catch (error) {
        console.error("Error fetching stock out:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data barang keluar" },
            { status: 500 }
        );
    }
}

// DELETE - Delete stock out (only if pending)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if stock out exists
        const existing = await prisma.stockOut.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Data barang keluar tidak ditemukan" },
                { status: 404 }
            );
        }

        // Only allow delete if status is pending
        if (existing.status !== "pending") {
            return NextResponse.json(
                { error: "Hanya request dengan status pending yang dapat dihapus" },
                { status: 400 }
            );
        }

        await prisma.stockOut.delete({
            where: { id },
        });

        return NextResponse.json({
            message: "Request barang keluar berhasil dihapus",
        });
    } catch (error) {
        console.error("Error deleting stock out:", error);
        return NextResponse.json(
            { error: "Gagal menghapus data barang keluar" },
            { status: 500 }
        );
    }
}
