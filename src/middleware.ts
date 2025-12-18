import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ============================================
// CONFIGURATION
// ============================================

// Routes that don't require authentication
const publicRoutes = ["/login"];

// API routes that don't require authentication
const publicApiRoutes = ["/api/auth"];

// ============================================
// SECURITY HEADERS
// ============================================

function getSecurityHeaders(): Record<string, string> {
    const isDev = process.env.NODE_ENV === "development";

    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        ...(isDev
            ? {}
            : {
                "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            }),
        "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    };
}

// ============================================
// CORS
// ============================================

function getAllowedOrigins(): string[] {
    const origins = process.env.ALLOWED_ORIGINS?.split(",") || [];
    if (process.env.NODE_ENV === "development") {
        origins.push("http://localhost:3000", "http://127.0.0.1:3000");
    }
    return origins.filter(Boolean);
}

function isOriginAllowed(origin: string | null): boolean {
    if (!origin) return true;
    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.length === 0 && process.env.NODE_ENV === "production") {
        return false;
    }
    return allowedOrigins.length === 0 || allowedOrigins.includes(origin);
}

function getCORSHeaders(origin: string | null): Record<string, string> {
    const headers: Record<string, string> = {
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400",
        "Access-Control-Allow-Credentials": "true",
    };

    if (origin && isOriginAllowed(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
    }

    return headers;
}

// ============================================
// RATE LIMITING (In-memory, simple implementation)
// ============================================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limits - more lenient in development
const isDevelopment = process.env.NODE_ENV === "development";

const RATE_LIMITS = {
    general: { windowMs: 60 * 1000, maxRequests: isDevelopment ? 1000 : 100 },
    login: { windowMs: 15 * 60 * 1000, maxRequests: isDevelopment ? 100 : 10 },
    sensitive: { windowMs: 60 * 1000, maxRequests: isDevelopment ? 100 : 20 },
};

function checkRateLimit(
    key: string,
    config: { windowMs: number; maxRequests: number }
): { isLimited: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
        return { isLimited: false };
    }

    entry.count++;
    rateLimitStore.set(key, entry);

    if (entry.count > config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return { isLimited: true, retryAfter };
    }

    return { isLimited: false };
}

function getClientIp(request: NextRequest): string {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "127.0.0.1"
    );
}

// ============================================
// MIDDLEWARE
// ============================================

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const origin = request.headers.get("origin");
    const ip = getClientIp(request);

    // Skip static files
    if (
        pathname.startsWith("/_next") ||
        pathname.includes(".") ||
        pathname.startsWith("/favicon")
    ) {
        return NextResponse.next();
    }

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
        return new NextResponse(null, {
            status: 204,
            headers: {
                ...getCORSHeaders(origin),
                ...getSecurityHeaders(),
            },
        });
    }

    // Apply rate limiting for API routes
    if (pathname.startsWith("/api")) {
        // Determine rate limit type
        let rateLimitConfig = RATE_LIMITS.general;
        let rateLimitKey = `general:${ip}`;

        if (pathname.includes("/auth") || pathname.includes("/login")) {
            rateLimitConfig = RATE_LIMITS.login;
            rateLimitKey = `login:${ip}`;
        } else if (
            pathname.includes("/delete") ||
            pathname.includes("/import") ||
            pathname.includes("/cleanup")
        ) {
            rateLimitConfig = RATE_LIMITS.sensitive;
            rateLimitKey = `sensitive:${ip}`;
        }

        const rateLimit = checkRateLimit(rateLimitKey, rateLimitConfig);

        if (rateLimit.isLimited) {
            return new NextResponse(
                JSON.stringify({
                    success: false,
                    message: "Terlalu banyak request. Silakan coba lagi nanti.",
                }),
                {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        "Retry-After": String(rateLimit.retryAfter),
                        ...getSecurityHeaders(),
                    },
                }
            );
        }

        // Check authentication for non-public API routes
        const isPublicApi = publicApiRoutes.some((route) =>
            pathname.startsWith(route)
        );

        if (!isPublicApi) {
            const token = await getToken({
                req: request,
                secret: process.env.NEXTAUTH_SECRET,
            });

            if (!token) {
                return new NextResponse(
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
        }

        // Continue with security headers
        const response = NextResponse.next();
        Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        Object.entries(getCORSHeaders(origin)).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;
    }

    // Page routes

    // Get the token
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    // If accessing login and already authenticated, redirect to dashboard
    if (pathname === "/login" && token) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Allow public routes without auth
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
        const response = NextResponse.next();
        Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;
    }

    // Redirect to login if not authenticated
    if (!token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", encodeURI(pathname));
        return NextResponse.redirect(loginUrl);
    }

    // User is authenticated, allow access with security headers
    const response = NextResponse.next();
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    return response;
}

export const config = {
    matcher: [
        // Match all paths except static files
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
