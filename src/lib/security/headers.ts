/**
 * Security Headers Library
 * Configure security headers for all responses
 */

// ============================================
// SECURITY HEADERS
// ============================================

/**
 * Get all security headers
 */
export function getSecurityHeaders(): Record<string, string> {
    const isDev = process.env.NODE_ENV === "development";

    return {
        // Prevent MIME type sniffing
        "X-Content-Type-Options": "nosniff",

        // Prevent clickjacking
        "X-Frame-Options": "DENY",

        // XSS Protection (legacy but still useful)
        "X-XSS-Protection": "1; mode=block",

        // Prevent referrer leakage
        "Referrer-Policy": "strict-origin-when-cross-origin",

        // HSTS - Force HTTPS (only in production)
        ...(isDev
            ? {}
            : {
                "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            }),

        // Content Security Policy
        "Content-Security-Policy": getCSP(isDev),

        // Permissions Policy (formerly Feature-Policy)
        "Permissions-Policy": [
            "camera=(self)",
            "microphone=()",
            "geolocation=()",
            "payment=()",
        ].join(", "),

        // Prevent caching of sensitive data
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
    };
}

/**
 * Get Content Security Policy
 */
function getCSP(isDev: boolean): string {
    const directives = [
        // Default to self
        "default-src 'self'",

        // Scripts - needed for Next.js
        `script-src 'self' ${isDev ? "'unsafe-eval'" : ""} 'unsafe-inline'`.trim(),

        // Styles - needed for styled components/emotion/tailwind
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

        // Fonts
        "font-src 'self' https://fonts.gstatic.com data:",

        // Images - allow data URLs for base64 images (barcodes, etc.)
        "img-src 'self' data: blob: https:",

        // Media - allow camera access for barcode scanner
        "media-src 'self' blob:",

        // Connect - API calls
        "connect-src 'self'",

        // Frame ancestors - prevent embedding
        "frame-ancestors 'none'",

        // Base URI
        "base-uri 'self'",

        // Form actions
        "form-action 'self'",

        // Object sources
        "object-src 'none'",

        // Upgrade insecure requests (production only)
        ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ];

    return directives.join("; ");
}

// ============================================
// CORS CONFIGURATION
// ============================================

/**
 * Get allowed origins for CORS
 */
export function getAllowedOrigins(): string[] {
    const origins = process.env.ALLOWED_ORIGINS?.split(",") || [];

    // In development, allow localhost
    if (process.env.NODE_ENV === "development") {
        origins.push("http://localhost:3000", "http://127.0.0.1:3000");
    }

    return origins.filter(Boolean);
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
    if (!origin) return true; // Same-origin requests don't have origin header

    const allowedOrigins = getAllowedOrigins();

    // If no origins configured, deny all cross-origin in production
    if (allowedOrigins.length === 0 && process.env.NODE_ENV === "production") {
        return false;
    }

    // Check if origin is in allowed list
    return allowedOrigins.includes(origin);
}

/**
 * Get CORS headers
 */
export function getCORSHeaders(origin: string | null): Record<string, string> {
    const headers: Record<string, string> = {
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400", // 24 hours
        "Access-Control-Allow-Credentials": "true",
    };

    // Only set origin if it's allowed
    if (origin && isOriginAllowed(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
    }

    return headers;
}

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Safe error response - never expose internal details
 */
export function createSafeErrorResponse(
    error: unknown,
    status: number = 500
): Response {
    // Log actual error on server
    console.error("[API Error]", error);

    // Generic message for client
    const message = getGenericErrorMessage(error);

    return new Response(
        JSON.stringify({
            success: false,
            message,
        }),
        {
            status,
            headers: {
                "Content-Type": "application/json",
                ...getSecurityHeaders(),
            },
        }
    );
}

/**
 * Get generic error message based on error type
 */
function getGenericErrorMessage(error: unknown): string {
    // Check for known Prisma errors
    if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // Unique constraint violation
        if (errorMessage.includes("unique constraint") || errorMessage.includes("duplicate")) {
            return "Data sudah ada. Silakan gunakan data yang berbeda.";
        }

        // Foreign key constraint
        if (errorMessage.includes("foreign key") || errorMessage.includes("constraint")) {
            return "Data terkait tidak ditemukan atau tidak bisa dihapus karena masih digunakan.";
        }

        // Record not found
        if (errorMessage.includes("not found") || errorMessage.includes("no record")) {
            return "Data tidak ditemukan.";
        }

        // Validation error
        if (errorMessage.includes("validation")) {
            return "Data tidak valid. Silakan periksa kembali input Anda.";
        }
    }

    // Generic fallback
    return "Terjadi kesalahan. Silakan coba lagi nanti.";
}

/**
 * Create unauthorized response
 */
export function createUnauthorizedResponse(): Response {
    return new Response(
        JSON.stringify({
            success: false,
            message: "Silakan login terlebih dahulu.",
        }),
        {
            status: 401,
            headers: {
                "Content-Type": "application/json",
                "WWW-Authenticate": "Bearer",
                ...getSecurityHeaders(),
            },
        }
    );
}

/**
 * Create forbidden response
 */
export function createForbiddenResponse(): Response {
    return new Response(
        JSON.stringify({
            success: false,
            message: "Anda tidak memiliki akses untuk melakukan aksi ini.",
        }),
        {
            status: 403,
            headers: {
                "Content-Type": "application/json",
                ...getSecurityHeaders(),
            },
        }
    );
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(message: string): Response {
    return new Response(
        JSON.stringify({
            success: false,
            message: `Validasi gagal: ${message}`,
        }),
        {
            status: 400,
            headers: {
                "Content-Type": "application/json",
                ...getSecurityHeaders(),
            },
        }
    );
}
