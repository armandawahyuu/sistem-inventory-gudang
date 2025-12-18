import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// GET - Find duplicates, empty fields, or invalid references
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get("action"); // duplicates, empty, references
        const type = searchParams.get("type"); // sparepart, alat-berat, karyawan
        const field = searchParams.get("field"); // name, code, nik

        // Find Invalid References
        if (action === "references") {
            const issues: {
                type: string;
                issue: string;
                count: number;
                items: { id: string; name: string; relatedField: string }[];
            }[] = [];

            // Check spareparts with invalid categoryId
            const sparepartsInvalidCategory = await prisma.sparepart.findMany({
                where: {
                    categoryId: {
                        notIn: (await prisma.category.findMany({ select: { id: true } })).map(c => c.id)
                    }
                },
                select: { id: true, name: true, categoryId: true }
            });

            if (sparepartsInvalidCategory.length > 0) {
                issues.push({
                    type: "sparepart",
                    issue: "Kategori tidak valid",
                    count: sparepartsInvalidCategory.length,
                    items: sparepartsInvalidCategory.map(sp => ({
                        id: sp.id,
                        name: sp.name,
                        relatedField: sp.categoryId
                    }))
                });
            }

            // Check stockIns with invalid sparepartId
            const stockInsInvalidSparepart = await prisma.stockIn.findMany({
                where: {
                    sparepartId: {
                        notIn: (await prisma.sparepart.findMany({ select: { id: true } })).map(s => s.id)
                    }
                },
                select: { id: true, sparepartId: true }
            });

            if (stockInsInvalidSparepart.length > 0) {
                issues.push({
                    type: "stockIn",
                    issue: "Sparepart tidak valid",
                    count: stockInsInvalidSparepart.length,
                    items: stockInsInvalidSparepart.map(si => ({
                        id: si.id,
                        name: `StockIn ${si.id.slice(0, 8)}`,
                        relatedField: si.sparepartId
                    }))
                });
            }

            // Check stockOuts with invalid references
            const stockOutsInvalidSparepart = await prisma.stockOut.findMany({
                where: {
                    sparepartId: {
                        notIn: (await prisma.sparepart.findMany({ select: { id: true } })).map(s => s.id)
                    }
                },
                select: { id: true, sparepartId: true }
            });

            if (stockOutsInvalidSparepart.length > 0) {
                issues.push({
                    type: "stockOut",
                    issue: "Sparepart tidak valid",
                    count: stockOutsInvalidSparepart.length,
                    items: stockOutsInvalidSparepart.map(so => ({
                        id: so.id,
                        name: `StockOut ${so.id.slice(0, 8)}`,
                        relatedField: so.sparepartId
                    }))
                });
            }

            return NextResponse.json({
                action: "references",
                totalIssues: issues.length,
                totalAffected: issues.reduce((sum, i) => sum + i.count, 0),
                issues,
            });
        }

        // Find Empty Fields
        if (action === "empty") {
            const emptyItems: { id: string; type: string; name: string; emptyFields: string[] }[] = [];

            // Sparepart - required: code, name, categoryId, unit
            const spareparts = await prisma.sparepart.findMany({
                where: {
                    OR: [
                        { code: { equals: "" } },
                        { name: { equals: "" } },
                        { unit: { equals: "" } },
                    ],
                },
                include: { category: true },
            });

            spareparts.forEach((sp) => {
                const emptyFields: string[] = [];
                if (!sp.code || sp.code === "") emptyFields.push("code");
                if (!sp.name || sp.name === "") emptyFields.push("name");
                if (!sp.unit || sp.unit === "") emptyFields.push("unit");
                if (emptyFields.length > 0) {
                    emptyItems.push({
                        id: sp.id,
                        type: "sparepart",
                        name: sp.name || sp.code || "Unnamed",
                        emptyFields,
                    });
                }
            });

            // Alat Berat
            const equipments = await prisma.heavyEquipment.findMany({
                where: {
                    OR: [
                        { code: { equals: "" } },
                        { name: { equals: "" } },
                        { type: { equals: "" } },
                    ],
                },
            });

            equipments.forEach((eq) => {
                const emptyFields: string[] = [];
                if (!eq.code || eq.code === "") emptyFields.push("code");
                if (!eq.name || eq.name === "") emptyFields.push("name");
                if (!eq.type || eq.type === "") emptyFields.push("type");
                if (emptyFields.length > 0) {
                    emptyItems.push({
                        id: eq.id,
                        type: "alat-berat",
                        name: eq.name || eq.code || "Unnamed",
                        emptyFields,
                    });
                }
            });

            // Karyawan
            const employees = await prisma.employee.findMany({
                where: {
                    OR: [
                        { nik: { equals: "" } },
                        { name: { equals: "" } },
                    ],
                },
            });

            employees.forEach((emp) => {
                const emptyFields: string[] = [];
                if (!emp.nik || emp.nik === "") emptyFields.push("nik");
                if (!emp.name || emp.name === "") emptyFields.push("name");
                if (emptyFields.length > 0) {
                    emptyItems.push({
                        id: emp.id,
                        type: "karyawan",
                        name: emp.name || emp.nik || "Unnamed",
                        emptyFields,
                    });
                }
            });

            return NextResponse.json({
                action: "empty",
                totalItems: emptyItems.length,
                items: emptyItems,
            });
        }

        // Find Duplicates
        if (!type || !field) {
            return NextResponse.json(
                { error: "Parameter type dan field diperlukan untuk cari duplikat" },
                { status: 400 }
            );
        }

        const duplicates: { value: string; count: number; items: unknown[] }[] = [];

        switch (type) {
            case "sparepart":
                if (field === "name") {
                    const nameGroups = await prisma.sparepart.groupBy({
                        by: ["name"],
                        _count: { name: true },
                        having: { name: { _count: { gt: 1 } } },
                    });

                    for (const group of nameGroups) {
                        const items = await prisma.sparepart.findMany({
                            where: { name: group.name },
                            include: { category: true },
                        });
                        duplicates.push({
                            value: group.name,
                            count: group._count.name,
                            items,
                        });
                    }
                } else if (field === "code") {
                    const codeGroups = await prisma.sparepart.groupBy({
                        by: ["code"],
                        _count: { code: true },
                        having: { code: { _count: { gt: 1 } } },
                    });

                    for (const group of codeGroups) {
                        const items = await prisma.sparepart.findMany({
                            where: { code: group.code },
                            include: { category: true },
                        });
                        duplicates.push({
                            value: group.code,
                            count: group._count.code,
                            items,
                        });
                    }
                }
                break;

            case "alat-berat":
                if (field === "name") {
                    const nameGroups = await prisma.heavyEquipment.groupBy({
                        by: ["name"],
                        _count: { name: true },
                        having: { name: { _count: { gt: 1 } } },
                    });

                    for (const group of nameGroups) {
                        const items = await prisma.heavyEquipment.findMany({
                            where: { name: group.name },
                        });
                        duplicates.push({
                            value: group.name,
                            count: group._count.name,
                            items,
                        });
                    }
                } else if (field === "code") {
                    const codeGroups = await prisma.heavyEquipment.groupBy({
                        by: ["code"],
                        _count: { code: true },
                        having: { code: { _count: { gt: 1 } } },
                    });

                    for (const group of codeGroups) {
                        const items = await prisma.heavyEquipment.findMany({
                            where: { code: group.code },
                        });
                        duplicates.push({
                            value: group.code,
                            count: group._count.code,
                            items,
                        });
                    }
                }
                break;

            case "karyawan":
                if (field === "name") {
                    const nameGroups = await prisma.employee.groupBy({
                        by: ["name"],
                        _count: { name: true },
                        having: { name: { _count: { gt: 1 } } },
                    });

                    for (const group of nameGroups) {
                        const items = await prisma.employee.findMany({
                            where: { name: group.name },
                        });
                        duplicates.push({
                            value: group.name,
                            count: group._count.name,
                            items,
                        });
                    }
                } else if (field === "nik") {
                    const nikGroups = await prisma.employee.groupBy({
                        by: ["nik"],
                        _count: { nik: true },
                        having: { nik: { _count: { gt: 1 } } },
                    });

                    for (const group of nikGroups) {
                        const items = await prisma.employee.findMany({
                            where: { nik: group.nik },
                        });
                        duplicates.push({
                            value: group.nik,
                            count: group._count.nik,
                            items,
                        });
                    }
                }
                break;

            default:
                return NextResponse.json({ error: "Tipe tidak valid" }, { status: 400 });
        }

        return NextResponse.json({
            type,
            field,
            totalDuplicateGroups: duplicates.length,
            duplicates,
        });
    } catch (error) {
        console.error("Error in cleanup:", error);
        return NextResponse.json(
            { error: "Gagal memproses request" },
            { status: 500 }
        );
    }
}

// POST - Delete, Update, Standardize, or Fix References
const deleteSchema = z.object({
    type: z.enum(["sparepart", "alat-berat", "karyawan", "stockIn", "stockOut"]),
    id: z.string(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const action = body.action;

        // Delete item
        if (action === "delete") {
            const parsed = deleteSchema.safeParse(body);
            if (!parsed.success) {
                return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
            }

            const { type, id } = parsed.data;
            let deletedName = "";

            switch (type) {
                case "sparepart":
                    const sp = await prisma.sparepart.findUnique({ where: { id } });
                    deletedName = sp?.name || id;
                    await prisma.sparepart.delete({ where: { id } });
                    break;
                case "alat-berat":
                    const eq = await prisma.heavyEquipment.findUnique({ where: { id } });
                    deletedName = eq?.name || id;
                    await prisma.heavyEquipment.delete({ where: { id } });
                    break;
                case "karyawan":
                    const emp = await prisma.employee.findUnique({ where: { id } });
                    deletedName = emp?.name || id;
                    await prisma.employee.delete({ where: { id } });
                    break;
                case "stockIn":
                    await prisma.stockIn.delete({ where: { id } });
                    deletedName = id;
                    break;
                case "stockOut":
                    await prisma.stockOut.delete({ where: { id } });
                    deletedName = id;
                    break;
            }

            // Log cleanup
            await prisma.cleanupLog.create({
                data: {
                    action: "delete",
                    type,
                    description: `Menghapus ${type}: ${deletedName}`,
                    affectedCount: 1,
                    details: { id, name: deletedName } as unknown as Prisma.InputJsonValue,
                },
            });

            return NextResponse.json({ message: "Data berhasil dihapus" });
        }

        // Standardize data
        if (action === "standardize") {
            const results = {
                spareparts: 0,
                equipments: 0,
                employees: 0,
                categories: 0,
            };
            const details: { type: string; id: string; changes: string }[] = [];

            // Standardize Spareparts
            const spareparts = await prisma.sparepart.findMany();
            for (const sp of spareparts) {
                const updates: { code?: string; name?: string } = {};
                const changes: string[] = [];
                if (sp.code !== sp.code.toUpperCase()) {
                    updates.code = sp.code.toUpperCase();
                    changes.push(`code: ${sp.code} → ${updates.code}`);
                }
                if (sp.name !== sp.name.trim()) {
                    updates.name = sp.name.trim();
                    changes.push(`name trimmed`);
                }
                if (Object.keys(updates).length > 0) {
                    await prisma.sparepart.update({
                        where: { id: sp.id },
                        data: updates,
                    });
                    results.spareparts++;
                    details.push({ type: "sparepart", id: sp.id, changes: changes.join(", ") });
                }
            }

            // Standardize Heavy Equipment
            const equipments = await prisma.heavyEquipment.findMany();
            for (const eq of equipments) {
                const updates: { code?: string; name?: string } = {};
                const changes: string[] = [];
                if (eq.code !== eq.code.toUpperCase()) {
                    updates.code = eq.code.toUpperCase();
                    changes.push(`code: ${eq.code} → ${updates.code}`);
                }
                if (eq.name !== eq.name.trim()) {
                    updates.name = eq.name.trim();
                    changes.push(`name trimmed`);
                }
                if (Object.keys(updates).length > 0) {
                    await prisma.heavyEquipment.update({
                        where: { id: eq.id },
                        data: updates,
                    });
                    results.equipments++;
                    details.push({ type: "alat-berat", id: eq.id, changes: changes.join(", ") });
                }
            }

            // Standardize Employees
            const employees = await prisma.employee.findMany();
            for (const emp of employees) {
                const updates: { nik?: string; name?: string } = {};
                const changes: string[] = [];
                if (emp.nik !== emp.nik.toUpperCase()) {
                    updates.nik = emp.nik.toUpperCase();
                    changes.push(`nik: ${emp.nik} → ${updates.nik}`);
                }
                if (emp.name !== emp.name.trim()) {
                    updates.name = emp.name.trim();
                    changes.push(`name trimmed`);
                }
                if (Object.keys(updates).length > 0) {
                    await prisma.employee.update({
                        where: { id: emp.id },
                        data: updates,
                    });
                    results.employees++;
                    details.push({ type: "karyawan", id: emp.id, changes: changes.join(", ") });
                }
            }

            // Standardize Categories
            const categories = await prisma.category.findMany();
            for (const cat of categories) {
                if (cat.name !== cat.name.trim()) {
                    await prisma.category.update({
                        where: { id: cat.id },
                        data: { name: cat.name.trim() },
                    });
                    results.categories++;
                    details.push({ type: "kategori", id: cat.id, changes: "name trimmed" });
                }
            }

            const totalUpdated = results.spareparts + results.equipments + results.employees + results.categories;

            // Log cleanup
            if (totalUpdated > 0) {
                await prisma.cleanupLog.create({
                    data: {
                        action: "standardize",
                        type: null,
                        description: `Standardisasi data: ${totalUpdated} record diupdate`,
                        affectedCount: totalUpdated,
                        details: { results, items: details.slice(0, 50) } as unknown as Prisma.InputJsonValue,
                    },
                });
            }

            return NextResponse.json({
                message: "Standardisasi selesai",
                results,
                totalUpdated,
            });
        }

        return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
    } catch (error) {
        console.error("Error processing cleanup:", error);
        return NextResponse.json(
            { error: "Gagal memproses cleanup" },
            { status: 500 }
        );
    }
}
