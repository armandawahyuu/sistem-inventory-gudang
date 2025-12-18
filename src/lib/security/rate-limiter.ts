/**
 * Rate Limiter Library
 * In-memory rate limiting for API protection
 * 
 * Note: For production with multiple instances, use Redis-based rate limiter
 */

// ============================================
// TYPES
// ============================================

interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests allowed in window
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store (for single instance deployment)
const rateLimitStore = new Map<string, RateLimitEntry>();

// ============================================
// RATE LIMIT CONFIGURATIONS
// ============================================

export const RATE_LIMITS = {
    // General API: 100 requests per minute
    general: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100,
    } as RateLimitConfig,

    // Login attempts: 5 per 15 minutes
    login: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
    } as RateLimitConfig,

    // Sensitive API: 20 per minute
    sensitive: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 20,
    } as RateLimitConfig,

    // Import/Export: 10 per minute
    import: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
    } as RateLimitConfig,
};

// ============================================
// RATE LIMITER FUNCTIONS
// ============================================

/**
 * Check if request is rate limited
 * @param key Unique identifier (usually IP + endpoint)
 * @param config Rate limit configuration
 * @returns Object with isLimited, remaining, resetTime
 */
export function checkRateLimit(
    key: string,
    config: RateLimitConfig
): {
    isLimited: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
} {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // If no entry or expired, create new entry
    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return {
            isLimited: false,
            remaining: config.maxRequests - 1,
            resetTime: now + config.windowMs,
        };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    // Check if exceeded
    if (entry.count > config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return {
            isLimited: true,
            remaining: 0,
            resetTime: entry.resetTime,
            retryAfter,
        };
    }

    return {
        isLimited: false,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime,
    };
}

/**
 * Create rate limit key from IP and endpoint
 */
export function createRateLimitKey(ip: string, endpoint: string): string {
    return `${ip}:${endpoint}`;
}

/**
 * Get client IP from headers
 */
export function getClientIp(headers: Headers): string {
    return (
        headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headers.get("x-real-ip") ||
        "unknown"
    );
}

/**
 * Clean up expired entries (run periodically)
 */
export function cleanupRateLimitStore(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
            cleaned++;
        }
    }

    return cleaned;
}

// Auto cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        cleanupRateLimitStore();
    }, 5 * 60 * 1000);
}

// ============================================
// RATE LIMIT RESPONSE HELPERS
// ============================================

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
    remaining: number,
    resetTime: number,
    limit: number
): Record<string, string> {
    return {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
    };
}

/**
 * Create 429 Too Many Requests response
 */
export function createRateLimitResponse(retryAfter: number): Response {
    return new Response(
        JSON.stringify({
            success: false,
            message: "Terlalu banyak request. Silakan coba lagi nanti.",
            retryAfter,
        }),
        {
            status: 429,
            headers: {
                "Content-Type": "application/json",
                "Retry-After": String(retryAfter),
            },
        }
    );
}
