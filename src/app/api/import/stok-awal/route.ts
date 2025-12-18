import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { stokAwalImportSchema } from "@/lib/validations/import-schemas";
import { z } from "zod";

// Request body schema
const requestSchema = z.object({
    data: z.array(z.object({
        sparepartCode: z.string(),
        quantity: z.string(),
        notes: z.string().optional(),
    })),
    fileName: z.string().optional(),
});

interface RowError {
    row: number;
    data: Record<string, unknown>;
    errors: string[];
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        const parsed = requestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Format data tidak valid", details: parsed.error.issues },
                { status: 400 }
            );
        }

        const { data, fileName } = parsed.data;

        if (data.length === 0) {
            return NextResponse.json(
                { error: "Data kosong" },
                { status: 400 }
            );
        }

        let success = 0;
        let skipped = 0;
        const rowErrors: RowError[] = [];

        // Use transaction for data consistency
        await prisma.$transaction(async (tx) => {
            // Get all spareparts for lookup
            const spareparts = await tx.sparepart.findMany({
                select: { id: true, code: true, currentStock: true },
            });
            const sparepartMap = new Map(
                spareparts.map((s) => [s.code.toLowerCase(), { id: s.id, currentStock: s.currentStock }])
            );

            // Track processed sparepart codes to skip duplicates in same batch
            const processedCodes = new Set<string>();

            // Process each row
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const rowNumber = i + 4;

                try {
                    // Validate with Zod schema
                    const validated = stokAwalImportSchema.parse(row);
                    const codeKey = validated.sparepartCode.toLowerCase();

                    // Check if already processed in this batch
                    if (processedCodes.has(codeKey)) {
                        rowErrors.push({
                            row: rowNumber,
                            data: row,
                            errors: [`Kode sparepart "${validated.sparepartCode}" duplikat dalam file`],
                        });
                        continue;
                    }

                    // Lookup sparepart by code
                    const sparepartInfo = sparepartMap.get(codeKey);
                    if (!sparepartInfo) {
                        rowErrors.push({
                            row: rowNumber,
                            data: row,
                            errors: [`Sparepart dengan kode "${validated.sparepartCode}" tidak ditemukan di master`],
                        });
                        continue;
                    }

                    // Create StockIn record
                    await tx.stockIn.create({
                        data: {
                            sparepartId: sparepartInfo.id,
                            quantity: validated.quantity,
                            notes: validated.notes
                                ? `Stok awal - Migrasi Data: ${validated.notes}`
                                : "Stok awal - Migrasi Data",
                            purchasePrice: null,
                            invoiceNumber: null,
                            supplierId: null,
                        },
                    });

                    // Update currentStock in Sparepart
                    await tx.sparepart.update({
                        where: { id: sparepartInfo.id },
                        data: {
                            currentStock: sparepartInfo.currentStock + validated.quantity,
                        },
                    });

                    // Mark as processed
                    processedCodes.add(codeKey);
                    // Update local map for subsequent rows with same sparepart
                    sparepartMap.set(codeKey, {
                        id: sparepartInfo.id,
                        currentStock: sparepartInfo.currentStock + validated.quantity
                    });

                    success++;
                } catch (error) {
                    const errors: string[] = [];
                    if (error instanceof z.ZodError) {
                        error.issues.forEach((e) => errors.push(e.message));
                    } else if (error instanceof Error) {
                        errors.push(error.message);
                    } else {
                        errors.push("Error tidak diketahui");
                    }
                    rowErrors.push({ row: rowNumber, data: row, errors });
                }
            }

            // Log hasil import
            await tx.importLog.create({
                data: {
                    type: "stok-awal",
                    filename: fileName || null,
                    totalRows: data.length,
                    successRows: success,
                    skippedRows: skipped,
                    failedRows: rowErrors.length,
                    errors: rowErrors.length > 0 ? (rowErrors.slice(0, 50) as unknown as Prisma.InputJsonValue) : undefined,
                },
            });
        });

        return NextResponse.json({
            message: "Import selesai",
            success,
            skipped,
            failed: rowErrors.length,
            total: data.length,
            errors: rowErrors.slice(0, 10),
        });
    } catch (error) {
        console.error("Error importing stok awal:", error);
        return NextResponse.json(
            { error: "Gagal melakukan import" },
            { status: 500 }
        );
    }
}
