"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Loader2 } from "lucide-react";

interface BarcodeScannerProps {
    open: boolean;
    onClose: () => void;
    onScan: (code: string) => void;
}

// Play loud beep sound on successful scan
const playBeep = () => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // First beep
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.frequency.value = 1000;
        osc1.type = "square";
        gain1.gain.setValueAtTime(0.8, audioContext.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.12);
        osc1.start(audioContext.currentTime);
        osc1.stop(audioContext.currentTime + 0.12);

        // Second beep
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1200;
        osc2.type = "square";
        gain2.gain.setValueAtTime(0.8, audioContext.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.27);
        osc2.start(audioContext.currentTime + 0.15);
        osc2.stop(audioContext.currentTime + 0.27);
    } catch (err) {
        console.error("Error playing beep:", err);
    }
};

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScannedRef = useRef<string | null>(null);
    const lastScanTimeRef = useRef<number>(0);
    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState(false);

    const requestCameraPermission = useCallback(async (): Promise<boolean> => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Browser tidak mendukung akses kamera.");
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (err: any) {
            if (err.name === "NotAllowedError") {
                setError("Akses kamera ditolak. Izinkan akses kamera di browser.");
            } else if (err.name === "NotFoundError") {
                setError("Kamera tidak ditemukan.");
            } else {
                setError(err.message || "Gagal mengakses kamera.");
            }
            return false;
        }
    }, []);

    const initializeScanner = useCallback(async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, 300));

            const element = document.getElementById("barcode-reader");
            if (!element) {
                throw new Error("Scanner element not found.");
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
                    // Debounce: ignore same barcode for 1.5 seconds
                    const now = Date.now();
                    const isSameCode = lastScannedRef.current === decodedText;
                    const isWithinCooldown = now - lastScanTimeRef.current < 1500;

                    if (isSameCode && isWithinCooldown) {
                        return; // Skip duplicate scan
                    }

                    // Update last scan info
                    lastScannedRef.current = decodedText;
                    lastScanTimeRef.current = now;

                    // Scan sukses - bunyi beep, kirim hasil
                    playBeep();
                    onScan(decodedText);
                },
                () => { }
            );

            setIsScanning(true);
            setIsLoading(false);
        } catch (err: any) {
            console.error("Error starting scanner:", err);
            setIsLoading(false);
            setHasPermission(false);
            setError(err?.message || "Gagal memulai scanner.");
        }
    }, [onScan]);

    const startScanner = useCallback(async () => {
        setError(null);
        setIsLoading(true);
        setHasPermission(false);

        const permitted = await requestCameraPermission();
        if (!permitted) {
            setIsLoading(false);
            return;
        }
        setHasPermission(true);
    }, [requestCameraPermission]);

    useEffect(() => {
        if (hasPermission && isLoading && !isScanning) {
            initializeScanner();
        }
    }, [hasPermission, isLoading, isScanning, initializeScanner]);

    useEffect(() => {
        if (open && !isScanning && !isLoading) {
            startScanner();
        }
        return () => {
            stopScanner();
        };
    }, [open]);

    const stopScanner = async () => {
        const scanner = scannerRef.current;
        scannerRef.current = null;

        if (scanner) {
            try {
                const state = scanner.getState();
                if (state === 2) {
                    await scanner.stop();
                }
                scanner.clear();
            } catch (err) {
                console.error("Error stopping scanner:", err);
            }
        }
        setIsScanning(false);
        setHasPermission(false);
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
                    {/* Camera View */}
                    <div
                        id="barcode-reader"
                        className="w-full rounded-lg overflow-hidden bg-slate-900"
                        style={{ minHeight: "300px" }}
                    />

                    {/* Loading */}
                    {isLoading && !hasPermission && (
                        <div className="flex items-center justify-center gap-2 text-slate-600">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Meminta akses kamera...</span>
                        </div>
                    )}

                    {/* Error */}
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

                    {/* Instruction */}
                    {isScanning && (
                        <p className="text-sm text-green-600 text-center font-medium">
                            ✓ Arahkan kamera ke barcode - terus scan sampai selesai
                        </p>
                    )}

                    {/* Close button */}
                    <Button onClick={handleClose} className="w-full bg-green-600 hover:bg-green-700">
                        Selesai Scan
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
