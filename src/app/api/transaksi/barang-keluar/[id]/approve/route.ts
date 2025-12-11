import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST - Approve stock out request and deduct stock
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if stock out exists
        const existing = await prisma.stockOut.findUnique({
            where: { id },
            include: { sparepart: true },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Data barang keluar tidak ditemukan" },
                { status: 404 }
            );
        }

        // Only allow approve if status is pending
        if (existing.status !== "pending") {
            return NextResponse.json(
                { error: "Hanya request dengan status pending yang dapat di-approve" },
                { status: 400 }
            );
        }

        // Check if stock is still sufficient
        if (existing.sparepart.currentStock < existing.quantity) {
            return NextResponse.json(
                { error: `Stok tidak mencukupi. Stok tersedia: ${existing.sparepart.currentStock} ${existing.sparepart.unit}` },
                { status: 400 }
            );
        }

        // Use transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // Update stock out status
            const stockOut = await tx.stockOut.update({
                where: { id },
                data: {
                    status: "approved",
                    approvedAt: new Date(),
                    // approvedBy should be set from session, for now leaving it null
                },
                include: {
                    sparepart: { select: { code: true, name: true } },
                    equipment: { select: { code: true, name: true } },
                    employee: { select: { name: true } },
                },
            });

            // Deduct stock from sparepart
            await tx.sparepart.update({
                where: { id: existing.sparepartId },
                data: {
                    currentStock: { decrement: existing.quantity },
                },
            });

            return stockOut;
        });

        return NextResponse.json({
            data: result,
            message: "Request barang keluar berhasil di-approve, stok telah dikurangi",
        });
    } catch (error) {
        console.error("Error approving stock out:", error);
        return NextResponse.json(
            { error: "Gagal approve request barang keluar" },
            { status: 500 }
        );
    }
}
