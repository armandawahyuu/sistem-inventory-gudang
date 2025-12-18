import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT" | "IMPORT";

interface AuditLogParams {
    userId: string;
    userName: string;
    action: AuditAction;
    tableName: string;
    recordId?: string;
    dataBefore?: Record<string, unknown>;
    dataAfter?: Record<string, unknown>;
    description?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
    try {
        const headersList = await headers();
        const ipAddress = headersList.get("x-forwarded-for") ||
            headersList.get("x-real-ip") ||
            "unknown";
        const userAgent = headersList.get("user-agent") || "unknown";

        await prisma.auditLog.create({
            data: {
                userId: params.userId,
                userName: params.userName,
                action: params.action,
                tableName: params.tableName,
                recordId: params.recordId,
                dataBefore: params.dataBefore as Prisma.InputJsonValue | undefined,
                dataAfter: params.dataAfter as Prisma.InputJsonValue | undefined,
                description: params.description,
                ipAddress: ipAddress.split(",")[0].trim(),
                userAgent,
            },
        });
    } catch (error) {
        // Don't throw - audit logging should not break main functionality
        console.error("Failed to create audit log:", error);
    }
}

/**
 * Helper to generate description for CRUD operations
 */
export function generateDescription(
    action: AuditAction,
    tableName: string,
    identifier?: string
): string {
    const tableNames: Record<string, string> = {
        User: "Pengguna",
        Sparepart: "Sparepart",
        HeavyEquipment: "Alat Berat",
        Category: "Kategori",
        Supplier: "Supplier",
        Employee: "Karyawan",
        StockIn: "Barang Masuk",
        StockOut: "Barang Keluar",
        PettyCash: "Kas Kecil",
        Attendance: "Absensi",
        PettyCashCategory: "Kategori Kas Kecil",
    };

    const displayTable = tableNames[tableName] || tableName;

    switch (action) {
        case "CREATE":
            return `Menambah ${displayTable}${identifier ? `: ${identifier}` : ""}`;
        case "UPDATE":
            return `Mengubah ${displayTable}${identifier ? `: ${identifier}` : ""}`;
        case "DELETE":
            return `Menghapus ${displayTable}${identifier ? `: ${identifier}` : ""}`;
        case "LOGIN":
            return `Login ke sistem`;
        case "LOGOUT":
            return `Logout dari sistem`;
        case "EXPORT":
            return `Export data ${displayTable}`;
        case "IMPORT":
            return `Import data ${displayTable}`;
        default:
            return `${action} ${displayTable}`;
    }
}

/**
 * Clean sensitive data from objects before logging
 */
export function sanitizeForAudit(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = ["password", "token", "secret", "apiKey", "accessToken"];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = "[REDACTED]";
        }
    }

    return sanitized;
}
