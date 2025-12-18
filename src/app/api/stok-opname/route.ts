import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET - Fetch spareparts for opname with optional category filter
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId");
        const search = searchParams.get("search");

        const where: Record<string, unknown> = {};

        if (categoryId && categoryId !== "all") {
            where.categoryId = categoryId;
        }

        if (search) {
            where.OR = [
                { code: { contains: search, mode: "insensitive" } },
                { name: { contains: search, mode: "insensitive" } },
            ];
        }

        const spareparts = await prisma.sparepart.findMany({
            where,
            select: {
                id: true,
                code: true,
                name: true,
                unit: true,
                currentStock: true,
                rackLocation: true,
                category: {
                    select: { name: true },
                },
            },
            orderBy: [{ code: "asc" }],
        });

        return NextResponse.json({ data: spareparts });
    } catch (error) {
        console.error("Error fetching spareparts for opname:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data sparepart" },
            { status: 500 }
        );
    }
}

// POST - Save opname results
const opnameItemSchema = z.object({
    sparepartId: z.string(),
    systemStock: z.number(),
    physicalStock: z.number(),
    notes: z.string().optional(),
});

const saveOpnameSchema = z.object({
    notes: z.string().optional(),
    items: z.array(opnameItemSchema).min(1, "Minimal 1 item untuk disimpan"),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const parsed = saveOpnameSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Format data tidak valid", details: parsed.error.issues },
                { status: 400 }
            );
        }

        const { notes, items } = parsed.data;

        // Filter only items with difference
        const itemsWithDifference = items.filter(
            (item) => item.physicalStock !== item.systemStock
        );

        if (itemsWithDifference.length === 0) {
            return NextResponse.json(
                { error: "Tidak ada selisih stok yang perlu disimpan" },
                { status: 400 }
            );
        }

        // Use transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create opname header
            const opname = await tx.stockOpname.create({
                data: {
                    notes: notes || null,
                    status: "COMPLETED",
                },
            });

            let stockInCount = 0;
            let stockOutCount = 0;

            // Create opname items and adjust stock
            for (const item of itemsWithDifference) {
                const difference = item.physicalStock - item.systemStock;

                // Create opname item
                await tx.stockOpnameItem.create({
                    data: {
                        opnameId: opname.id,
                        sparepartId: item.sparepartId,
                        systemStock: item.systemStock,
                        physicalStock: item.physicalStock,
                        difference: difference,
                        notes: item.notes || null,
                    },
                });

                if (difference > 0) {
                    // Selisih positif: stok fisik > stok sistem
                    // Buat StockIn untuk penambahan
                    await tx.stockIn.create({
                        data: {
                            sparepartId: item.sparepartId,
                            quantity: difference,
                            notes: `Penyesuaian stok opname (ID: ${opname.id})${item.notes ? ` - ${item.notes}` : ""}`,
                            supplierId: null,
                            invoiceNumber: null,
                            purchasePrice: null,
                        },
                    });
                    stockInCount++;
                } else {
                    // Selisih negatif: stok fisik < stok sistem
                    // Buat StockOut dengan status approved untuk pengurangan
                    await tx.stockOut.create({
                        data: {
                            sparepartId: item.sparepartId,
                            quantity: Math.abs(difference),
                            purpose: `Penyesuaian stok opname (ID: ${opname.id})${item.notes ? ` - ${item.notes}` : ""}`,
                            status: "approved",
                            approvedAt: new Date(),
                            equipmentId: null,
                            employeeId: null,
                        },
                    });
                    stockOutCount++;
                }

                // Update sparepart stock
                await tx.sparepart.update({
                    where: { id: item.sparepartId },
                    data: { currentStock: item.physicalStock },
                });
            }

            return { opname, stockInCount, stockOutCount };
        });

        return NextResponse.json({
            message: "Hasil opname berhasil disimpan",
            opnameId: result.opname.id,
            adjustedCount: itemsWithDifference.length,
            stockInCreated: result.stockInCount,
            stockOutCreated: result.stockOutCount,
        });
    } catch (error) {
        console.error("Error saving opname:", error);
        return NextResponse.json(
            { error: "Gagal menyimpan hasil opname" },
            { status: 500 }
        );
    }
}
