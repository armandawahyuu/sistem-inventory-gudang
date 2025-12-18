import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch audit logs with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const action = searchParams.get("action") || "";
        const tableName = searchParams.get("tableName") || "";
        const userId = searchParams.get("userId") || "";
        const dateFrom = searchParams.get("dateFrom") || "";
        const dateTo = searchParams.get("dateTo") || "";
        const search = searchParams.get("search") || "";

        const skip = (page - 1) * limit;

        // Build where clause
        const where: Record<string, unknown> = {};

        if (action) {
            where.action = action;
        }

        if (tableName) {
            where.tableName = tableName;
        }

        if (userId) {
            where.userId = userId;
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
            }
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                (where.createdAt as Record<string, unknown>).lte = endDate;
            }
        }

        if (search) {
            where.OR = [
                { userName: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { recordId: { contains: search, mode: "insensitive" } },
            ];
        }

        // Fetch logs
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.auditLog.count({ where }),
        ]);

        // Get unique table names for filter
        const tableNames = await prisma.auditLog.groupBy({
            by: ["tableName"],
            orderBy: { tableName: "asc" },
        });

        // Get unique users for filter
        const users = await prisma.auditLog.groupBy({
            by: ["userId", "userName"],
            orderBy: { userName: "asc" },
        });

        return NextResponse.json({
            data: logs,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            filters: {
                tableNames: tableNames.map((t) => t.tableName),
                users: users.map((u) => ({ id: u.userId, name: u.userName })),
                actions: ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "EXPORT", "IMPORT"],
            },
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data audit log" },
            { status: 500 }
        );
    }
}
