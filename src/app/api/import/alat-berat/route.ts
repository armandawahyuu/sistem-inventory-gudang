import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { alatBeratImportSchema } from "@/lib/validations/import-schemas";
import { z } from "zod";

// Request body schema
const requestSchema = z.object({
    data: z.array(z.object({
        code: z.string(),
        name: z.string(),
        type: z.string(),
        brand: z.string(),
        model: z.string(),
        year: z.string().optional(),
        siteLocation: z.string().optional(),
        status: z.string().optional(),
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
            // Get existing equipment codes for duplicate check
            const existingEquipment = await tx.heavyEquipment.findMany({
                select: { code: true },
            });
            const existingCodes = new Set(
                existingEquipment.map((e) => e.code.toLowerCase())
            );

            // Process each row
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const rowNumber = i + 4;

                try {
                    // Validate with Zod schema
                    const validated = alatBeratImportSchema.parse(row);

                    // Check if code already exists
                    if (existingCodes.has(validated.code.toLowerCase())) {
                        skipped++;
                        continue;
                    }

                    // Create heavy equipment
                    await tx.heavyEquipment.create({
                        data: {
                            code: validated.code,
                            name: validated.name,
                            type: validated.type,
                            brand: validated.brand,
                            model: validated.model,
                            year: validated.year,
                            site: validated.siteLocation || null,
                            status: validated.status as string,
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
                    type: "alat-berat",
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
        console.error("Error importing alat berat:", error);
        return NextResponse.json(
            { error: "Gagal melakukan import" },
            { status: 500 }
        );
    }
}
