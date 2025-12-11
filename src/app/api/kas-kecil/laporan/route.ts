import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Get petty cash report
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get("month") || "");
        const year = parseInt(searchParams.get("year") || "");
        const dateFrom = searchParams.get("dateFrom") || "";
        const dateTo = searchParams.get("dateTo") || "";

        let startDate: Date;
        let endDate: Date;

        if (dateFrom && dateTo) {
            startDate = new Date(dateFrom);
            endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);
        } else if (month && year) {
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0, 23, 59, 59, 999);
        } else {
            // Default to current month
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        // Get opening balance (all transactions before startDate)
        const [incomeBeforePeriod, expenseBeforePeriod] = await Promise.all([
            prisma.pettyCash.aggregate({
                where: {
                    type: "in",
                    date: { lt: startDate },
                },
                _sum: { amount: true },
            }),
            prisma.pettyCash.aggregate({
                where: {
                    type: "out",
                    date: { lt: startDate },
                },
                _sum: { amount: true },
            }),
        ]);

        const openingBalance = (incomeBeforePeriod._sum.amount || 0) - (expenseBeforePeriod._sum.amount || 0);

        // Get transactions within period
        const transactions = await prisma.pettyCash.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                category: { select: { id: true, name: true } },
            },
            orderBy: { date: "asc" },
        });

        // Calculate totals within period
        let totalIncome = 0;
        let totalExpense = 0;
        const transactionsWithBalance = [];
        let runningBalance = openingBalance;

        for (const tx of transactions) {
            if (tx.type === "in") {
                totalIncome += tx.amount;
                runningBalance += tx.amount;
            } else {
                totalExpense += tx.amount;
                runningBalance -= tx.amount;
            }

            transactionsWithBalance.push({
                ...tx,
                runningBalance,
            });
        }

        const closingBalance = openingBalance + totalIncome - totalExpense;

        // Group expenses by category for pie chart
        const expenseByCategory = await prisma.pettyCash.groupBy({
            by: ["categoryId"],
            where: {
                type: "out",
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: { amount: true },
        });

        // Get category names
        const categories = await prisma.pettyCashCategory.findMany({
            select: { id: true, name: true },
        });
        const categoryMap = new Map(categories.map(c => [c.id, c.name]));

        const expenseChart = expenseByCategory.map(item => ({
            name: categoryMap.get(item.categoryId || "") || "Tanpa Kategori",
            value: item._sum.amount || 0,
        }));

        return NextResponse.json({
            data: {
                openingBalance,
                totalIncome,
                totalExpense,
                closingBalance,
                transactions: transactionsWithBalance,
                expenseChart,
                period: {
                    from: startDate.toISOString(),
                    to: endDate.toISOString(),
                },
            },
        });
    } catch (error) {
        console.error("Error fetching petty cash report:", error);
        return NextResponse.json(
            { error: "Gagal mengambil laporan kas kecil" },
            { status: 500 }
        );
    }
}
