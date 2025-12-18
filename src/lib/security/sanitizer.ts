/**
 * Input Sanitization Library
 * Prevents XSS, cleans user input, and handles file uploads safely
 */

import DOMPurify from "isomorphic-dompurify";
import validator from "validator";

// ============================================
// HTML SANITIZATION (XSS Prevention)
// ============================================

/**
 * Sanitize HTML content - removes dangerous tags/attributes
 * Only allows safe formatting tags
 */
export function sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ["b", "i", "u", "strong", "em", "br", "p", "ul", "ol", "li"],
        ALLOWED_ATTR: [],
    });
}

/**
 * Strip ALL HTML tags - for plain text output
 */
export function stripHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
    });
}

/**
 * Encode HTML entities - for displaying in HTML context
 */
export function encodeHtmlEntities(str: string): string {
    return validator.escape(str);
}

/**
 * Decode HTML entities
 */
export function decodeHtmlEntities(str: string): string {
    return validator.unescape(str);
}

// ============================================
// STRING SANITIZATION
// ============================================

/**
 * Basic sanitize - trim, collapse spaces, strip HTML
 */
export function sanitizeString(input: string | null | undefined): string {
    if (!input) return "";
    return stripHtml(input).trim().replace(/\s+/g, " ");
}

/**
 * Sanitize for code/identifier - uppercase, alphanumeric only
 */
export function sanitizeCode(input: string | null | undefined): string {
    if (!input) return "";
    return input
        .toUpperCase()
        .replace(/[^A-Z0-9\-_]/g, "")
        .substring(0, 50);
}

/**
 * Sanitize email
 */
export function sanitizeEmail(input: string | null | undefined): string {
    if (!input) return "";
    const email = input.toLowerCase().trim();
    return validator.isEmail(email) ? validator.normalizeEmail(email) || email : "";
}

/**
 * Sanitize phone number - keep only digits and +/-
 */
export function sanitizePhone(input: string | null | undefined): string {
    if (!input) return "";
    return input.replace(/[^0-9+\-\s()]/g, "").trim();
}

/**
 * Sanitize NIK - digits only
 */
export function sanitizeNik(input: string | null | undefined): string {
    if (!input) return "";
    return input.replace(/\D/g, "").substring(0, 20);
}

/**
 * Sanitize number string - removes non-numeric except decimal point
 */
export function sanitizeNumber(input: string | null | undefined): number | null {
    if (!input) return null;
    const cleaned = input.replace(/[^0-9.\-]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

/**
 * Sanitize integer string
 */
export function sanitizeInteger(input: string | null | undefined): number | null {
    if (!input) return null;
    const cleaned = input.replace(/[^0-9\-]/g, "");
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? null : num;
}

// ============================================
// FILE UPLOAD SANITIZATION
// ============================================

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_DOCUMENT_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileValidationResult {
    valid: boolean;
    error?: string;
    sanitizedName?: string;
}

/**
 * Validate and sanitize uploaded file
 */
export function validateFile(
    file: File,
    options: {
        allowedTypes?: string[];
        maxSize?: number;
    } = {}
): FileValidationResult {
    const { allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES], maxSize = MAX_FILE_SIZE } = options;

    // Check file size
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File terlalu besar. Maksimal ${formatFileSize(maxSize)}`,
        };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Tipe file tidak diizinkan. Hanya: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`,
        };
    }

    // Sanitize filename
    const sanitizedName = sanitizeFilename(file.name);

    return {
        valid: true,
        sanitizedName,
    };
}

/**
 * Sanitize filename - remove dangerous characters
 */
export function sanitizeFilename(filename: string): string {
    // Get extension
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const name = filename.replace(/\.[^/.]+$/, "");

    // Sanitize name part
    const sanitizedName = name
        .replace(/[^a-zA-Z0-9\-_\s]/g, "") // Remove special chars
        .replace(/\s+/g, "_") // Replace spaces with underscore
        .substring(0, 100); // Limit length

    // Add timestamp for uniqueness
    const timestamp = Date.now();

    return `${sanitizedName}_${timestamp}.${ext}`;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Check if file extension is safe
 */
export function isSafeExtension(filename: string): boolean {
    const dangerousExtensions = ["exe", "bat", "cmd", "sh", "php", "js", "vbs", "ps1", "msi"];
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    return !dangerousExtensions.includes(ext);
}

// ============================================
// SQL INJECTION PREVENTION
// ============================================

/**
 * Escape SQL special characters (backup, Prisma already handles this)
 */
export function escapeSql(input: string): string {
    return input
        .replace(/'/g, "''")
        .replace(/\\/g, "\\\\")
        .replace(/\x00/g, "\\0")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\x1a/g, "\\Z");
}

/**
 * Remove SQL injection patterns
 */
export function removeSqlPatterns(input: string): string {
    // Remove common SQL injection patterns
    return input
        .replace(/(\-\-|;|\/\*|\*\/|xp_|UNION|SELECT|INSERT|DELETE|UPDATE|DROP|CREATE|ALTER|EXEC)/gi, "")
        .trim();
}

// ============================================
// URL SANITIZATION
// ============================================

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(input: string): string | null {
    if (!input) return null;

    const trimmed = input.trim();

    // Check if valid URL
    if (!validator.isURL(trimmed, { require_protocol: true })) {
        return null;
    }

    // Prevent javascript: protocol
    if (trimmed.toLowerCase().startsWith("javascript:")) {
        return null;
    }

    return trimmed;
}

// ============================================
// OBJECT SANITIZATION
// ============================================

/**
 * Recursively sanitize all string values in an object
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
            result[key] = sanitizeString(value);
        } else if (Array.isArray(value)) {
            result[key] = value.map((item) =>
                typeof item === "string"
                    ? sanitizeString(item)
                    : typeof item === "object" && item !== null
                        ? sanitizeObject(item as Record<string, unknown>)
                        : item
            );
        } else if (typeof value === "object" && value !== null) {
            result[key] = sanitizeObject(value as Record<string, unknown>);
        } else {
            result[key] = value;
        }
    }

    return result as T;
}

// ============================================
// CONTENT SECURITY POLICY HEADERS
// ============================================

/**
 * Get recommended CSP headers for Next.js
 */
export function getSecurityHeaders(): Record<string, string> {
    return {
        "Content-Security-Policy": [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Needed for Next.js
            "style-src 'self' 'unsafe-inline'", // Needed for styled-components/emotion
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join("; "),
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
    };
}
