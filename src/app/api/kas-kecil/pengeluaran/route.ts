import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { pettyCashExpenseSchema } from "@/lib/validations/petty-cash";

// GET - List expense transactions
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const dateFrom = searchParams.get("dateFrom") || "";
        const dateTo = searchParams.get("dateTo") || "";
        const categoryId = searchParams.get("categoryId") || "";

        const skip = (page - 1) * limit;

        const where: any = {
            type: "out",
        };

        if (dateFrom) {
            where.date = { ...where.date, gte: new Date(dateFrom) };
        }
        if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);
            where.date = { ...where.date, lte: endDate };
        }
        if (categoryId) {
            where.categoryId = categoryId;
        }

        const [transactions, total] = await Promise.all([
            prisma.pettyCash.findMany({
                where,
                skip,
                take: limit,
                include: {
                    category: { select: { id: true, name: true } },
                },
                orderBy: { date: "desc" },
            }),
            prisma.pettyCash.count({ where }),
        ]);

        // Calculate current balance
        const [totalIn, totalOut] = await Promise.all([
            prisma.pettyCash.aggregate({
                where: { type: "in" },
                _sum: { amount: true },
            }),
            prisma.pettyCash.aggregate({
                where: { type: "out" },
                _sum: { amount: true },
            }),
        ]);

        const balance = (totalIn._sum.amount || 0) - (totalOut._sum.amount || 0);

        return NextResponse.json({
            data: transactions,
            balance,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching petty cash expenses:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data pengeluaran" },
            { status: 500 }
        );
    }
}

// POST - Create expense transaction
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validationResult = pettyCashExpenseSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const { date, categoryId, amount, description, receipt } = validationResult.data;

        // Check balance
        const [totalIn, totalOut] = await Promise.all([
            prisma.pettyCash.aggregate({
                where: { type: "in" },
                _sum: { amount: true },
            }),
            prisma.pettyCash.aggregate({
                where: { type: "out" },
                _sum: { amount: true },
            }),
        ]);

        const currentBalance = (totalIn._sum.amount || 0) - (totalOut._sum.amount || 0);

        if (amount > currentBalance) {
            return NextResponse.json(
                { error: `Saldo tidak mencukupi. Saldo saat ini: Rp ${currentBalance.toLocaleString("id-ID")}` },
                { status: 400 }
            );
        }

        // Check category exists
        const category = await prisma.pettyCashCategory.findUnique({
            where: { id: categoryId },
        });

        if (!category) {
            return NextResponse.json(
                { error: "Kategori tidak ditemukan" },
                { status: 400 }
            );
        }

        const transaction = await prisma.pettyCash.create({
            data: {
                date: new Date(date),
                type: "out",
                categoryId,
                amount,
                description,
                receipt: receipt || null,
            },
            include: {
                category: { select: { name: true } },
            },
        });

        return NextResponse.json({
            data: transaction,
            message: "Pengeluaran berhasil ditambahkan",
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating petty cash expense:", error);
        return NextResponse.json(
            { error: "Gagal menambahkan pengeluaran" },
            { status: 500 }
        );
    }
}
