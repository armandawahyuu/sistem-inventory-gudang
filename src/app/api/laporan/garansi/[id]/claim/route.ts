import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST - Claim warranty
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { claimReason } = body;

        const warranty = await prisma.warranty.findUnique({
            where: { id },
        });

        if (!warranty) {
            return NextResponse.json(
                { error: "Garansi tidak ditemukan" },
                { status: 404 }
            );
        }

        if (warranty.claimDate) {
            return NextResponse.json(
                { error: "Garansi sudah diklaim sebelumnya" },
                { status: 400 }
            );
        }

        const updatedWarranty = await prisma.warranty.update({
            where: { id },
            data: {
                claimDate: new Date(),
                claimNotes: claimReason || null,
                claimStatus: "claimed",
            },
        });

        return NextResponse.json({
            data: updatedWarranty,
            message: "Garansi berhasil diklaim",
        });
    } catch (error) {
        console.error("Error claiming warranty:", error);
        return NextResponse.json(
            { error: "Gagal mengklaim garansi" },
            { status: 500 }
        );
    }
}
