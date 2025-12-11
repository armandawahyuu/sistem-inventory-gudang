import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { karyawanSchema } from "@/lib/validations/karyawan";

// GET - List all karyawan with pagination, search, and filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const position = searchParams.get("position") || "";
        const status = searchParams.get("status") || ""; // all, active, inactive

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { nik: { contains: search, mode: "insensitive" as const } },
                { name: { contains: search, mode: "insensitive" as const } },
                { phone: { contains: search, mode: "insensitive" as const } },
            ];
        }

        if (position) {
            where.position = position;
        }

        if (status === "active") {
            where.isActive = true;
        } else if (status === "inactive") {
            where.isActive = false;
        }

        const [employees, total] = await Promise.all([
            prisma.employee.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.employee.count({ where }),
        ]);

        return NextResponse.json({
            data: employees,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching employees:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data karyawan" },
            { status: 500 }
        );
    }
}

// POST - Create new karyawan
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validationResult = karyawanSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        // Check if nik already exists
        const existing = await prisma.employee.findUnique({
            where: { nik: validationResult.data.nik },
        });

        if (existing) {
            return NextResponse.json(
                { error: "NIK sudah terdaftar" },
                { status: 400 }
            );
        }

        // Clean up data
        const data = {
            ...validationResult.data,
            department: validationResult.data.department || null,
            phone: validationResult.data.phone || null,
        };

        const employee = await prisma.employee.create({
            data,
        });

        return NextResponse.json(
            { data: employee, message: "Karyawan berhasil ditambahkan" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating employee:", error);
        return NextResponse.json(
            { error: "Gagal menambahkan karyawan" },
            { status: 500 }
        );
    }
}
