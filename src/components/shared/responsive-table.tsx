"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

interface Column<T> {
    key: keyof T | string;
    header: string;
    className?: string;
    render?: (item: T, index: number) => React.ReactNode;
    hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyField: keyof T;
    isLoading?: boolean;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
    mobileCardRender?: (item: T, index: number) => React.ReactNode;
    className?: string;
}

export function ResponsiveTable<T extends Record<string, any>>({
    data,
    columns,
    keyField,
    isLoading = false,
    emptyMessage = "Tidak ada data",
    onRowClick,
    mobileCardRender,
    className,
}: ResponsiveTableProps<T>) {
    const getCellValue = (item: T, column: Column<T>, index: number) => {
        if (column.render) {
            return column.render(item, index);
        }
        return item[column.key as keyof T];
    };

    // Desktop Table View
    const TableView = () => (
        <div className={cn("hidden md:block rounded-md border overflow-x-auto", className)}>
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((col) => (
                            <TableHead
                                key={String(col.key)}
                                className={cn(col.className, col.hideOnMobile && "hidden lg:table-cell")}
                            >
                                {col.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-32 text-center text-slate-500">
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item, index) => (
                            <TableRow
                                key={String(item[keyField])}
                                onClick={() => onRowClick?.(item)}
                                className={cn(onRowClick && "cursor-pointer hover:bg-slate-50")}
                            >
                                {columns.map((col) => (
                                    <TableCell
                                        key={String(col.key)}
                                        className={cn(col.className, col.hideOnMobile && "hidden lg:table-cell")}
                                    >
                                        {getCellValue(item, col, index)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );

    // Mobile Card View
    const CardView = () => (
        <div className="md:hidden space-y-3">
            {data.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-slate-500">
                        {emptyMessage}
                    </CardContent>
                </Card>
            ) : (
                data.map((item, index) => (
                    <Card
                        key={String(item[keyField])}
                        onClick={() => onRowClick?.(item)}
                        className={cn(onRowClick && "cursor-pointer active:bg-slate-50")}
                    >
                        <CardContent className="p-4">
                            {mobileCardRender ? (
                                mobileCardRender(item, index)
                            ) : (
                                <div className="space-y-2">
                                    {columns
                                        .filter((col) => !col.hideOnMobile)
                                        .map((col) => (
                                            <div key={String(col.key)} className="flex justify-between items-start gap-2">
                                                <span className="text-sm text-slate-500 shrink-0">{col.header}</span>
                                                <span className="text-sm font-medium text-right">
                                                    {getCellValue(item, col, index)}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );

    return (
        <>
            <TableView />
            <CardView />
        </>
    );
}
