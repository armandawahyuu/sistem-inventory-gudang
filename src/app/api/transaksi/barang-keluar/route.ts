import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { stockOutSchema } from "@/lib/validations/stock-out";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLog, generateDescription } from "@/lib/audit-log";

// GET - List all stock outs with pagination, search, and filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || ""; // all, pending, approved, rejected
        const dateFrom = searchParams.get("dateFrom") || "";
        const dateTo = searchParams.get("dateTo") || "";

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { sparepart: { code: { contains: search, mode: "insensitive" as const } } },
                { sparepart: { name: { contains: search, mode: "insensitive" as const } } },
                { employee: { name: { contains: search, mode: "insensitive" as const } } },
            ];
        }

        if (status && status !== "all") {
            where.status = status;
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                where.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                where.createdAt.lte = endDate;
            }
        }

        const [stockOuts, total] = await Promise.all([
            prisma.stockOut.findMany({
                where,
                skip,
                take: limit,
                include: {
                    sparepart: { select: { code: true, name: true, unit: true } },
                    equipment: { select: { code: true, name: true, type: true } },
                    employee: { select: { nik: true, name: true, position: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.stockOut.count({ where }),
        ]);

        return NextResponse.json({
            data: stockOuts,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching stock outs:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data barang keluar" },
            { status: 500 }
        );
    }
}

// POST - Create new stock out request (status: pending)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validationResult = stockOutSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const { sparepartId, equipmentId, employeeId, quantity, purpose, scannedBarcode } = validationResult.data;

        // Check if sparepart exists and has enough stock
        const sparepart = await prisma.sparepart.findUnique({
            where: { id: sparepartId },
        });

        if (!sparepart) {
            return NextResponse.json(
                { error: "Sparepart tidak ditemukan" },
                { status: 404 }
            );
        }

        if (sparepart.currentStock < quantity) {
            return NextResponse.json(
                { error: `Stok tidak mencukupi. Stok tersedia: ${sparepart.currentStock} ${sparepart.unit}` },
                { status: 400 }
            );
        }

        // Check if equipment exists
        const equipment = await prisma.heavyEquipment.findUnique({
            where: { id: equipmentId },
        });

        if (!equipment) {
            return NextResponse.json(
                { error: "Unit alat berat tidak ditemukan" },
                { status: 404 }
            );
        }

        // Check if employee exists
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
        });

        if (!employee) {
            return NextResponse.json(
                { error: "Karyawan tidak ditemukan" },
                { status: 404 }
            );
        }

        // Create stock out with pending status
        const stockOut = await prisma.stockOut.create({
            data: {
                sparepartId,
                equipmentId,
                employeeId,
                quantity,
                purpose: purpose || null,
                scannedBarcode: scannedBarcode || null,
                status: "pending",
            },
            include: {
                sparepart: { select: { code: true, name: true } },
                equipment: { select: { code: true, name: true } },
                employee: { select: { name: true } },
            },
        });

        // Audit log
        const session = await getServerSession(authOptions);
        if (session?.user) {
            await createAuditLog({
                userId: session.user.id,
                userName: session.user.name || "",
                action: "CREATE",
                tableName: "StockOut",
                recordId: stockOut.id,
                dataAfter: { sparepart: sparepart.name, quantity, equipment: equipment.code },
                description: generateDescription("CREATE", "StockOut", `${sparepart.name} (-${quantity}) untuk ${equipment.code}`),
            });
        }

        return NextResponse.json(
            { data: stockOut, message: "Request barang keluar berhasil dibuat" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating stock out:", error);
        return NextResponse.json(
            { error: "Gagal membuat request barang keluar" },
            { status: 500 }
        );
    }
}
