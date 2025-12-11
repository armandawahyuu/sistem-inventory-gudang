import { z } from "zod";

// Login validation schema
export const loginSchema = z.object({
    username: z
        .string()
        .min(1, "Username wajib diisi")
        .min(3, "Username minimal 3 karakter"),
    password: z
        .string()
        .min(1, "Password wajib diisi")
        .min(6, "Password minimal 6 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// User creation validation schema
export const createUserSchema = z.object({
    username: z
        .string()
        .min(3, "Username minimal 3 karakter")
        .max(50, "Username maksimal 50 karakter")
        .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
    password: z
        .string()
        .min(6, "Password minimal 6 karakter")
        .max(100, "Password maksimal 100 karakter"),
    name: z
        .string()
        .min(1, "Nama wajib diisi")
        .max(100, "Nama maksimal 100 karakter"),
    role: z.enum(["ADMIN", "MANAGER", "STAFF"], {
        message: "Role tidak valid",
    }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
