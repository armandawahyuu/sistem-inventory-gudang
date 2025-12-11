import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "File tidak ditemukan" },
                { status: 400 }
            );
        }

        // Read Excel file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return NextResponse.json(
                { error: "File Excel kosong" },
                { status: 400 }
            );
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[],
        };

        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row: any = data[i];

            try {
                // Map Excel columns to database fields
                const equipmentData = {
                    code: String(row["Kode Unit"] || row["code"] || "").trim(),
                    name: String(row["Nama"] || row["name"] || "").trim(),
                    type: String(row["Tipe"] || row["type"] || "").trim(),
                    brand: String(row["Merk"] || row["brand"] || "").trim(),
                    model: String(row["Model"] || row["model"] || "").trim(),
                    year: row["Tahun"] || row["year"] ? parseInt(String(row["Tahun"] || row["year"])) : null,
                    site: row["Lokasi"] || row["site"] ? String(row["Lokasi"] || row["site"]).trim() : null,
                    status: String(row["Status"] || row["status"] || "active").toLowerCase(),
                };

                // Validate required fields
                if (!equipmentData.code || !equipmentData.name || !equipmentData.type || !equipmentData.brand || !equipmentData.model) {
                    results.failed++;
                    results.errors.push(`Baris ${i + 2}: Data tidak lengkap`);
                    continue;
                }

                // Check if code already exists
                const existing = await prisma.heavyEquipment.findUnique({
                    where: { code: equipmentData.code },
                });

                if (existing) {
                    results.failed++;
                    results.errors.push(`Baris ${i + 2}: Kode ${equipmentData.code} sudah ada`);
                    continue;
                }

                // Create equipment
                await prisma.heavyEquipment.create({
                    data: equipmentData,
                });

                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push(`Baris ${i + 2}: ${error instanceof Error ? error.message : "Gagal menyimpan"}`);
            }
        }

        return NextResponse.json({
            message: `Berhasil import ${results.success} data, gagal ${results.failed} data`,
            results,
        });
    } catch (error) {
        console.error("Error importing Excel:", error);
        return NextResponse.json(
            { error: "Gagal import data dari Excel" },
            { status: 500 }
        );
    }
}
