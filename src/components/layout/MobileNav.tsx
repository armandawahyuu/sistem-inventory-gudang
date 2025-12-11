"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";

interface MobileNavProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-72 p-0">
                <Sidebar onNavItemClick={() => onOpenChange(false)} />
            </SheetContent>
        </Sheet>
    );
}
