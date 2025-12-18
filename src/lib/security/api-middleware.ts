/**
 * API Authorization Middleware
 * Use this wrapper to protect API endpoints with role-based access control
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { canPerformAction, hasRole, isTokenBlacklisted } from "./auth-security";

type Role = "admin" | "supervisor" | "staff";

interface AuthResult {
    authenticated: boolean;
    userId?: string;
    username?: string;
    role?: string;
    error?: string;
}

/**
 * Get authenticated user from request
 */
export async function getAuthUser(request: NextRequest): Promise<AuthResult> {
    try {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (!token) {
            return { authenticated: false, error: "Unauthorized" };
        }

        // Check if token is blacklisted (optional, for logout)
        const jti = token.jti as string | undefined;
        if (jti && await isTokenBlacklisted(jti)) {
            return { authenticated: false, error: "Token has been revoked" };
        }

        return {
            authenticated: true,
            userId: token.id as string,
            username: token.username as string,
            role: token.role as string,
        };
    } catch (error) {
        console.error("Auth error:", error);
        return { authenticated: false, error: "Authentication failed" };
    }
}

/**
 * Require authentication for API endpoint
 */
export async function requireAuth(
    request: NextRequest
): Promise<NextResponse | null> {
    const auth = await getAuthUser(request);

    if (!auth.authenticated) {
        return NextResponse.json(
            { error: auth.error || "Unauthorized" },
            { status: 401 }
        );
    }

    return null;
}

/**
 * Require specific role for API endpoint
 */
export async function requireRole(
    request: NextRequest,
    requiredRole: Role
): Promise<NextResponse | null> {
    const auth = await getAuthUser(request);

    if (!auth.authenticated) {
        return NextResponse.json(
            { error: auth.error || "Unauthorized" },
            { status: 401 }
        );
    }

    if (!hasRole(auth.role!, requiredRole)) {
        return NextResponse.json(
            { error: "Forbidden: Insufficient permissions" },
            { status: 403 }
        );
    }

    return null;
}

/**
 * Require specific permission for API endpoint
 */
export async function requirePermission(
    request: NextRequest,
    permission: string
): Promise<NextResponse | null> {
    const auth = await getAuthUser(request);

    if (!auth.authenticated) {
        return NextResponse.json(
            { error: auth.error || "Unauthorized" },
            { status: 401 }
        );
    }

    if (!canPerformAction(auth.role!, permission)) {
        return NextResponse.json(
            { error: `Forbidden: Missing permission '${permission}'` },
            { status: 403 }
        );
    }

    return null;
}

/**
 * Higher-order function to wrap API handler with auth check
 * 
 * Usage:
 * export const GET = withAuth(async (request, { user }) => {
 *     // user is guaranteed to be authenticated
 *     return NextResponse.json({ data: "protected" });
 * });
 */
export function withAuth(
    handler: (
        request: NextRequest,
        context: { user: { id: string; username: string; role: string } }
    ) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
    return async (request: NextRequest) => {
        const auth = await getAuthUser(request);

        if (!auth.authenticated) {
            return NextResponse.json(
                { error: auth.error || "Unauthorized" },
                { status: 401 }
            );
        }

        return handler(request, {
            user: {
                id: auth.userId!,
                username: auth.username!,
                role: auth.role!,
            },
        });
    };
}

/**
 * Higher-order function to wrap API handler with role check
 * 
 * Usage:
 * export const DELETE = withRole("admin", async (request, { user }) => {
 *     // Only admin can access this
 *     return NextResponse.json({ success: true });
 * });
 */
export function withRole(
    requiredRole: Role,
    handler: (
        request: NextRequest,
        context: { user: { id: string; username: string; role: string } }
    ) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
    return async (request: NextRequest) => {
        const auth = await getAuthUser(request);

        if (!auth.authenticated) {
            return NextResponse.json(
                { error: auth.error || "Unauthorized" },
                { status: 401 }
            );
        }

        if (!hasRole(auth.role!, requiredRole)) {
            return NextResponse.json(
                { error: "Forbidden: Insufficient permissions" },
                { status: 403 }
            );
        }

        return handler(request, {
            user: {
                id: auth.userId!,
                username: auth.username!,
                role: auth.role!,
            },
        });
    };
}

/**
 * Higher-order function to wrap API handler with permission check
 * 
 * Usage:
 * export const POST = withPermission("transaksi:approve", async (request, { user }) => {
 *     // Only users with transaksi:approve permission can access
 *     return NextResponse.json({ approved: true });
 * });
 */
export function withPermission(
    permission: string,
    handler: (
        request: NextRequest,
        context: { user: { id: string; username: string; role: string } }
    ) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
    return async (request: NextRequest) => {
        const auth = await getAuthUser(request);

        if (!auth.authenticated) {
            return NextResponse.json(
                { error: auth.error || "Unauthorized" },
                { status: 401 }
            );
        }

        if (!canPerformAction(auth.role!, permission)) {
            return NextResponse.json(
                { error: `Forbidden: Missing permission '${permission}'` },
                { status: 403 }
            );
        }

        return handler(request, {
            user: {
                id: auth.userId!,
                username: auth.username!,
                role: auth.role!,
            },
        });
    };
}
