/**
 * CSRF Protection Library
 * Cross-Site Request Forgery protection
 */

import { cookies } from "next/headers";
import { generateSecureToken } from "./session-manager";

// ============================================
// CONSTANTS
// ============================================

const CSRF_TOKEN_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32; // 64 hex characters

// ============================================
// CSRF TOKEN GENERATION
// ============================================

/**
 * Generate a new CSRF token
 */
export function generateCsrfToken(): string {
    return generateSecureToken(CSRF_TOKEN_LENGTH);
}

/**
 * Set CSRF token in cookie
 */
export async function setCsrfCookie(): Promise<string> {
    const token = generateCsrfToken();
    const isProduction = process.env.NODE_ENV === "production";

    const cookieStore = await cookies();
    cookieStore.set(CSRF_TOKEN_NAME, token, {
        httpOnly: false, // Must be accessible by JavaScript to include in requests
        secure: isProduction,
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 8, // 8 hours
    });

    return token;
}

/**
 * Get CSRF token from cookie
 */
export async function getCsrfTokenFromCookie(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(CSRF_TOKEN_NAME)?.value || null;
}

// ============================================
// CSRF VALIDATION
// ============================================

/**
 * Validate CSRF token from request
 * Compares token in header/body with token in cookie
 */
export async function validateCsrfToken(request: Request): Promise<{
    valid: boolean;
    error?: string;
}> {
    // Skip validation for GET, HEAD, OPTIONS (safe methods)
    const method = request.method.toUpperCase();
    if (["GET", "HEAD", "OPTIONS"].includes(method)) {
        return { valid: true };
    }

    // Get token from cookie
    const cookieToken = await getCsrfTokenFromCookie();
    if (!cookieToken) {
        return { valid: false, error: "CSRF cookie not found" };
    }

    // Get token from header
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    // Or from request body (for form submissions)
    let bodyToken: string | null = null;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
        try {
            const body = await request.clone().text();
            const params = new URLSearchParams(body);
            bodyToken = params.get("_csrf") || params.get("csrf_token");
        } catch {
            // Ignore body parsing errors
        }
    } else if (contentType.includes("application/json")) {
        try {
            const body = await request.clone().json();
            bodyToken = body._csrf || body.csrf_token || body.csrfToken;
        } catch {
            // Ignore JSON parsing errors
        }
    }

    const submittedToken = headerToken || bodyToken;

    if (!submittedToken) {
        return { valid: false, error: "CSRF token not provided" };
    }

    // Constant-time comparison to prevent timing attacks
    if (!constantTimeCompare(cookieToken, submittedToken)) {
        return { valid: false, error: "CSRF token mismatch" };
    }

    return { valid: true };
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
}

// ============================================
// CSRF MIDDLEWARE HELPER
// ============================================

/**
 * Create CSRF validation response for invalid tokens
 */
export function createCsrfErrorResponse(error: string): Response {
    return new Response(
        JSON.stringify({
            success: false,
            message: "CSRF validation failed",
            error: process.env.NODE_ENV === "development" ? error : undefined,
        }),
        {
            status: 403,
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
}

// ============================================
// CLIENT-SIDE HELPER (for frontend)
// ============================================

/**
 * Get CSRF token from cookie (client-side)
 * Usage in React:
 * 
 * const csrfToken = getCsrfTokenClient();
 * fetch('/api/...', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'x-csrf-token': csrfToken
 *   },
 *   body: JSON.stringify(data)
 * });
 */
export function getCsrfTokenClient(): string {
    if (typeof document === "undefined") return "";

    const match = document.cookie.match(new RegExp(`(^| )${CSRF_TOKEN_NAME}=([^;]+)`));
    return match ? match[2] : "";
}

/**
 * React hook for CSRF token (to be used in components)
 * Note: This is just a helper function, actual hook should be in a .tsx file
 */
export function useCsrfToken(): string {
    if (typeof window === "undefined") return "";
    return getCsrfTokenClient();
}
