import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sparepartImportSchema } from "@/lib/validations/import-schemas";
import { z } from "zod";

// Request body schema
const requestSchema = z.object({
    data: z.array(z.object({
        code: z.string(),
        name: z.string(),
        categoryName: z.string(),
        brand: z.string().optional(),
        unit: z.string(),
        minStock: z.string().optional(),
        location: z.string().optional(),
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
            // Get existing sparepart codes for duplicate check
            const existingSpareparts = await tx.sparepart.findMany({
                select: { code: true },
            });
            const existingCodes = new Set(
                existingSpareparts.map((s) => s.code.toLowerCase())
            );

            // Get all categories for lookup
            const categories = await tx.category.findMany({
                select: { id: true, name: true },
            });
            const categoryMap = new Map(
                categories.map((c) => [c.name.toLowerCase(), c.id])
            );

            // Process each row
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const rowNumber = i + 4;

                try {
                    // Validate with Zod schema
                    const validated = sparepartImportSchema.parse(row);

                    // Check if code already exists
                    if (existingCodes.has(validated.code.toLowerCase())) {
                        skipped++;
                        continue;
                    }

                    // Lookup category by name
                    const categoryId = categoryMap.get(validated.categoryName.toLowerCase());
                    if (!categoryId) {
                        rowErrors.push({
                            row: rowNumber,
                            data: row,
                            errors: [`Kategori "${validated.categoryName}" tidak ditemukan di master`],
                        });
                        continue;
                    }

                    // Create sparepart with currentStock = 0
                    await tx.sparepart.create({
                        data: {
                            code: validated.code,
                            name: validated.name,
                            categoryId: categoryId,
                            brand: validated.brand || null,
                            unit: validated.unit,
                            minStock: validated.minStock,
                            currentStock: 0,
                            rackLocation: validated.location || null,
                        },
                    });

                    existingCodes.add(validated.code.toLowerCase());
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
                    type: "sparepart",
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
        console.error("Error importing sparepart:", error);
        return NextResponse.json(
            { error: "Gagal melakukan import" },
            { status: 500 }
        );
    }
}
