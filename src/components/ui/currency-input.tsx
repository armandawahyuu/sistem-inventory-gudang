"use client";

import { forwardRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number;
    onChange: (value: number) => void;
}

/**
 * Format number to Indonesian Rupiah format (with thousand separators)
 */
function formatToRupiah(num: number): string {
    if (num === 0) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Parse Rupiah string back to number
 */
function parseFromRupiah(str: string): number {
    const cleaned = str.replace(/\./g, "").replace(/[^\d]/g, "");
    return parseInt(cleaned) || 0;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ value, onChange, className, ...props }, ref) => {
        const [displayValue, setDisplayValue] = useState<string>(formatToRupiah(value));

        // Sync display value when external value changes
        useEffect(() => {
            setDisplayValue(formatToRupiah(value));
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const input = e.target.value;

            // Only allow digits and dots
            const cleaned = input.replace(/[^\d.]/g, "");

            // Parse to number
            const numericValue = parseFromRupiah(cleaned);

            // Update display with formatting
            setDisplayValue(formatToRupiah(numericValue));

            // Call onChange with numeric value
            onChange(numericValue);
        };

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            // Select all on focus for easy replacement
            e.target.select();
        };

        return (
            <Input
                ref={ref}
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                placeholder="0"
                className={className}
                {...props}
            />
        );
    }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput, formatToRupiah, parseFromRupiah };
