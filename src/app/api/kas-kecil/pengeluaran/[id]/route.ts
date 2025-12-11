import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Get single transaction
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const transaction = await prisma.pettyCash.findUnique({
            where: { id },
            include: {
                category: { select: { name: true } },
            },
        });

        if (!transaction) {
            return NextResponse.json(
                { error: "Transaksi tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: transaction });
    } catch (error) {
        console.error("Error fetching transaction:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data transaksi" },
            { status: 500 }
        );
    }
}

// DELETE - Delete transaction
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const transaction = await prisma.pettyCash.findUnique({
            where: { id },
        });

        if (!transaction) {
            return NextResponse.json(
                { error: "Transaksi tidak ditemukan" },
                { status: 404 }
            );
        }

        await prisma.pettyCash.delete({ where: { id } });

        return NextResponse.json({
            message: "Transaksi berhasil dihapus",
        });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return NextResponse.json(
            { error: "Gagal menghapus transaksi" },
            { status: 500 }
        );
    }
}
