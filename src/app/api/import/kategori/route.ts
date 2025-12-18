import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { kategoriImportSchema } from "@/lib/validations/import-schemas";
import { z } from "zod";

// Request body schema
const requestSchema = z.object({
    data: z.array(z.object({
        name: z.string(),
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
            // Get existing categories for duplicate check
            const existingCategories = await tx.category.findMany({
                select: { name: true },
            });
            const existingNames = new Set(
                existingCategories.map((c) => c.name.toLowerCase())
            );

            // Process each row
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const rowNumber = i + 4; // Assuming data starts from row 4

                try {
                    // Validate with Zod schema
                    const validated = kategoriImportSchema.parse(row);

                    // Check if already exists
                    if (existingNames.has(validated.name.toLowerCase())) {
                        skipped++;
                        continue;
                    }

                    // Create category
                    await tx.category.create({
                        data: {
                            name: validated.name,
                        },
                    });

                    // Add to existing set to prevent duplicates in same batch
                    existingNames.add(validated.name.toLowerCase());
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
                    type: "kategori",
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
            errors: rowErrors.slice(0, 10), // Limit errors shown in response
        });
    } catch (error) {
        console.error("Error importing kategori:", error);
        return NextResponse.json(
            { error: "Gagal melakukan import" },
            { status: 500 }
        );
    }
}
