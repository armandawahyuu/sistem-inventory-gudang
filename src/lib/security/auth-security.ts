/**
 * Authentication & Security Library
 * Sistem Inventory Gudang
 * 
 * Features:
 * - Password hashing with bcrypt (cost 12)
 * - Brute force protection
 * - Session management
 * - Token blacklisting
 * - Authorization helpers
 */

import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// ============================================
// CONSTANTS
// ============================================

const BCRYPT_COST = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const SESSION_EXPIRY_HOURS = 8;
const DELAY_AFTER_FAILED_LOGIN_MS = 1000; // 1 second delay to prevent timing attacks

// ============================================
// PASSWORD SECURITY
// ============================================

/**
 * Hash password with bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(BCRYPT_COST);
    return bcrypt.hash(password, salt);
}

/**
 * Verify password against hash
 * @param password Plain text password
 * @param hash Stored hash
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 * Requirements: min 8 chars, at least 1 letter and 1 number
 * @param password Password to validate
 * @returns Validation result
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
        return { valid: false, message: "Password minimal 8 karakter" };
    }
    if (!/[a-zA-Z]/.test(password)) {
        return { valid: false, message: "Password harus mengandung huruf" };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: "Password harus mengandung angka" };
    }
    return { valid: true };
}

// ============================================
// BRUTE FORCE PROTECTION
// ============================================

/**
 * Check if account is locked due to brute force attempts
 * @param userId User ID to check
 * @returns True if account is locked
 */
export async function isAccountLocked(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lockedUntil: true },
    });

    if (!user?.lockedUntil) return false;
    return new Date() < user.lockedUntil;
}

/**
 * Check brute force status for user
 * @param userId User ID
 * @returns Object with lock status and remaining attempts
 */
export async function checkBruteForce(userId: string): Promise<{
    locked: boolean;
    remainingAttempts: number;
    lockedUntil?: Date;
}> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { failedLoginAttempts: true, lockedUntil: true },
    });

    if (!user) {
        return { locked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS };
    }

    // Check if locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
        return {
            locked: true,
            remainingAttempts: 0,
            lockedUntil: user.lockedUntil,
        };
    }

    // If lock expired, reset attempts
    if (user.lockedUntil && new Date() >= user.lockedUntil) {
        await prisma.user.update({
            where: { id: userId },
            data: { failedLoginAttempts: 0, lockedUntil: null },
        });
        return { locked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS };
    }

    return {
        locked: false,
        remainingAttempts: MAX_LOGIN_ATTEMPTS - user.failedLoginAttempts,
    };
}

/**
 * Record failed login attempt
 * @param userId User ID
 */
export async function recordFailedLogin(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { failedLoginAttempts: true },
    });

    if (!user) return;

    const newAttempts = user.failedLoginAttempts + 1;
    const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;

    await prisma.user.update({
        where: { id: userId },
        data: {
            failedLoginAttempts: newAttempts,
            lockedUntil: shouldLock
                ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
                : null,
        },
    });
}

/**
 * Reset failed login attempts after successful login
 * @param userId User ID
 * @param ipAddress IP address
 */
export async function recordSuccessfulLogin(userId: string, ipAddress: string): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress,
        },
    });
}

/**
 * Lock account manually
 * @param userId User ID
 * @param durationMinutes Lock duration in minutes
 */
export async function lockAccount(userId: string, durationMinutes: number = LOCK_DURATION_MINUTES): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: {
            lockedUntil: new Date(Date.now() + durationMinutes * 60 * 1000),
        },
    });
}

/**
 * Unlock account manually
 * @param userId User ID
 */
export async function unlockAccount(userId: string): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
        },
    });
}

/**
 * Log login attempt
 * @param username Username attempted
 * @param ipAddress IP address
 * @param userAgent User agent string
 * @param success Whether login was successful
 */
export async function logLoginAttempt(
    username: string,
    ipAddress: string,
    userAgent: string | null,
    success: boolean
): Promise<void> {
    await prisma.loginAttempt.create({
        data: {
            username,
            ipAddress,
            userAgent,
            success,
        },
    });
}

/**
 * Add delay after failed login to prevent timing attacks
 */
export function delayAfterFailedLogin(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, DELAY_AFTER_FAILED_LOGIN_MS));
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Create a new session
 * @param userId User ID
 * @returns Session token
 */
export async function createSession(userId: string): Promise<string> {
    const sessionToken = generateSecureToken();
    const expires = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.session.create({
        data: {
            sessionToken,
            userId,
            expires,
        },
    });

    return sessionToken;
}

/**
 * Validate session token
 * @param sessionToken Session token
 * @returns User ID if valid, null otherwise
 */
export async function validateSession(sessionToken: string): Promise<string | null> {
    const session = await prisma.session.findUnique({
        where: { sessionToken },
        select: { userId: true, expires: true },
    });

    if (!session) return null;
    if (new Date() > session.expires) {
        await prisma.session.delete({ where: { sessionToken } });
        return null;
    }

    return session.userId;
}

/**
 * Invalidate session (logout)
 * @param sessionToken Session token
 */
export async function invalidateSession(sessionToken: string): Promise<void> {
    await prisma.session.deleteMany({
        where: { sessionToken },
    });
}

/**
 * Invalidate all sessions for a user
 * @param userId User ID
 */
export async function invalidateAllSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({
        where: { userId },
    });
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
        where: { expires: { lt: new Date() } },
    });
    return result.count;
}

// ============================================
// TOKEN BLACKLIST (for JWT)
// ============================================

/**
 * Blacklist a token
 * @param token Token to blacklist
 * @param expiresAt Token expiry date
 */
export async function blacklistToken(token: string, expiresAt: Date): Promise<void> {
    await prisma.tokenBlacklist.create({
        data: { token, expiresAt },
    });
}

/**
 * Check if token is blacklisted
 * @param token Token to check
 * @returns True if blacklisted
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await prisma.tokenBlacklist.findUnique({
        where: { token },
    });
    return !!blacklisted;
}

/**
 * Clean up expired blacklisted tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.tokenBlacklist.deleteMany({
        where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
}

// ============================================
// AUTHORIZATION
// ============================================

type Role = "admin" | "supervisor" | "staff";

const ROLE_HIERARCHY: Record<Role, number> = {
    admin: 3,
    supervisor: 2,
    staff: 1,
};

/**
 * Check if user has required role
 * @param userRole User's role
 * @param requiredRole Required role
 * @returns True if user has required role or higher
 */
export function hasRole(userRole: string, requiredRole: Role): boolean {
    const userLevel = ROLE_HIERARCHY[userRole as Role] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
    return userLevel >= requiredLevel;
}

/**
 * Check if user can perform action
 * @param userRole User's role
 * @param action Action to perform
 * @returns True if allowed
 */
export function canPerformAction(userRole: string, action: string): boolean {
    const permissions: Record<Role, string[]> = {
        admin: ["*"], // All permissions
        supervisor: [
            "master:read", "master:write",
            "transaksi:read", "transaksi:write", "transaksi:approve",
            "laporan:read", "laporan:export",
            "absensi:read", "absensi:write",
            "kas-kecil:read", "kas-kecil:write",
        ],
        staff: [
            "master:read",
            "transaksi:read", "transaksi:write",
            "laporan:read",
            "absensi:read",
        ],
    };

    const userPermissions = permissions[userRole as Role] || [];

    // Admin has all permissions
    if (userPermissions.includes("*")) return true;

    // Check specific permission
    return userPermissions.includes(action);
}

// ============================================
// UTILITIES
// ============================================

/**
 * Generate secure random token
 * @returns Secure random token
 */
function generateSecureToken(): string {
    const array = new Uint8Array(32);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        crypto.getRandomValues(array);
    } else {
        // Fallback for Node.js
        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Get client IP from request headers
 * @param headers Request headers
 * @returns IP address
 */
export function getClientIp(headers: Headers): string {
    return (
        headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headers.get("x-real-ip") ||
        "unknown"
    );
}
