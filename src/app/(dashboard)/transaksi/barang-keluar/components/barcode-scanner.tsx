"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, X } from "lucide-react";

interface BarcodeScannerProps {
    open: boolean;
    onClose: () => void;
    onScan: (code: string) => void;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && !isScanning) {
            startScanner();
        }

        return () => {
            stopScanner();
        };
    }, [open]);

    const startScanner = async () => {
        try {
            setError(null);
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
        } catch (err: any) {
            console.error("Error starting scanner:", err);
            setError(err?.message || "Gagal mengakses kamera. Pastikan izin kamera diberikan.");
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
                    <div
                        id="barcode-reader"
                        className="w-full rounded-lg overflow-hidden bg-slate-900"
                        style={{ minHeight: "300px" }}
                    />

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <p className="text-sm text-slate-500 text-center">
                        Arahkan kamera ke barcode sparepart
                    </p>

                    <Button variant="outline" onClick={handleClose} className="w-full">
                        <X className="mr-2 h-4 w-4" />
                        Batal
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
