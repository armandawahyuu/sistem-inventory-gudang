import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Attendance Report
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const employeeId = searchParams.get("employeeId");

        const where: Record<string, unknown> = {};

        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate + "T23:59:59"),
            };
        } else if (startDate) {
            where.date = { gte: new Date(startDate) };
        } else if (endDate) {
            where.date = { lte: new Date(endDate + "T23:59:59") };
        }

        if (employeeId && employeeId !== "all") {
            where.employeeId = employeeId;
        }

        const attendances = await prisma.attendance.findMany({
            where,
            include: {
                employee: {
                    select: { nik: true, name: true, position: true, department: true },
                },
            },
            orderBy: [{ date: "desc" }, { employee: { name: "asc" } }],
        });

        // Group by employee for summary
        const employeeStats: Record<string, {
            employee: { id: string; nik: string; name: string; position: string; department: string | null };
            present: number;
            absent: number;
            late: number;
            leave: number;
            total: number;
        }> = {};

        attendances.forEach((att) => {
            if (!employeeStats[att.employeeId]) {
                employeeStats[att.employeeId] = {
                    employee: {
                        id: att.employeeId,
                        nik: att.employee.nik,
                        name: att.employee.name,
                        position: att.employee.position || "-",
                        department: att.employee.department,
                    },
                    present: 0,
                    absent: 0,
                    late: 0,
                    leave: 0,
                    total: 0,
                };
            }

            employeeStats[att.employeeId].total++;
            switch (att.status) {
                case "hadir":
                    employeeStats[att.employeeId].present++;
                    break;
                case "tidak_hadir":
                    employeeStats[att.employeeId].absent++;
                    break;
                case "terlambat":
                    employeeStats[att.employeeId].late++;
                    break;
                case "izin":
                case "sakit":
                case "cuti":
                    employeeStats[att.employeeId].leave++;
                    break;
            }
        });

        const summary = {
            totalRecords: attendances.length,
            totalEmployees: Object.keys(employeeStats).length,
            totalPresent: attendances.filter((a) => a.status === "hadir").length,
            totalAbsent: attendances.filter((a) => a.status === "tidak_hadir").length,
            totalLate: attendances.filter((a) => a.status === "terlambat").length,
            totalLeave: attendances.filter((a) => ["izin", "sakit", "cuti"].includes(a.status)).length,
        };

        const data = attendances.map((att) => ({
            id: att.id,
            date: att.date,
            employeeNik: att.employee.nik,
            employeeName: att.employee.name,
            position: att.employee.position || "-",
            department: att.employee.department || "-",
            status: att.status,
            checkIn: att.clockIn ? att.clockIn.toISOString().slice(11, 16) : null,
            checkOut: att.clockOut ? att.clockOut.toISOString().slice(11, 16) : null,
            notes: att.notes || "-",
        }));

        const employeeSummary = Object.values(employeeStats);

        return NextResponse.json({ data, summary, employeeSummary });
    } catch (error) {
        console.error("Error fetching attendance report:", error);
        return NextResponse.json(
            { error: "Gagal mengambil laporan" },
            { status: 500 }
        );
    }
}
