"use client";

import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Toaster } from "sonner";

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ErrorBoundary>
            {children}
            <Toaster
                position="top-right"
                richColors
                closeButton
                toastOptions={{
                    duration: 4000,
                    // Custom styling
                    classNames: {
                        toast: "font-sans",
                        title: "font-medium",
                        description: "text-sm",
                    },
                }}
            />
        </ErrorBoundary>
    );
}
