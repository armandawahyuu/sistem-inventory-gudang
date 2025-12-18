"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Package, Lock, User, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginInput) => {
        setError("");
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                username: data.username,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
            </div>

            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />

            {/* Main card */}
            <Card className="w-full max-w-[420px] relative z-10 shadow-2xl border-white/10 bg-white/[0.03] backdrop-blur-xl">
                <CardHeader className="space-y-1 text-center pb-6 pt-8">
                    {/* Logo with glow effect */}
                    <div className="mx-auto relative">
                        <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-xl opacity-40 animate-pulse" />
                        <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25">
                            <Package className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <div className="pt-4">
                        <CardTitle className="text-2xl font-bold text-white tracking-tight">
                            Selamat Datang
                        </CardTitle>
                        <CardDescription className="text-slate-400 mt-2">
                            Sistem Inventory Gudang Sparepart Alat Berat
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="pb-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Global Error */}
                        {error && (
                            <div className="p-3.5 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 backdrop-blur-sm">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Username Field */}
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-slate-300 text-sm font-medium">
                                Username
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Masukkan username"
                                    className={`h-12 pl-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl transition-all ${errors.username ? "border-red-500/50 focus:ring-red-500/20" : ""
                                        }`}
                                    {...register("username")}
                                />
                            </div>
                            {errors.username && (
                                <p className="text-sm text-red-400 flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-red-400" />
                                    {errors.username.message}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
                                Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Masukkan password"
                                    className={`h-12 pl-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl transition-all ${errors.password ? "border-red-500/50 focus:ring-red-500/20" : ""
                                        }`}
                                    {...register("password")}
                                />
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-400 flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-red-400" />
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Memproses...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Masuk
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </span>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Copyright */}
            <p className="mt-8 text-center text-sm text-slate-500 relative z-10">
                © {new Date().getFullYear()} <span className="text-slate-400">PT WAHYU KREASI DIGITAL</span>
                <br />
                <span className="text-xs text-slate-600">All rights reserved.</span>
            </p>
        </div>
    );
}
