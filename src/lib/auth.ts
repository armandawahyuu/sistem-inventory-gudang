import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

// ============================================
// COOKIE CONFIGURATION
// ============================================

const isProduction = process.env.NODE_ENV === "production";

const cookieSettings = {
    sessionToken: {
        name: isProduction ? "__Secure-next-auth.session-token" : "next-auth.session-token",
        options: {
            httpOnly: true,
            sameSite: "lax" as const,
            path: "/",
            secure: isProduction,
        },
    },
    callbackUrl: {
        name: isProduction ? "__Secure-next-auth.callback-url" : "next-auth.callback-url",
        options: {
            httpOnly: true,
            sameSite: "lax" as const,
            path: "/",
            secure: isProduction,
        },
    },
    csrfToken: {
        name: isProduction ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token",
        options: {
            httpOnly: true,
            sameSite: "lax" as const,
            path: "/",
            secure: isProduction,
        },
    },
};

// ============================================
// AUTH OPTIONS
// ============================================

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    throw new Error("Username dan password diperlukan");
                }

                // Find user
                const user = await prisma.user.findUnique({
                    where: { username: credentials.username },
                });

                if (!user) {
                    throw new Error("Username tidak ditemukan");
                }

                // Check if account is locked
                if (user.lockedUntil && new Date() < user.lockedUntil) {
                    const remainingMinutes = Math.ceil(
                        (user.lockedUntil.getTime() - Date.now()) / 60000
                    );
                    throw new Error(
                        `Akun terkunci. Coba lagi dalam ${remainingMinutes} menit`
                    );
                }

                // Verify password
                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    // Increment failed attempts
                    const newAttempts = user.failedLoginAttempts + 1;
                    const shouldLock = newAttempts >= 5;

                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            failedLoginAttempts: newAttempts,
                            lockedUntil: shouldLock
                                ? new Date(Date.now() + 15 * 60 * 1000)
                                : null,
                        },
                    });

                    if (shouldLock) {
                        throw new Error("Akun terkunci karena terlalu banyak percobaan gagal");
                    }

                    const remaining = 5 - newAttempts;
                    throw new Error(`Password salah. Sisa percobaan: ${remaining}`);
                }

                // Successful login - reset failed attempts and enforce single session
                await prisma.$transaction([
                    // Reset brute force counters
                    prisma.user.update({
                        where: { id: user.id },
                        data: {
                            failedLoginAttempts: 0,
                            lockedUntil: null,
                            lastLoginAt: new Date(),
                        },
                    }),
                    // Kick old sessions (enforce single session per user)
                    prisma.session.deleteMany({
                        where: { userId: user.id },
                    }),
                ]);

                return {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.username = (user as { username: string }).username;
                token.name = user.name;
                token.role = (user as { role: string }).role;
                token.iat = Math.floor(Date.now() / 1000);
            }

            // Check token age for rotation (regenerate after 1 hour)
            const tokenAge = Math.floor(Date.now() / 1000) - (token.iat as number || 0);
            if (tokenAge > 3600) {
                // Token is older than 1 hour, refresh it
                token.iat = Math.floor(Date.now() / 1000);
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { id: string }).id = token.id as string;
                (session.user as { username: string }).username = token.username as string;
                session.user.name = token.name as string;
                (session.user as { role: string }).role = token.role as string;
            }
            return session;
        },
        async signIn({ user }) {
            // Additional sign-in validation
            if (!user?.id) {
                return false;
            }
            return true;
        },
    },
    events: {
        async signOut({ token }) {
            // Clean up session on logout
            if (token?.id) {
                await prisma.session.deleteMany({
                    where: { userId: token.id as string },
                }).catch(() => {
                    // Ignore cleanup errors
                });
            }
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 8 * 60 * 60, // 8 hours
        updateAge: 30 * 60, // Update session every 30 minutes
    },
    jwt: {
        maxAge: 60 * 60, // 1 hour token expiry
    },
    cookies: cookieSettings,
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
};

// ============================================
// EXPORTS
// ============================================

export { hashPassword, verifyPassword } from "./security/auth-security";
