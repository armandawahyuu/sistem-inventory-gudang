import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { pettyCashIncomeSchema } from "@/lib/validations/petty-cash";

// GET - List income transactions
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const dateFrom = searchParams.get("dateFrom") || "";
        const dateTo = searchParams.get("dateTo") || "";

        const skip = (page - 1) * limit;

        const where: any = {
            type: "in",
        };

        if (dateFrom) {
            where.date = { ...where.date, gte: new Date(dateFrom) };
        }
        if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);
            where.date = { ...where.date, lte: endDate };
        }

        const [transactions, total] = await Promise.all([
            prisma.pettyCash.findMany({
                where,
                skip,
                take: limit,
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
        console.error("Error fetching petty cash income:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data pemasukan" },
            { status: 500 }
        );
    }
}

// POST - Create income transaction
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validationResult = pettyCashIncomeSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const { date, amount, description } = validationResult.data;

        const transaction = await prisma.pettyCash.create({
            data: {
                date: new Date(date),
                type: "in",
                amount,
                description,
            },
        });

        return NextResponse.json({
            data: transaction,
            message: "Pemasukan berhasil ditambahkan",
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating petty cash income:", error);
        return NextResponse.json(
            { error: "Gagal menambahkan pemasukan" },
            { status: 500 }
        );
    }
}
