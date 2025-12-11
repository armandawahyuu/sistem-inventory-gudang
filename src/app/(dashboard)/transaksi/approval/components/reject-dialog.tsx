"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface RejectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => Promise<void>;
    isLoading: boolean;
    itemName: string;
}

export function RejectDialog({
    open,
    onOpenChange,
    onConfirm,
    isLoading,
    itemName,
}: RejectDialogProps) {
    const [reason, setReason] = useState("");

    const handleConfirm = async () => {
        if (!reason.trim()) return;
        await onConfirm(reason);
        setReason("");
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            setReason("");
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tolak Request</DialogTitle>
                    <DialogDescription>
                        Berikan alasan penolakan untuk request barang keluar "{itemName}".
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        placeholder="Alasan penolakan wajib diisi..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="resize-none"
                        rows={3}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleClose(false)} disabled={isLoading}>
                        Batal
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isLoading || !reason.trim()}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Tolak Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
