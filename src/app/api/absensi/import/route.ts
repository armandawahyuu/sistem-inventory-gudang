import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface AttendanceRow {
    nik: string;
    date: string;
    clockIn: string | null;
    clockOut: string | null;
}

interface ImportResult {
    row: number;
    nik: string;
    date: string;
    status: "success" | "error";
    message: string;
}

// POST - Bulk import attendance data
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { data } = body as { data: AttendanceRow[] };

        if (!data || !Array.isArray(data) || data.length === 0) {
            return NextResponse.json(
                { error: "Data tidak valid" },
                { status: 400 }
            );
        }

        const results: ImportResult[] = [];
        let successCount = 0;
        let errorCount = 0;

        // Get all employees for validation
        const employees = await prisma.employee.findMany({
            select: { id: true, nik: true },
        });
        const employeeMap = new Map(employees.map(e => [e.nik, e.id]));

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 2; // Excel row number (1-indexed + header)

            try {
                // Validate NIK
                if (!row.nik) {
                    results.push({
                        row: rowNum,
                        nik: row.nik || "",
                        date: row.date || "",
                        status: "error",
                        message: "NIK kosong",
                    });
                    errorCount++;
                    continue;
                }

                const employeeId = employeeMap.get(row.nik);
                if (!employeeId) {
                    results.push({
                        row: rowNum,
                        nik: row.nik,
                        date: row.date || "",
                        status: "error",
                        message: `NIK "${row.nik}" tidak ditemukan di master karyawan`,
                    });
                    errorCount++;
                    continue;
                }

                // Parse date (DD/MM/YYYY)
                if (!row.date) {
                    results.push({
                        row: rowNum,
                        nik: row.nik,
                        date: "",
                        status: "error",
                        message: "Tanggal kosong",
                    });
                    errorCount++;
                    continue;
                }

                let parsedDate: Date;
                const dateParts = row.date.split("/");
                if (dateParts.length === 3) {
                    const [day, month, year] = dateParts;
                    parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                } else {
                    parsedDate = new Date(row.date);
                }

                if (isNaN(parsedDate.getTime())) {
                    results.push({
                        row: rowNum,
                        nik: row.nik,
                        date: row.date,
                        status: "error",
                        message: "Format tanggal tidak valid (gunakan DD/MM/YYYY)",
                    });
                    errorCount++;
                    continue;
                }

                // Check for duplicates
                const existing = await prisma.attendance.findUnique({
                    where: {
                        employeeId_date: {
                            employeeId,
                            date: parsedDate,
                        },
                    },
                });

                if (existing) {
                    results.push({
                        row: rowNum,
                        nik: row.nik,
                        date: row.date,
                        status: "error",
                        message: "Data sudah ada untuk tanggal ini",
                    });
                    errorCount++;
                    continue;
                }

                // Parse clock times
                let clockIn: Date | null = null;
                let clockOut: Date | null = null;

                if (row.clockIn) {
                    const [hours, minutes] = row.clockIn.split(":").map(Number);
                    clockIn = new Date(parsedDate);
                    clockIn.setHours(hours || 0, minutes || 0, 0, 0);
                }

                if (row.clockOut) {
                    const [hours, minutes] = row.clockOut.split(":").map(Number);
                    clockOut = new Date(parsedDate);
                    clockOut.setHours(hours || 0, minutes || 0, 0, 0);
                }

                // Determine status (late if clock in > 08:00)
                let status = "present";
                if (clockIn) {
                    const clockInHour = clockIn.getHours();
                    const clockInMinute = clockIn.getMinutes();
                    if (clockInHour > 8 || (clockInHour === 8 && clockInMinute > 0)) {
                        status = "late";
                    }
                } else {
                    status = "absent";
                }

                // Create attendance record
                await prisma.attendance.create({
                    data: {
                        employeeId,
                        date: parsedDate,
                        clockIn,
                        clockOut,
                        status,
                    },
                });

                results.push({
                    row: rowNum,
                    nik: row.nik,
                    date: row.date,
                    status: "success",
                    message: `Berhasil import (${status})`,
                });
                successCount++;
            } catch (err: any) {
                results.push({
                    row: rowNum,
                    nik: row.nik || "",
                    date: row.date || "",
                    status: "error",
                    message: err.message || "Error tidak diketahui",
                });
                errorCount++;
            }
        }

        return NextResponse.json({
            data: {
                results,
                summary: {
                    total: data.length,
                    success: successCount,
                    error: errorCount,
                },
            },
            message: `Import selesai: ${successCount} berhasil, ${errorCount} gagal`,
        });
    } catch (error) {
        console.error("Error importing attendance:", error);
        return NextResponse.json(
            { error: "Gagal import data absensi" },
            { status: 500 }
        );
    }
}
