/**
 * Security Logger Library
 * Comprehensive security event logging and monitoring
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ============================================
// EVENT TYPES
// ============================================

export const SECURITY_EVENTS = {
    // Authentication
    LOGIN_SUCCESS: "LOGIN_SUCCESS",
    LOGIN_FAILED: "LOGIN_FAILED",
    LOGOUT: "LOGOUT",
    PASSWORD_CHANGE: "PASSWORD_CHANGE",
    PASSWORD_RESET: "PASSWORD_RESET",
    ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
    ACCOUNT_UNLOCKED: "ACCOUNT_UNLOCKED",

    // Authorization
    AUTH_FAILED: "AUTH_FAILED",
    PERMISSION_DENIED: "PERMISSION_DENIED",

    // Rate Limiting
    RATE_LIMIT_HIT: "RATE_LIMIT_HIT",

    // Suspicious Activity
    SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
    MULTIPLE_404: "MULTIPLE_404",
    UNUSUAL_LOCATION: "UNUSUAL_LOCATION",
    OFF_HOURS_ACCESS: "OFF_HOURS_ACCESS",

    // Data Operations
    DATA_EXPORT: "DATA_EXPORT",
    BULK_EXPORT: "BULK_EXPORT",
    DATA_IMPORT: "DATA_IMPORT",

    // File Operations
    FILE_UPLOAD: "FILE_UPLOAD",
    FILE_DOWNLOAD: "FILE_DOWNLOAD",

    // Admin Actions
    ADMIN_ACTION: "ADMIN_ACTION",
    USER_CREATED: "USER_CREATED",
    USER_DELETED: "USER_DELETED",
    ROLE_CHANGED: "ROLE_CHANGED",
    SETTINGS_CHANGED: "SETTINGS_CHANGED",

    // Session
    SESSION_CREATED: "SESSION_CREATED",
    SESSION_EXPIRED: "SESSION_EXPIRED",
    SESSION_INVALIDATED: "SESSION_INVALIDATED",
} as const;

export type SecurityEventType = typeof SECURITY_EVENTS[keyof typeof SECURITY_EVENTS];

// ============================================
// RISK LEVELS
// ============================================

export const RISK_LEVELS = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    CRITICAL: "critical",
} as const;

export type RiskLevel = typeof RISK_LEVELS[keyof typeof RISK_LEVELS];

// Event to risk level mapping
const EVENT_RISK_MAP: Record<SecurityEventType, RiskLevel> = {
    [SECURITY_EVENTS.LOGIN_SUCCESS]: RISK_LEVELS.LOW,
    [SECURITY_EVENTS.LOGIN_FAILED]: RISK_LEVELS.MEDIUM,
    [SECURITY_EVENTS.LOGOUT]: RISK_LEVELS.LOW,
    [SECURITY_EVENTS.PASSWORD_CHANGE]: RISK_LEVELS.MEDIUM,
    [SECURITY_EVENTS.PASSWORD_RESET]: RISK_LEVELS.MEDIUM,
    [SECURITY_EVENTS.ACCOUNT_LOCKED]: RISK_LEVELS.HIGH,
    [SECURITY_EVENTS.ACCOUNT_UNLOCKED]: RISK_LEVELS.MEDIUM,
    [SECURITY_EVENTS.AUTH_FAILED]: RISK_LEVELS.MEDIUM,
    [SECURITY_EVENTS.PERMISSION_DENIED]: RISK_LEVELS.MEDIUM,
    [SECURITY_EVENTS.RATE_LIMIT_HIT]: RISK_LEVELS.HIGH,
    [SECURITY_EVENTS.SUSPICIOUS_ACTIVITY]: RISK_LEVELS.HIGH,
    [SECURITY_EVENTS.MULTIPLE_404]: RISK_LEVELS.MEDIUM,
    [SECURITY_EVENTS.UNUSUAL_LOCATION]: RISK_LEVELS.HIGH,
    [SECURITY_EVENTS.OFF_HOURS_ACCESS]: RISK_LEVELS.MEDIUM,
    [SECURITY_EVENTS.DATA_EXPORT]: RISK_LEVELS.LOW,
    [SECURITY_EVENTS.BULK_EXPORT]: RISK_LEVELS.MEDIUM,
    [SECURITY_EVENTS.DATA_IMPORT]: RISK_LEVELS.LOW,
    [SECURITY_EVENTS.FILE_UPLOAD]: RISK_LEVELS.LOW,
    [SECURITY_EVENTS.FILE_DOWNLOAD]: RISK_LEVELS.LOW,
    [SECURITY_EVENTS.ADMIN_ACTION]: RISK_LEVELS.MEDIUM,
    [SECURITY_EVENTS.USER_CREATED]: RISK_LEVELS.MEDIUM,
    [SECURITY_EVENTS.USER_DELETED]: RISK_LEVELS.HIGH,
    [SECURITY_EVENTS.ROLE_CHANGED]: RISK_LEVELS.HIGH,
    [SECURITY_EVENTS.SETTINGS_CHANGED]: RISK_LEVELS.MEDIUM,
    [SECURITY_EVENTS.SESSION_CREATED]: RISK_LEVELS.LOW,
    [SECURITY_EVENTS.SESSION_EXPIRED]: RISK_LEVELS.LOW,
    [SECURITY_EVENTS.SESSION_INVALIDATED]: RISK_LEVELS.LOW,
};

// ============================================
// LOGGING FUNCTIONS
// ============================================

export interface SecurityLogInput {
    eventType: SecurityEventType;
    userId?: string;
    userName?: string;
    ipAddress: string;
    userAgent?: string;
    details?: Record<string, unknown>;
    duration?: number;
    riskLevel?: RiskLevel;
}

/**
 * Log a security event
 */
export async function logSecurityEvent(input: SecurityLogInput): Promise<void> {
    try {
        // Determine risk level
        const riskLevel = input.riskLevel || EVENT_RISK_MAP[input.eventType] || RISK_LEVELS.LOW;

        // Sanitize details - remove sensitive data
        const sanitizedDetails = sanitizeDetails(input.details);

        await prisma.securityLog.create({
            data: {
                eventType: input.eventType,
                userId: input.userId,
                userName: input.userName,
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
                details: sanitizedDetails as Prisma.InputJsonValue,
                riskLevel,
                duration: input.duration,
            },
        });

        // Check for alerts
        await checkForAlerts(input.eventType, input.ipAddress, input.userId);
    } catch (error) {
        // Don't throw - logging should not break main flow
        console.error("[SecurityLogger] Failed to log event:", error);
    }
}

/**
 * Remove sensitive data from details
 */
function sanitizeDetails(details?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!details) return undefined;

    const sensitiveKeys = ["password", "token", "secret", "key", "authorization", "cookie"];
    const result = { ...details };

    for (const key of Object.keys(result)) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            result[key] = "[REDACTED]";
        }
    }

    return result;
}

// ============================================
// CONVENIENCE LOGGERS
// ============================================

export async function logLoginSuccess(
    userId: string,
    userName: string,
    ipAddress: string,
    userAgent?: string
): Promise<void> {
    await logSecurityEvent({
        eventType: SECURITY_EVENTS.LOGIN_SUCCESS,
        userId,
        userName,
        ipAddress,
        userAgent,
    });
}

export async function logLoginFailed(
    username: string,
    ipAddress: string,
    userAgent?: string,
    reason?: string
): Promise<void> {
    await logSecurityEvent({
        eventType: SECURITY_EVENTS.LOGIN_FAILED,
        userName: username,
        ipAddress,
        userAgent,
        details: { reason, attemptedUsername: username },
    });
}

export async function logLogout(
    userId: string,
    userName: string,
    ipAddress: string
): Promise<void> {
    await logSecurityEvent({
        eventType: SECURITY_EVENTS.LOGOUT,
        userId,
        userName,
        ipAddress,
    });
}

export async function logRateLimitHit(
    ipAddress: string,
    endpoint: string
): Promise<void> {
    await logSecurityEvent({
        eventType: SECURITY_EVENTS.RATE_LIMIT_HIT,
        ipAddress,
        details: { endpoint },
        riskLevel: RISK_LEVELS.HIGH,
    });
}

export async function logDataExport(
    userId: string,
    userName: string,
    ipAddress: string,
    dataType: string,
    recordCount: number
): Promise<void> {
    const isBulk = recordCount > 1000;
    await logSecurityEvent({
        eventType: isBulk ? SECURITY_EVENTS.BULK_EXPORT : SECURITY_EVENTS.DATA_EXPORT,
        userId,
        userName,
        ipAddress,
        details: { dataType, recordCount },
        riskLevel: isBulk ? RISK_LEVELS.MEDIUM : RISK_LEVELS.LOW,
    });
}

export async function logAdminAction(
    userId: string,
    userName: string,
    ipAddress: string,
    action: string,
    details?: Record<string, unknown>
): Promise<void> {
    await logSecurityEvent({
        eventType: SECURITY_EVENTS.ADMIN_ACTION,
        userId,
        userName,
        ipAddress,
        details: { action, ...details },
    });
}

// ============================================
// ALERTING
// ============================================

const ALERT_THRESHOLDS = {
    FAILED_LOGIN_PER_IP: 10, // per hour
    RATE_LIMIT_HITS: 5, // per hour
};

async function checkForAlerts(
    eventType: SecurityEventType,
    ipAddress: string,
    userId?: string
): Promise<void> {
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // Check for multiple failed logins from same IP
        if (eventType === SECURITY_EVENTS.LOGIN_FAILED) {
            const failedCount = await prisma.securityLog.count({
                where: {
                    eventType: SECURITY_EVENTS.LOGIN_FAILED,
                    ipAddress,
                    createdAt: { gte: oneHourAgo },
                },
            });

            if (failedCount >= ALERT_THRESHOLDS.FAILED_LOGIN_PER_IP) {
                await logSecurityEvent({
                    eventType: SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
                    ipAddress,
                    details: {
                        reason: `${failedCount} failed login attempts from this IP in the last hour`,
                        alertType: "BRUTE_FORCE_SUSPECTED",
                    },
                    riskLevel: RISK_LEVELS.CRITICAL,
                });
            }
        }

        // Check for multiple rate limit hits
        if (eventType === SECURITY_EVENTS.RATE_LIMIT_HIT) {
            const hitCount = await prisma.securityLog.count({
                where: {
                    eventType: SECURITY_EVENTS.RATE_LIMIT_HIT,
                    ipAddress,
                    createdAt: { gte: oneHourAgo },
                },
            });

            if (hitCount >= ALERT_THRESHOLDS.RATE_LIMIT_HITS) {
                await logSecurityEvent({
                    eventType: SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
                    ipAddress,
                    details: {
                        reason: `${hitCount} rate limit hits from this IP in the last hour`,
                        alertType: "POSSIBLE_ATTACK",
                    },
                    riskLevel: RISK_LEVELS.CRITICAL,
                });
            }
        }

        // Check for off-hours access
        if (eventType === SECURITY_EVENTS.LOGIN_SUCCESS && userId) {
            const hour = new Date().getHours();
            if (hour < 6 || hour > 22) { // Outside 6 AM - 10 PM
                await logSecurityEvent({
                    eventType: SECURITY_EVENTS.OFF_HOURS_ACCESS,
                    userId,
                    ipAddress,
                    details: { hour, reason: "Login outside normal business hours" },
                    riskLevel: RISK_LEVELS.MEDIUM,
                });
            }
        }
    } catch (error) {
        console.error("[SecurityLogger] Alert check failed:", error);
    }
}

// ============================================
// MONITORING QUERIES
// ============================================

/**
 * Get security dashboard stats
 */
export async function getSecurityStats(): Promise<{
    todayLogins: number;
    todayFailedLogins: number;
    activeSessions: number;
    highRiskEvents: number;
    recentEvents: Awaited<ReturnType<typeof prisma.securityLog.findMany>>;
}> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayLogins, todayFailedLogins, activeSessions, highRiskEvents, recentEvents] = await Promise.all([
        prisma.securityLog.count({
            where: {
                eventType: SECURITY_EVENTS.LOGIN_SUCCESS,
                createdAt: { gte: todayStart },
            },
        }),
        prisma.securityLog.count({
            where: {
                eventType: SECURITY_EVENTS.LOGIN_FAILED,
                createdAt: { gte: todayStart },
            },
        }),
        prisma.session.count({
            where: { expires: { gt: new Date() } },
        }),
        prisma.securityLog.count({
            where: {
                riskLevel: { in: [RISK_LEVELS.HIGH, RISK_LEVELS.CRITICAL] },
                createdAt: { gte: todayStart },
            },
        }),
        prisma.securityLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 20,
        }),
    ]);

    return {
        todayLogins,
        todayFailedLogins,
        activeSessions,
        highRiskEvents,
        recentEvents,
    };
}

/**
 * Get security logs with filters
 */
export async function getSecurityLogs(options: {
    page?: number;
    limit?: number;
    eventType?: string;
    riskLevel?: string;
    userId?: string;
    ipAddress?: string;
    startDate?: Date;
    endDate?: Date;
}): Promise<{
    data: Awaited<ReturnType<typeof prisma.securityLog.findMany>>;
    total: number;
    page: number;
    totalPages: number;
}> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.SecurityLogWhereInput = {};

    if (options.eventType) where.eventType = options.eventType;
    if (options.riskLevel) where.riskLevel = options.riskLevel;
    if (options.userId) where.userId = options.userId;
    if (options.ipAddress) where.ipAddress = { contains: options.ipAddress };
    if (options.startDate || options.endDate) {
        where.createdAt = {};
        if (options.startDate) where.createdAt.gte = options.startDate;
        if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [data, total] = await Promise.all([
        prisma.securityLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.securityLog.count({ where }),
    ]);

    return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Clean up old security logs (retention: 90 days)
 */
export async function cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.securityLog.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
    });

    return result.count;
}
