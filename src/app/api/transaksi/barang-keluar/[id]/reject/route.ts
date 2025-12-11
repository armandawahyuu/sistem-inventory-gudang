import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { rejectSchema } from "@/lib/validations/stock-out";

// POST - Reject stock out request
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Validate input
        const validationResult = rejectSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const { reason } = validationResult.data;

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

        // Only allow reject if status is pending
        if (existing.status !== "pending") {
            return NextResponse.json(
                { error: "Hanya request dengan status pending yang dapat di-reject" },
                { status: 400 }
            );
        }

        // Update status to rejected
        const stockOut = await prisma.stockOut.update({
            where: { id },
            data: {
                status: "rejected",
                rejectedReason: reason,
            },
            include: {
                sparepart: { select: { code: true, name: true } },
                equipment: { select: { code: true, name: true } },
                employee: { select: { name: true } },
            },
        });

        return NextResponse.json({
            data: stockOut,
            message: "Request barang keluar ditolak",
        });
    } catch (error) {
        console.error("Error rejecting stock out:", error);
        return NextResponse.json(
            { error: "Gagal reject request barang keluar" },
            { status: 500 }
        );
    }
}
