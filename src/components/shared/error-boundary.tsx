"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Error caught by boundary:", error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="py-12 text-center">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                        <h3 className="text-lg font-semibold text-red-800 mb-2">
                            Terjadi Kesalahan
                        </h3>
                        <p className="text-red-600 mb-4 max-w-md mx-auto">
                            {this.state.error?.message || "Sesuatu yang tidak terduga terjadi. Silakan coba lagi."}
                        </p>
                        <Button onClick={this.handleRetry} variant="outline">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Coba Lagi
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        return this.props.children;
    }
}

// Hook-based error display for API errors
interface ErrorDisplayProps {
    error: string | null;
    onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
    if (!error) return null;

    return (
        <Card className="border-red-200 bg-red-50">
            <CardContent className="py-8 text-center">
                <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-red-500" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
                <p className="text-red-600 mb-4">{error}</p>
                {onRetry && (
                    <Button onClick={onRetry} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Coba Lagi
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
