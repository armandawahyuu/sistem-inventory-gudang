"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 lg:block">
                <Sidebar />
            </aside>

            {/* Mobile Navigation */}
            <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

            {/* Main Content */}
            <div className="lg:pl-64">
                <Header onMenuClick={() => setMobileNavOpen(true)} />

                <main className="p-4 lg:p-6">
                    <ErrorBoundary>
                        {children}
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    );
}
