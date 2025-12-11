import { z } from "zod";

export const ATTENDANCE_STATUS_OPTIONS = [
    { value: "present", label: "Hadir" },
    { value: "absent", label: "Tidak Hadir" },
    { value: "late", label: "Terlambat" },
    { value: "leave", label: "Izin" },
    { value: "sick", label: "Sakit" },
] as const;

export const attendanceSchema = z.object({
    employeeId: z
        .string()
        .min(1, "Karyawan wajib dipilih"),
    date: z
        .string()
        .min(1, "Tanggal wajib diisi"),
    clockIn: z
        .string()
        .optional()
        .or(z.literal("")),
    clockOut: z
        .string()
        .optional()
        .or(z.literal("")),
    status: z
        .string()
        .min(1, "Status wajib dipilih"),
    overtimeHours: z
        .number()
        .min(0, "Jam lembur tidak boleh negatif")
        .optional()
        .nullable(),
    notes: z
        .string()
        .max(500, "Keterangan maksimal 500 karakter")
        .optional()
        .or(z.literal("")),
});

export const bulkAttendanceSchema = z.object({
    date: z.string().min(1, "Tanggal wajib diisi"),
    entries: z.array(z.object({
        employeeId: z.string().min(1),
        clockIn: z.string().optional().or(z.literal("")),
        clockOut: z.string().optional().or(z.literal("")),
        status: z.string().min(1),
        overtimeHours: z.number().min(0).optional().nullable(),
        notes: z.string().optional().or(z.literal("")),
    })),
});

export type AttendanceInput = z.infer<typeof attendanceSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
