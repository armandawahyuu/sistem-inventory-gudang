"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, X, Loader2 } from "lucide-react";

interface BarcodeScannerProps {
    open: boolean;
    onClose: () => void;
    onScan: (code: string) => void;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && !isScanning && !isLoading) {
            startScanner();
        }

        return () => {
            stopScanner();
        };
    }, [open]);

    const requestCameraPermission = async (): Promise<boolean> => {
        try {
            // Check if mediaDevices is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Browser tidak mendukung akses kamera. Gunakan browser modern seperti Chrome atau Firefox.");
            }

            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });

            // Stop the stream immediately - we just needed to request permission
            stream.getTracks().forEach(track => track.stop());

            return true;
        } catch (err: any) {
            console.error("Camera permission error:", err);

            // Handle specific error types
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setError("Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda, lalu coba lagi.");
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                setError("Kamera tidak ditemukan. Pastikan perangkat Anda memiliki kamera yang berfungsi.");
            } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                setError("Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain yang menggunakan kamera.");
            } else if (err.name === "OverconstrainedError") {
                setError("Kamera tidak memenuhi persyaratan. Mencoba dengan kamera lain...");
            } else if (err.name === "SecurityError") {
                setError("Akses kamera diblokir karena alasan keamanan. Pastikan Anda menggunakan HTTPS.");
            } else {
                setError(err.message || "Gagal mengakses kamera. Pastikan izin kamera diberikan.");
            }

            return false;
        }
    };

    const startScanner = async () => {
        try {
            setError(null);
            setIsLoading(true);

            // Request camera permission first
            const hasPermission = await requestCameraPermission();
            if (!hasPermission) {
                setIsLoading(false);
                return;
            }

            const scanner = new Html5Qrcode("barcode-reader");
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 150 },
                },
                (decodedText) => {
                    // On successful scan
                    onScan(decodedText);
                    stopScanner();
                    onClose();
                },
                () => {
                    // Scan error - ignore, keep scanning
                }
            );

            setIsScanning(true);
            setIsLoading(false);
        } catch (err: any) {
            console.error("Error starting scanner:", err);
            setIsLoading(false);

            // Handle html5-qrcode specific errors
            if (err?.message?.includes("permission")) {
                setError("Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.");
            } else if (err?.message?.includes("NotFound")) {
                setError("Kamera tidak ditemukan pada perangkat ini.");
            } else {
                setError(err?.message || "Gagal memulai scanner. Silakan coba lagi.");
            }
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && isScanning) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (err) {
                console.error("Error stopping scanner:", err);
            }
        }
        setIsScanning(false);
    };

    const handleClose = () => {
        stopScanner();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Scan Barcode
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-3">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                            <p className="text-sm text-slate-600">Meminta akses kamera...</p>
                        </div>
                    )}

                    {/* Camera View */}
                    {!isLoading && (
                        <div
                            id="barcode-reader"
                            className="w-full rounded-lg overflow-hidden bg-slate-900"
                            style={{ minHeight: "300px" }}
                        />
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                            <Button
                                variant="link"
                                className="text-red-700 underline p-0 h-auto ml-2"
                                onClick={() => startScanner()}
                            >
                                Coba lagi
                            </Button>
                        </div>
                    )}

                    {!isLoading && !error && (
                        <p className="text-sm text-slate-500 text-center">
                            Arahkan kamera ke barcode sparepart
                        </p>
                    )}

                    <Button variant="outline" onClick={handleClose} className="w-full">
                        <X className="mr-2 h-4 w-4" />
                        Batal
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
