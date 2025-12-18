"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface DatePickerProps {
    value?: Date
    onChange?: (date: Date | undefined) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

function DatePicker({
    value,
    onChange,
    placeholder = "Pilih tanggal",
    className,
    disabled = false,
}: DatePickerProps) {
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateValue = e.target.value
        if (dateValue) {
            onChange?.(new Date(dateValue))
        } else {
            onChange?.(undefined)
        }
    }

    return (
        <div className={cn("relative", className)}>
            <Input
                ref={inputRef}
                type="date"
                value={value ? format(value, "yyyy-MM-dd") : ""}
                onChange={handleChange}
                disabled={disabled}
                className="pr-10"
            />
            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
    )
}

export interface DateRangePickerProps {
    startDate?: Date
    endDate?: Date
    onStartDateChange?: (date: Date | undefined) => void
    onEndDateChange?: (date: Date | undefined) => void
    className?: string
    disabled?: boolean
}

function DateRangePicker({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    className,
    disabled = false,
}: DateRangePickerProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <DatePicker
                value={startDate}
                onChange={onStartDateChange}
                placeholder="Dari tanggal"
                disabled={disabled}
            />
            <span className="text-muted-foreground">-</span>
            <DatePicker
                value={endDate}
                onChange={onEndDateChange}
                placeholder="Sampai tanggal"
                disabled={disabled}
            />
        </div>
    )
}

export { DatePicker, DateRangePicker }
