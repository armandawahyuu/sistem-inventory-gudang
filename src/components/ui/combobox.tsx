"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface ComboboxOption {
    value: string
    label: string
    description?: string
}

export interface ComboboxProps {
    options: ComboboxOption[]
    value?: string
    onChange?: (value: string | undefined) => void
    onSearch?: (query: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    className?: string
    disabled?: boolean
    loading?: boolean
}

function Combobox({
    options,
    value,
    onChange,
    onSearch,
    placeholder = "Pilih item...",
    searchPlaceholder = "Cari...",
    emptyText = "Tidak ada data",
    className,
    disabled = false,
    loading = false,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const containerRef = React.useRef<HTMLDivElement>(null)

    const selectedOption = options.find((opt) => opt.value === value)

    // Filter options based on search
    const filteredOptions = React.useMemo(() => {
        if (!search) return options
        const lowered = search.toLowerCase()
        return options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(lowered) ||
                opt.description?.toLowerCase().includes(lowered)
        )
    }, [options, search])

    // Handle search change with debounce
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value
        setSearch(query)
        onSearch?.(query)
    }

    // Handle select
    const handleSelect = (optionValue: string) => {
        onChange?.(value === optionValue ? undefined : optionValue)
        setOpen(false)
        setSearch("")
    }

    // Handle clear
    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange?.(undefined)
    }

    // Close on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                type="button"
            >
                <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div className="flex items-center gap-1">
                    {selectedOption && !disabled && (
                        <X
                            className="h-4 w-4 text-muted-foreground hover:text-foreground"
                            onClick={handleClear}
                        />
                    )}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </div>
            </Button>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                    {/* Search input */}
                    <div className="flex items-center border-b px-3 py-2">
                        <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={handleSearchChange}
                            className="border-0 p-0 h-8 focus-visible:ring-0 focus-visible:ring-offset-0"
                            autoFocus
                        />
                    </div>

                    {/* Options list */}
                    <ScrollArea className="max-h-60">
                        {loading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredOptions.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
                        ) : (
                            <div className="p-1">
                                {filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        className={cn(
                                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent",
                                            value === option.value && "bg-accent"
                                        )}
                                        onClick={() => handleSelect(option.value)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === option.value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex-1 overflow-hidden">
                                            <div className="truncate font-medium">{option.label}</div>
                                            {option.description && (
                                                <div className="truncate text-xs text-muted-foreground">
                                                    {option.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            )}
        </div>
    )
}

// Search Combobox with async search
export interface SearchComboboxProps extends Omit<ComboboxProps, "options" | "onSearch"> {
    searchEndpoint: string
    labelKey?: string
    valueKey?: string
    descriptionKey?: string
    minSearchLength?: number
}

function SearchCombobox({
    searchEndpoint,
    labelKey = "name",
    valueKey = "id",
    descriptionKey,
    minSearchLength = 2,
    ...props
}: SearchComboboxProps) {
    const [options, setOptions] = React.useState<ComboboxOption[]>([])
    const [loading, setLoading] = React.useState(false)
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleSearch = async (query: string) => {
        if (query.length < minSearchLength) {
            setOptions([])
            return
        }

        // Debounce
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            try {
                const response = await fetch(`${searchEndpoint}?search=${encodeURIComponent(query)}`)
                const data = await response.json()
                const items = data.data || data || []
                setOptions(
                    items.map((item: Record<string, unknown>) => ({
                        value: String(item[valueKey]),
                        label: String(item[labelKey]),
                        description: descriptionKey ? String(item[descriptionKey]) : undefined,
                    }))
                )
            } catch (error) {
                console.error("Search error:", error)
                setOptions([])
            } finally {
                setLoading(false)
            }
        }, 300)
    }

    return (
        <Combobox
            options={options}
            onSearch={handleSearch}
            loading={loading}
            emptyText={`Ketik minimal ${minSearchLength} karakter untuk mencari`}
            {...props}
        />
    )
}

export { Combobox, SearchCombobox }
