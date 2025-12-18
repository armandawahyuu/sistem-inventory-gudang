/**
 * Audit Logger Library
 * Append-only audit trail for all CRUD activities
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ============================================
// TYPES
// ============================================

export type AuditAction =
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "LOGIN"
    | "LOGOUT"
    | "EXPORT"
    | "IMPORT"
    | "VIEW"
    | "APPROVE"
    | "REJECT";

export interface AuditLogInput {
    userId: string;
    userName?: string;
    action: AuditAction;
    tableName: string;
    recordId?: string;
    dataBefore?: Record<string, unknown> | null;
    dataAfter?: Record<string, unknown> | null;
    ipAddress?: string;
    userAgent?: string;
    description?: string;
}

// ============================================
// AUDIT LOGGING
// ============================================

/**
 * Create an audit log entry
 * This is append-only - entries cannot be modified or deleted
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: input.userId,
                userName: input.userName,
                action: input.action,
                tableName: input.tableName,
                recordId: input.recordId,
                dataBefore: input.dataBefore as Prisma.InputJsonValue,
                dataAfter: input.dataAfter as Prisma.InputJsonValue,
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
                description: input.description,
            },
        });
    } catch (error) {
        // Log error but don't throw - audit logging should not break the main flow
        console.error("[AuditLog] Failed to create log:", error);
    }
}

/**
 * Log a CREATE action
 */
export async function logCreate(
    userId: string,
    userName: string,
    tableName: string,
    recordId: string,
    data: Record<string, unknown>,
    context?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
    await createAuditLog({
        userId,
        userName,
        action: "CREATE",
        tableName,
        recordId,
        dataAfter: sanitizeForLog(data),
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        description: `Created ${tableName} record`,
    });
}

/**
 * Log an UPDATE action
 */
export async function logUpdate(
    userId: string,
    userName: string,
    tableName: string,
    recordId: string,
    dataBefore: Record<string, unknown>,
    dataAfter: Record<string, unknown>,
    context?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
    await createAuditLog({
        userId,
        userName,
        action: "UPDATE",
        tableName,
        recordId,
        dataBefore: sanitizeForLog(dataBefore),
        dataAfter: sanitizeForLog(dataAfter),
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        description: `Updated ${tableName} record`,
    });
}

/**
 * Log a DELETE action
 */
export async function logDelete(
    userId: string,
    userName: string,
    tableName: string,
    recordId: string,
    data: Record<string, unknown>,
    context?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
    await createAuditLog({
        userId,
        userName,
        action: "DELETE",
        tableName,
        recordId,
        dataBefore: sanitizeForLog(data),
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        description: `Deleted ${tableName} record`,
    });
}

/**
 * Log a LOGIN action
 */
export async function logLogin(
    userId: string,
    userName: string,
    success: boolean,
    context?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
    await createAuditLog({
        userId,
        userName,
        action: "LOGIN",
        tableName: "User",
        recordId: userId,
        dataAfter: { success },
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        description: success ? "Login successful" : "Login failed",
    });
}

/**
 * Log a LOGOUT action
 */
export async function logLogout(
    userId: string,
    userName: string,
    context?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
    await createAuditLog({
        userId,
        userName,
        action: "LOGOUT",
        tableName: "User",
        recordId: userId,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        description: "User logged out",
    });
}

/**
 * Log an EXPORT action
 */
export async function logExport(
    userId: string,
    userName: string,
    tableName: string,
    recordCount: number,
    context?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
    await createAuditLog({
        userId,
        userName,
        action: "EXPORT",
        tableName,
        dataAfter: { exportedRecords: recordCount },
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        description: `Exported ${recordCount} ${tableName} records`,
    });
}

/**
 * Log an IMPORT action
 */
export async function logImport(
    userId: string,
    userName: string,
    tableName: string,
    stats: { total: number; success: number; failed: number },
    context?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
    await createAuditLog({
        userId,
        userName,
        action: "IMPORT",
        tableName,
        dataAfter: stats,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        description: `Imported ${stats.success}/${stats.total} ${tableName} records`,
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Sanitize data for logging - remove sensitive fields
 */
function sanitizeForLog(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = ["password", "token", "secret", "key"];
    const result = { ...data };

    for (const field of sensitiveFields) {
        if (field in result) {
            result[field] = "[REDACTED]";
        }
    }

    return result;
}

/**
 * Get audit logs with pagination
 */
export async function getAuditLogs(options: {
    page?: number;
    limit?: number;
    userId?: string;
    tableName?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
}): Promise<{
    data: Awaited<ReturnType<typeof prisma.auditLog.findMany>>;
    total: number;
    page: number;
    totalPages: number;
}> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (options.userId) where.userId = options.userId;
    if (options.tableName) where.tableName = options.tableName;
    if (options.action) where.action = options.action;
    if (options.startDate || options.endDate) {
        where.createdAt = {};
        if (options.startDate) where.createdAt.gte = options.startDate;
        if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [data, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.auditLog.count({ where }),
    ]);

    return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

// ============================================
// DATA RETENTION
// ============================================

/**
 * Archive old audit logs (older than retention period)
 * Default: 365 days (1 year)
 * 
 * NOTE: In production, you'd move these to archive storage
 * rather than deleting. This is a placeholder.
 */
export async function archiveOldAuditLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // For now, we just count - in production, export to archive first
    const count = await prisma.auditLog.count({
        where: { createdAt: { lt: cutoffDate } },
    });

    console.log(`[AuditLog] ${count} logs older than ${retentionDays} days would be archived`);

    // DO NOT DELETE audit logs in production without archiving first!
    // This is just for reference:
    // await prisma.auditLog.deleteMany({ where: { createdAt: { lt: cutoffDate } } });

    return count;
}
