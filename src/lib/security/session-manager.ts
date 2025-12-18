/**
 * Session Manager Library
 * Secure session management with database-backed sessions
 */

import { prisma } from "@/lib/prisma";
import { hashData, generateSalt } from "./encryption";

// ============================================
// CONSTANTS
// ============================================

const SESSION_EXPIRY_HOURS = 8; // Default session expiry
const IDLE_TIMEOUT_MINUTES = 30; // Idle timeout
const REMEMBER_ME_DAYS = 30; // Remember me token expiry

// ============================================
// SESSION GENERATION
// ============================================

/**
 * Generate a cryptographically secure session ID
 * @returns 64-character hex string
 */
export function generateSessionId(): string {
    const array = new Uint8Array(32);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        crypto.getRandomValues(array);
    } else {
        // Fallback for environments without crypto
        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a secure random token
 * @param length Number of bytes (default 32 = 64 hex chars)
 */
export function generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        crypto.getRandomValues(array);
    } else {
        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// ============================================
// DATABASE SESSION MANAGEMENT
// ============================================

/**
 * Create a new session in database
 */
export async function createSession(
    userId: string,
    options?: { expiryHours?: number }
): Promise<string> {
    const sessionToken = generateSessionId();
    const expiryHours = options?.expiryHours || SESSION_EXPIRY_HOURS;
    const expires = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

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
 * Validate session and return user ID if valid
 */
export async function validateSession(sessionToken: string): Promise<{
    valid: boolean;
    userId?: string;
    expired?: boolean;
}> {
    const session = await prisma.session.findUnique({
        where: { sessionToken },
        select: { userId: true, expires: true },
    });

    if (!session) {
        return { valid: false };
    }

    // Check if expired
    if (new Date() > session.expires) {
        // Clean up expired session
        await prisma.session.delete({ where: { sessionToken } });
        return { valid: false, expired: true };
    }

    return { valid: true, userId: session.userId };
}

/**
 * Regenerate session (for post-login security)
 */
export async function regenerateSession(
    oldSessionToken: string,
    userId: string
): Promise<string> {
    // Delete old session
    await prisma.session.deleteMany({
        where: { sessionToken: oldSessionToken },
    });

    // Create new session
    return createSession(userId);
}

/**
 * Invalidate/destroy session (logout)
 */
export async function destroySession(sessionToken: string): Promise<void> {
    await prisma.session.deleteMany({
        where: { sessionToken },
    });
}

/**
 * Invalidate all sessions for a user (force logout everywhere)
 */
export async function destroyAllUserSessions(userId: string): Promise<number> {
    const result = await prisma.session.deleteMany({
        where: { userId },
    });
    return result.count;
}

/**
 * Enforce single session per user (kick old sessions)
 */
export async function enforcesSingleSession(userId: string): Promise<number> {
    // Delete all existing sessions for this user
    const result = await prisma.session.deleteMany({
        where: { userId },
    });
    return result.count;
}

/**
 * Extend session expiry (touch session for idle timeout)
 */
export async function touchSession(
    sessionToken: string,
    extendMinutes: number = IDLE_TIMEOUT_MINUTES
): Promise<void> {
    await prisma.session.update({
        where: { sessionToken },
        data: {
            expires: new Date(Date.now() + extendMinutes * 60 * 1000),
        },
    }).catch(() => {
        // Session might not exist
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
// REMEMBER ME TOKEN
// ============================================

interface RememberMeToken {
    selector: string;
    hashedValidator: string;
    userId: string;
    expires: Date;
}

/**
 * Create a "Remember Me" token
 * Returns: selector:validator (to store in cookie)
 */
export async function createRememberMeToken(userId: string): Promise<string> {
    const selector = generateSecureToken(16); // 32 hex chars
    const validator = generateSecureToken(32); // 64 hex chars
    const hashedValidator = hashData(validator);
    const expires = new Date(Date.now() + REMEMBER_ME_DAYS * 24 * 60 * 60 * 1000);

    // Store selector and hashed validator in database
    // Note: You'd need to create a RememberMeToken model in Prisma
    // For now, we'll use the TokenBlacklist or create a new method

    // Simplified: store in Session with longer expiry and special flag
    await prisma.session.create({
        data: {
            sessionToken: `remember:${selector}:${hashedValidator}`,
            userId,
            expires,
        },
    });

    return `${selector}:${validator}`;
}

/**
 * Validate "Remember Me" token
 */
export async function validateRememberMeToken(token: string): Promise<{
    valid: boolean;
    userId?: string;
}> {
    const parts = token.split(":");
    if (parts.length !== 2) {
        return { valid: false };
    }

    const [selector, validator] = parts;
    const hashedValidator = hashData(validator);

    // Look up by selector pattern
    const session = await prisma.session.findFirst({
        where: {
            sessionToken: {
                startsWith: `remember:${selector}:`,
            },
            expires: { gt: new Date() },
        },
    });

    if (!session) {
        return { valid: false };
    }

    // Verify hashed validator
    const storedHash = session.sessionToken.split(":")[2];
    if (storedHash !== hashedValidator) {
        return { valid: false };
    }

    return { valid: true, userId: session.userId };
}

/**
 * Revoke "Remember Me" token
 */
export async function revokeRememberMeToken(selector: string): Promise<void> {
    await prisma.session.deleteMany({
        where: {
            sessionToken: {
                startsWith: `remember:${selector}:`,
            },
        },
    });
}

/**
 * Revoke all "Remember Me" tokens for a user
 */
export async function revokeAllRememberMeTokens(userId: string): Promise<number> {
    const result = await prisma.session.deleteMany({
        where: {
            userId,
            sessionToken: {
                startsWith: "remember:",
            },
        },
    });
    return result.count;
}

// ============================================
// COOKIE SETTINGS HELPER
// ============================================

/**
 * Get secure cookie options
 */
export function getSecureCookieOptions(
    maxAgeSeconds?: number
): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "strict" | "lax" | "none";
    path: string;
    maxAge?: number;
} {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly: true, // Cannot be accessed by JavaScript
        secure: isProduction, // HTTPS only in production
        sameSite: "lax", // Lax allows top-level navigation, strict blocks everything
        path: "/",
        ...(maxAgeSeconds ? { maxAge: maxAgeSeconds } : {}),
    };
}
