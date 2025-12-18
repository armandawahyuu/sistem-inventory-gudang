"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, FileSpreadsheet, Package, Truck, Car, Wrench, Users, Boxes, History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ImportSection, ColumnSchema } from "./components/import-section";

interface ImportTabConfig {
    value: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    endpoint: string;
    columns: ColumnSchema[];
    exampleData: Record<string, string>[];
}

const importTabs: ImportTabConfig[] = [
    {
        value: "kategori",
        label: "Kategori",
        icon: Package,
        description: "Import data kategori sparepart",
        endpoint: "/api/import/kategori",
        columns: [
            { key: "name", label: "Nama Kategori", required: true, minLength: 2, maxLength: 100 },
        ],
        exampleData: [
            { name: "Filter" },
            { name: "Oli" },
            { name: "Bearing" },
        ],
    },
    {
        value: "supplier",
        label: "Supplier",
        icon: Truck,
        description: "Import data supplier",
        endpoint: "/api/import/supplier",
        columns: [
            { key: "name", label: "Nama Supplier", required: true, minLength: 2 },
            { key: "address", label: "Alamat", required: false },
            { key: "phone", label: "Telepon", required: false },
            { key: "email", label: "Email", required: false, type: "email" },
        ],
        exampleData: [
            { name: "PT Maju Jaya", address: "Jl. Industri No. 1", phone: "021-1234567", email: "info@majujaya.com" },
        ],
    },
    {
        value: "alat-berat",
        label: "Alat Berat",
        icon: Car,
        description: "Import data alat berat/unit",
        endpoint: "/api/import/alat-berat",
        columns: [
            { key: "code", label: "Kode Unit", required: true },
            { key: "name", label: "Nama Unit", required: true },
            { key: "type", label: "Tipe", required: true },
            { key: "brand", label: "Merk", required: false },
            { key: "model", label: "Model", required: false },
            { key: "year", label: "Tahun", required: false, type: "number" },
            { key: "status", label: "Status", required: true },
        ],
        exampleData: [
            { code: "EX-001", name: "Excavator Hitachi", type: "Excavator", brand: "Hitachi", model: "ZX200", year: "2020", status: "ACTIVE" },
        ],
    },
    {
        value: "sparepart",
        label: "Sparepart",
        icon: Wrench,
        description: "Import data master sparepart",
        endpoint: "/api/import/sparepart",
        columns: [
            { key: "partNumber", label: "Part Number", required: true },
            { key: "name", label: "Nama Sparepart", required: true, minLength: 2 },
            { key: "categoryName", label: "Nama Kategori", required: true },
            { key: "unit", label: "Satuan", required: true },
            { key: "minStock", label: "Stok Minimum", required: false, type: "number" },
            { key: "location", label: "Lokasi", required: false },
        ],
        exampleData: [
            { partNumber: "FIL-001", name: "Filter Oli", categoryName: "Filter", unit: "Pcs", minStock: "5", location: "Rak A1" },
        ],
    },
    {
        value: "karyawan",
        label: "Karyawan",
        icon: Users,
        description: "Import data karyawan",
        endpoint: "/api/import/karyawan",
        columns: [
            { key: "employeeId", label: "ID Karyawan", required: true },
            { key: "name", label: "Nama", required: true, minLength: 2 },
            { key: "position", label: "Jabatan", required: false },
            { key: "department", label: "Departemen", required: false },
            { key: "phone", label: "No. HP", required: false },
        ],
        exampleData: [
            { employeeId: "EMP-001", name: "Budi Santoso", position: "Mekanik", department: "Maintenance", phone: "08123456789" },
        ],
    },
    {
        value: "stok-awal",
        label: "Stok Awal",
        icon: Boxes,
        description: "Import stok awal untuk migrasi data",
        endpoint: "/api/import/stok-awal",
        columns: [
            { key: "partNumber", label: "Part Number", required: true },
            { key: "quantity", label: "Jumlah", required: true, type: "number" },
            { key: "unitPrice", label: "Harga Satuan", required: false, type: "number" },
            { key: "notes", label: "Catatan", required: false },
        ],
        exampleData: [
            { partNumber: "FIL-001", quantity: "100", unitPrice: "50000", notes: "Stok awal migrasi" },
        ],
    },
];

export default function ImportDataPage() {
    const [activeTab, setActiveTab] = useState("kategori");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                        <Upload className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Import Data</h1>
                        <p className="text-slate-600 mt-1">
                            Import data dari file Excel untuk migrasi data existing
                        </p>
                    </div>
                </div>
                <Link href="/settings/import/history">
                    <Button variant="outline">
                        <History className="h-4 w-4 mr-2" />
                        History Import
                    </Button>
                </Link>
            </div>

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium">Petunjuk Import:</p>
                            <ul className="mt-2 space-y-1 list-disc list-inside">
                                <li>Download template Excel terlebih dahulu</li>
                                <li>Isi data sesuai format yang ditentukan</li>
                                <li>Upload file Excel (.xlsx atau .xls)</li>
                                <li>Periksa validasi data - perbaiki jika ada error</li>
                                <li>Hanya data yang valid yang akan di-import</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6">
                    {importTabs.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                            <tab.icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {importTabs.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <tab.icon className="h-5 w-5" />
                                    Import {tab.label}
                                </CardTitle>
                                <CardDescription>{tab.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ImportSection
                                    title={`Import ${tab.label}`}
                                    columns={tab.columns}
                                    importEndpoint={tab.endpoint}
                                    exampleData={tab.exampleData}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
