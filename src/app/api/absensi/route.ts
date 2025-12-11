import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { attendanceSchema, bulkAttendanceSchema } from "@/lib/validations/attendance";

// GET - List attendance records
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const date = searchParams.get("date") || "";
        const employeeId = searchParams.get("employeeId") || "";

        const skip = (page - 1) * limit;

        const where: any = {};

        if (date) {
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);
            where.date = {
                gte: targetDate,
                lt: nextDay,
            };
        }

        if (employeeId) {
            where.employeeId = employeeId;
        }

        const [attendances, total] = await Promise.all([
            prisma.attendance.findMany({
                where,
                skip,
                take: limit,
                include: {
                    employee: { select: { nik: true, name: true, position: true } },
                },
                orderBy: [{ date: "desc" }, { employee: { name: "asc" } }],
            }),
            prisma.attendance.count({ where }),
        ]);

        return NextResponse.json({
            data: attendances,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching attendance:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data absensi" },
            { status: 500 }
        );
    }
}

// POST - Create single or bulk attendance
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Check if bulk or single
        if (body.entries && Array.isArray(body.entries)) {
            // Bulk insert
            const validationResult = bulkAttendanceSchema.safeParse(body);
            if (!validationResult.success) {
                return NextResponse.json(
                    { error: validationResult.error.issues[0].message },
                    { status: 400 }
                );
            }

            const { date, entries } = validationResult.data;
            const parsedDate = new Date(date);
            parsedDate.setHours(0, 0, 0, 0);

            const results = [];
            let successCount = 0;
            let errorCount = 0;

            for (const entry of entries) {
                try {
                    // Check for existing record
                    const existing = await prisma.attendance.findUnique({
                        where: {
                            employeeId_date: {
                                employeeId: entry.employeeId,
                                date: parsedDate,
                            },
                        },
                    });

                    let clockIn: Date | null = null;
                    let clockOut: Date | null = null;

                    if (entry.clockIn) {
                        const [hours, minutes] = entry.clockIn.split(":").map(Number);
                        clockIn = new Date(parsedDate);
                        clockIn.setHours(hours, minutes, 0, 0);
                    }

                    if (entry.clockOut) {
                        const [hours, minutes] = entry.clockOut.split(":").map(Number);
                        clockOut = new Date(parsedDate);
                        clockOut.setHours(hours, minutes, 0, 0);
                    }

                    if (existing) {
                        // Update existing
                        await prisma.attendance.update({
                            where: { id: existing.id },
                            data: {
                                clockIn,
                                clockOut,
                                status: entry.status,
                                overtimeHours: entry.overtimeHours || null,
                                notes: entry.notes || null,
                            },
                        });
                    } else {
                        // Create new
                        await prisma.attendance.create({
                            data: {
                                employeeId: entry.employeeId,
                                date: parsedDate,
                                clockIn,
                                clockOut,
                                status: entry.status,
                                overtimeHours: entry.overtimeHours || null,
                                notes: entry.notes || null,
                            },
                        });
                    }
                    successCount++;
                } catch (err) {
                    errorCount++;
                }
            }

            return NextResponse.json({
                message: `Berhasil menyimpan ${successCount} data absensi`,
                data: { success: successCount, error: errorCount },
            });
        } else {
            // Single insert
            const validationResult = attendanceSchema.safeParse(body);
            if (!validationResult.success) {
                return NextResponse.json(
                    { error: validationResult.error.issues[0].message },
                    { status: 400 }
                );
            }

            const { employeeId, date, clockIn, clockOut, status, overtimeHours, notes } = validationResult.data;

            const parsedDate = new Date(date);
            parsedDate.setHours(0, 0, 0, 0);

            // Check for existing record
            const existing = await prisma.attendance.findUnique({
                where: {
                    employeeId_date: {
                        employeeId,
                        date: parsedDate,
                    },
                },
            });

            if (existing) {
                return NextResponse.json(
                    { error: "Data absensi untuk tanggal ini sudah ada" },
                    { status: 400 }
                );
            }

            let parsedClockIn: Date | null = null;
            let parsedClockOut: Date | null = null;

            if (clockIn) {
                const [hours, minutes] = clockIn.split(":").map(Number);
                parsedClockIn = new Date(parsedDate);
                parsedClockIn.setHours(hours, minutes, 0, 0);
            }

            if (clockOut) {
                const [hours, minutes] = clockOut.split(":").map(Number);
                parsedClockOut = new Date(parsedDate);
                parsedClockOut.setHours(hours, minutes, 0, 0);
            }

            const attendance = await prisma.attendance.create({
                data: {
                    employeeId,
                    date: parsedDate,
                    clockIn: parsedClockIn,
                    clockOut: parsedClockOut,
                    status,
                    overtimeHours: overtimeHours || null,
                    notes: notes || null,
                },
                include: {
                    employee: { select: { nik: true, name: true } },
                },
            });

            return NextResponse.json({
                data: attendance,
                message: "Data absensi berhasil disimpan",
            }, { status: 201 });
        }
    } catch (error) {
        console.error("Error creating attendance:", error);
        return NextResponse.json(
            { error: "Gagal menyimpan data absensi" },
            { status: 500 }
        );
    }
}
