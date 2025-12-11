import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that don't require authentication
const publicRoutes = ["/login"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip API routes and static files
    if (
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Get the token
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    // If accessing login and already authenticated, redirect to master/sparepart
    if (pathname === "/login" && token) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Allow public routes without auth
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Redirect to login if not authenticated
    if (!token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", encodeURI(pathname));
        return NextResponse.redirect(loginUrl);
    }

    // User is authenticated, allow access
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
    ],
};
