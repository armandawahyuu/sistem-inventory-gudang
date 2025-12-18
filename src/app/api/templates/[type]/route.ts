import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// Template configurations for each type
const templateConfigs: Record<string, {
    sheetName: string;
    columns: { key: string; label: string; width: number; required: boolean; format: string }[];
    exampleData: Record<string, string | number>;
}> = {
    kategori: {
        sheetName: "Kategori",
        columns: [
            { key: "name", label: "Nama Kategori", width: 30, required: true, format: "(teks, wajib diisi)" },
        ],
        exampleData: { name: "Filter Oli" },
    },
    supplier: {
        sheetName: "Supplier",
        columns: [
            { key: "name", label: "Nama Supplier", width: 30, required: true, format: "(teks, wajib)" },
            { key: "phone", label: "Telepon", width: 20, required: false, format: "(angka)" },
            { key: "email", label: "Email", width: 30, required: false, format: "(email)" },
            { key: "address", label: "Alamat", width: 40, required: false, format: "(teks)" },
        ],
        exampleData: {
            name: "PT Sumber Jaya",
            phone: "021-12345678",
            email: "info@supplier.com",
            address: "Jl. Raya No. 1"
        },
    },
    "alat-berat": {
        sheetName: "Alat Berat",
        columns: [
            { key: "code", label: "Kode Unit", width: 15, required: true, format: "(unik, wajib)" },
            { key: "name", label: "Nama", width: 20, required: true, format: "(teks)" },
            { key: "type", label: "Tipe", width: 20, required: true, format: "(Excavator/Bulldozer/Wheel Loader/dll)" },
            { key: "brand", label: "Merk", width: 15, required: true, format: "(teks)" },
            { key: "model", label: "Model", width: 15, required: true, format: "(teks)" },
            { key: "year", label: "Tahun", width: 10, required: false, format: "(angka)" },
            { key: "siteLocation", label: "Lokasi Site", width: 15, required: false, format: "(teks)" },
            { key: "status", label: "Status", width: 15, required: false, format: "(active/maintenance/inactive)" },
        ],
        exampleData: {
            code: "HE-001",
            name: "Excavator 01",
            type: "Excavator",
            brand: "Komatsu",
            model: "PC200-8",
            year: 2020,
            siteLocation: "Site A",
            status: "active"
        },
    },
    sparepart: {
        sheetName: "Sparepart",
        columns: [
            { key: "code", label: "Kode", width: 15, required: true, format: "(unik, wajib)" },
            { key: "name", label: "Nama", width: 30, required: true, format: "(teks)" },
            { key: "categoryName", label: "Kategori", width: 20, required: true, format: "(harus ada di master)" },
            { key: "brand", label: "Merk", width: 15, required: false, format: "(teks)" },
            { key: "unit", label: "Satuan", width: 15, required: true, format: "(pcs/liter/set/meter/kg)" },
            { key: "minStock", label: "Stok Minimum", width: 15, required: false, format: "(angka)" },
            { key: "location", label: "Lokasi Rak", width: 15, required: false, format: "(teks)" },
        ],
        exampleData: {
            code: "SP-001",
            name: "Filter Oli Komatsu",
            categoryName: "Filter Oli",
            brand: "Komatsu",
            unit: "pcs",
            minStock: 10,
            location: "R1-A1"
        },
    },
    karyawan: {
        sheetName: "Karyawan",
        columns: [
            { key: "nik", label: "NIK", width: 15, required: true, format: "(unik, wajib)" },
            { key: "name", label: "Nama", width: 25, required: true, format: "(teks)" },
            { key: "position", label: "Jabatan", width: 25, required: true, format: "(Mekanik/Staff Gudang/Operator/Helper)" },
            { key: "department", label: "Departemen", width: 20, required: false, format: "(teks)" },
            { key: "phone", label: "Telepon", width: 15, required: false, format: "(angka)" },
        ],
        exampleData: {
            nik: "001",
            name: "Budi Santoso",
            position: "Mekanik",
            department: "Maintenance",
            phone: "08123456789"
        },
    },
    "stok-awal": {
        sheetName: "Stok Awal",
        columns: [
            { key: "sparepartCode", label: "Kode Sparepart", width: 20, required: true, format: "(harus ada di master)" },
            { key: "quantity", label: "Jumlah Stok", width: 15, required: true, format: "(angka, min 0)" },
            { key: "notes", label: "Keterangan", width: 35, required: false, format: "(teks, opsional)" },
        ],
        exampleData: {
            sparepartCode: "SP-001",
            quantity: 50,
            notes: "Stok awal migrasi"
        },
    },
};

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ type: string }> }
) {
    try {
        const { type } = await context.params;

        const config = templateConfigs[type];

        if (!config) {
            return NextResponse.json(
                { error: `Template type '${type}' not found. Valid types: ${Object.keys(templateConfigs).join(", ")}` },
                { status: 404 }
            );
        }

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Row 1: Headers with * for required columns
        const headerRow = config.columns.map((col) =>
            col.required ? `${col.label}*` : col.label
        );

        // Row 2: Example data
        const exampleRow = config.columns.map((col) =>
            config.exampleData[col.key] ?? ""
        );

        // Row 3: Format descriptions in parentheses
        const formatRow = config.columns.map((col) => col.format);

        // Combine all rows
        const sheetData = [headerRow, exampleRow, formatRow];
        const mainSheet = XLSX.utils.aoa_to_sheet(sheetData);

        // Set column widths
        mainSheet["!cols"] = config.columns.map((col) => ({ wch: col.width }));

        XLSX.utils.book_append_sheet(workbook, mainSheet, config.sheetName);

        // Create instructions sheet
        const instructionsData = [
            ["PETUNJUK PENGISIAN TEMPLATE"],
            [""],
            ["FORMAT TEMPLATE:"],
            ["Baris 1 : Header kolom (kolom wajib ditandai dengan *)"],
            ["Baris 2 : Contoh data (hapus sebelum import)"],
            ["Baris 3 : Keterangan format (hapus sebelum import)"],
            [""],
            ["CATATAN PENTING:"],
            ["1. Hapus baris 2 dan 3 sebelum import"],
            ["2. Jangan ubah nama kolom di header"],
            ["3. Kolom bertanda * wajib diisi"],
            ["4. Simpan dalam format .xlsx"],
        ];

        const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
        instructionsSheet["!cols"] = [{ wch: 50 }];
        XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Petunjuk");

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        // Return as downloadable file
        const fileName = `template-${type}.xlsx`;

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        console.error("Error generating template:", error);
        return NextResponse.json(
            { error: "Gagal generate template" },
            { status: 500 }
        );
    }
}
