import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Get monthly attendance recap
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
        const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
        const employeeId = searchParams.get("employeeId") || "";

        // Calculate date range for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        // Build where clause for employees
        const employeeWhere: any = { isActive: true };
        if (employeeId) {
            employeeWhere.id = employeeId;
        }

        // Get all active employees
        const employees = await prisma.employee.findMany({
            where: employeeWhere,
            select: {
                id: true,
                nik: true,
                name: true,
                position: true,
            },
            orderBy: { name: "asc" },
        });

        // Get attendance records for the month
        const attendances = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                ...(employeeId && { employeeId }),
            },
            select: {
                employeeId: true,
                status: true,
                overtimeHours: true,
            },
        });

        // Aggregate data per employee
        const recapData = employees.map((emp) => {
            const empAttendances = attendances.filter((a) => a.employeeId === emp.id);

            const present = empAttendances.filter((a) => a.status === "present").length;
            const absent = empAttendances.filter((a) => a.status === "absent").length;
            const late = empAttendances.filter((a) => a.status === "late").length;
            const leave = empAttendances.filter((a) => a.status === "leave").length;
            const sick = empAttendances.filter((a) => a.status === "sick").length;
            const totalOvertime = empAttendances.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

            return {
                id: emp.id,
                nik: emp.nik,
                name: emp.name,
                position: emp.position,
                present,
                absent,
                late,
                leave,
                sick,
                totalOvertime,
                totalDays: empAttendances.length,
            };
        });

        // Daily chart data
        const daysInMonth = new Date(year, month, 0).getDate();
        const chartData = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(year, month - 1, day);
            const dayAttendances = attendances.filter((a) => {
                // Note: This is a simplified comparison
                return true; // We'd need the full date field to do proper daily comparison
            });

            chartData.push({
                day,
                date: `${day}/${month}`,
            });
        }

        // Summary totals
        const summary = {
            totalEmployees: employees.length,
            totalPresent: recapData.reduce((sum, r) => sum + r.present, 0),
            totalAbsent: recapData.reduce((sum, r) => sum + r.absent, 0),
            totalLate: recapData.reduce((sum, r) => sum + r.late, 0),
            totalLeave: recapData.reduce((sum, r) => sum + r.leave, 0),
            totalSick: recapData.reduce((sum, r) => sum + r.sick, 0),
            totalOvertime: recapData.reduce((sum, r) => sum + r.totalOvertime, 0),
        };

        // Daily summary for chart
        const dailySummary: { [key: string]: { present: number; absent: number; late: number } } = {};

        // Get attendances with full date for chart
        const fullAttendances = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                date: true,
                status: true,
            },
        });

        fullAttendances.forEach((a) => {
            const dayKey = a.date.getDate().toString();
            if (!dailySummary[dayKey]) {
                dailySummary[dayKey] = { present: 0, absent: 0, late: 0 };
            }
            if (a.status === "present") dailySummary[dayKey].present++;
            else if (a.status === "absent") dailySummary[dayKey].absent++;
            else if (a.status === "late") dailySummary[dayKey].late++;
        });

        const dailyChartData = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const data = dailySummary[day.toString()] || { present: 0, absent: 0, late: 0 };
            dailyChartData.push({
                day,
                tanggal: `${day}`,
                hadir: data.present,
                tidak_hadir: data.absent,
                terlambat: data.late,
            });
        }

        return NextResponse.json({
            data: {
                recap: recapData,
                summary,
                chartData: dailyChartData,
                month,
                year,
            },
        });
    } catch (error) {
        console.error("Error fetching attendance recap:", error);
        return NextResponse.json(
            { error: "Gagal mengambil rekap absensi" },
            { status: 500 }
        );
    }
}
