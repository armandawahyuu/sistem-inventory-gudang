import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { karyawanSchema } from "@/lib/validations/karyawan";

// GET - Get single karyawan by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const employee = await prisma.employee.findUnique({
            where: { id },
        });

        if (!employee) {
            return NextResponse.json(
                { error: "Karyawan tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: employee });
    } catch (error) {
        console.error("Error fetching employee:", error);
        return NextResponse.json(
            { error: "Gagal mengambil data karyawan" },
            { status: 500 }
        );
    }
}

// PUT - Update karyawan
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Validate input
        const validationResult = karyawanSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            );
        }

        // Check if employee exists
        const existing = await prisma.employee.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Karyawan tidak ditemukan" },
                { status: 404 }
            );
        }

        // Check if new nik conflicts with another employee
        if (validationResult.data.nik !== existing.nik) {
            const nikExists = await prisma.employee.findUnique({
                where: { nik: validationResult.data.nik },
            });
            if (nikExists) {
                return NextResponse.json(
                    { error: "NIK sudah terdaftar untuk karyawan lain" },
                    { status: 400 }
                );
            }
        }

        // Clean up data
        const data = {
            ...validationResult.data,
            department: validationResult.data.department || null,
            phone: validationResult.data.phone || null,
        };

        const employee = await prisma.employee.update({
            where: { id },
            data,
        });

        return NextResponse.json({
            data: employee,
            message: "Data karyawan berhasil diperbarui",
        });
    } catch (error) {
        console.error("Error updating employee:", error);
        return NextResponse.json(
            { error: "Gagal memperbarui data karyawan" },
            { status: 500 }
        );
    }
}

// DELETE - Delete karyawan
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if employee exists
        const existing = await prisma.employee.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Karyawan tidak ditemukan" },
                { status: 404 }
            );
        }

        // Check if employee has related records (stock outs, attendances)
        const hasStockOuts = await prisma.stockOut.count({
            where: { employeeId: id },
        });

        if (hasStockOuts > 0) {
            return NextResponse.json(
                { error: "Tidak dapat menghapus karyawan yang memiliki riwayat transaksi" },
                { status: 400 }
            );
        }

        await prisma.employee.delete({
            where: { id },
        });

        return NextResponse.json({
            message: "Karyawan berhasil dihapus",
        });
    } catch (error) {
        console.error("Error deleting employee:", error);
        return NextResponse.json(
            { error: "Gagal menghapus karyawan" },
            { status: 500 }
        );
    }
}
