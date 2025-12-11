import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL || "";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper function to generate random number
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to pick random item from array
function randomPick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
    console.log("🌱 Starting database seeding...");

    // ========== 1. USER ADMIN ==========
    console.log("Creating admin user...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.upsert({
        where: { username: "admin" },
        update: {},
        create: {
            username: "admin",
            password: hashedPassword,
            name: "Administrator",
            role: "admin",
        },
    });

    // ========== 2. KATEGORI SPAREPART ==========
    console.log("Creating sparepart categories...");
    const categoryNames = [
        "Filter",
        "Oli & Pelumas",
        "Bearing",
        "Seal & Gasket",
        "Hydraulic",
        "Electrical",
        "Engine Parts",
        "Transmission",
        "Undercarriage",
        "Cabin Parts",
    ];

    const categories = [];
    for (const name of categoryNames) {
        const cat = await prisma.category.upsert({
            where: { name },
            update: {},
            create: { name },
        });
        categories.push(cat);
    }

    // ========== 3. SUPPLIER ==========
    console.log("Creating suppliers...");
    const supplierData = [
        { name: "PT. Sparepart Jaya", address: "Jl. Industri No. 1, Jakarta", phone: "021-1234567" },
        { name: "CV. Alat Berat Indonesia", address: "Jl. Workshop No. 25, Surabaya", phone: "031-7654321" },
        { name: "UD. Mesin Mandiri", address: "Jl. Mekanik No. 10, Bandung", phone: "022-9876543" },
        { name: "PT. Hydraulic System", address: "Jl. Teknik No. 5, Semarang", phone: "024-1112233" },
        { name: "CV. Diesel Parts", address: "Jl. Otomotif No. 88, Medan", phone: "061-4455667" },
    ];

    const suppliers = [];
    for (let i = 0; i < supplierData.length; i++) {
        const data = supplierData[i];
        const existing = await prisma.supplier.findFirst({ where: { name: data.name } });
        let supplier;
        if (existing) {
            supplier = existing;
        } else {
            supplier = await prisma.supplier.create({ data });
        }
        suppliers.push(supplier);
    }

    // ========== 4. ALAT BERAT ==========
    console.log("Creating heavy equipments...");
    const equipmentTypes = ["Excavator", "Bulldozer", "Wheel Loader", "Motor Grader", "Dump Truck", "Crane", "Forklift", "Compactor"];
    const brands = ["Caterpillar", "Komatsu", "Hitachi", "Volvo", "Kobelco", "JCB", "Hyundai", "Doosan"];
    const statuses = ["active", "active", "active", "maintenance", "inactive"];

    const equipments = [];
    for (let i = 1; i <= 50; i++) {
        const type = randomPick(equipmentTypes);
        const brand = randomPick(brands);
        const code = `AB-${String(i).padStart(3, "0")}`;

        const equipment = await prisma.heavyEquipment.upsert({
            where: { code },
            update: {},
            create: {
                code,
                name: `${type} ${brand} ${i}`,
                brand,
                model: `Model-${randomInt(100, 999)}`,
                type,
                year: randomInt(2015, 2024),
                status: randomPick(statuses),
            },
        });
        equipments.push(equipment);
    }

    // ========== 5. SPAREPART ==========
    console.log("Creating spareparts...");
    const sparepartNames = [
        "Oil Filter", "Air Filter", "Fuel Filter", "Hydraulic Filter",
        "Engine Oil", "Hydraulic Oil", "Gear Oil", "Grease",
        "Ball Bearing", "Roller Bearing", "Thrust Bearing",
        "O-Ring", "Oil Seal", "Dust Seal", "Gasket Set",
        "Hydraulic Pump", "Hydraulic Cylinder", "Hydraulic Hose",
        "Starter Motor", "Alternator", "Battery", "Relay", "Fuse",
        "Piston", "Piston Ring", "Connecting Rod", "Crankshaft",
        "Gearbox", "Clutch Plate", "Torque Converter",
        "Track Shoe", "Track Link", "Sprocket", "Idler", "Roller",
        "Cabin Filter", "Wiper Blade", "Mirror", "Seat Cushion",
        "Turbocharger", "Injector", "Water Pump", "Thermostat",
        "V-Belt", "Fan Belt", "Timing Belt",
        "Brake Pad", "Brake Disc", "Brake Shoe",
        "Radiator", "Radiator Hose", "Coolant",
    ];

    const units = ["pcs", "liter", "set", "meter", "kg", "box"];

    const spareparts = [];
    for (let i = 1; i <= 100; i++) {
        const name = randomPick(sparepartNames);
        const category = randomPick(categories);
        const code = `SP-${String(i).padStart(4, "0")}`;
        const minStock = randomInt(5, 20);
        const currentStock = randomInt(0, 50);

        const existing = await prisma.sparepart.findUnique({ where: { code } });
        let sparepart;
        if (existing) {
            sparepart = existing;
        } else {
            sparepart = await prisma.sparepart.create({
                data: {
                    code,
                    name: `${name} ${i}`,
                    categoryId: category.id,
                    unit: randomPick(units),
                    minStock,
                    currentStock,
                    rackLocation: `Rak ${String.fromCharCode(65 + randomInt(0, 5))}-${randomInt(1, 10)}`,
                },
            });
        }
        (sparepart as any).price = randomInt(50000, 5000000);
        spareparts.push(sparepart);
    }

    // ========== 6. KARYAWAN ==========
    console.log("Creating employees...");
    const positions = ["Operator", "Mekanik", "Supervisor", "Kepala Gudang", "Admin"];
    const departments = ["Operasional", "Maintenance", "Gudang", "Administrasi"];
    const firstNames = ["Budi", "Andi", "Cahyo", "Dedi", "Eko", "Faisal", "Gilang", "Hendra", "Irfan", "Joko"];
    const lastNames = ["Santoso", "Wijaya", "Pratama", "Saputra", "Kusuma", "Nugroho", "Permana", "Hidayat", "Rahman", "Setiawan"];

    const employees = [];
    for (let i = 1; i <= 20; i++) {
        const nik = `EMP${String(i).padStart(3, "0")}`;
        const firstName = randomPick(firstNames);
        const lastName = randomPick(lastNames);

        const employee = await prisma.employee.upsert({
            where: { nik },
            update: {},
            create: {
                nik,
                name: `${firstName} ${lastName}`,
                position: randomPick(positions),
                department: randomPick(departments),
                phone: `08${randomInt(1000000000, 9999999999)}`,
                isActive: true,
            },
        });
        employees.push(employee);
    }

    // ========== 7. KATEGORI KAS KECIL ==========
    console.log("Creating petty cash categories...");
    const pettyCashCategoryNames = ["BBM", "Makan", "ATK", "Transport", "Lain-lain"];

    for (const name of pettyCashCategoryNames) {
        await prisma.pettyCashCategory.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }

    // ========== 8. SAMPLE TRANSACTIONS ==========
    console.log("Creating sample transactions...");

    // Stock In Transactions
    for (let i = 0; i < 30; i++) {
        const sparepart = randomPick(spareparts);
        const supplier = randomPick(suppliers);
        const quantity = randomInt(5, 20);
        const date = new Date();
        date.setDate(date.getDate() - randomInt(1, 60));

        const stockIn = await prisma.stockIn.create({
            data: {
                sparepartId: sparepart.id,
                supplierId: supplier.id,
                quantity,
                purchasePrice: (sparepart as any).price || randomInt(50000, 500000),
                notes: `Pembelian rutin`,
            },
        });

        // Update stock
        await prisma.sparepart.update({
            where: { id: sparepart.id },
            data: { currentStock: { increment: quantity } },
        });

        // Create warranty for some items
        if (randomInt(1, 3) === 1) {
            const expiryDate = new Date(date);
            expiryDate.setMonth(expiryDate.getMonth() + randomInt(6, 24));

            await prisma.warranty.create({
                data: {
                    stockInId: stockIn.id,
                    sparepartId: sparepart.id,
                    expiryDate,
                },
            });
        }
    }

    // Stock Out Transactions
    for (let i = 0; i < 20; i++) {
        const sparepart = randomPick(spareparts);
        const employee = randomPick(employees);
        const equipment = randomPick(equipments);
        const quantity = randomInt(1, 5);
        const date = new Date();
        date.setDate(date.getDate() - randomInt(1, 30));
        const statuses: ("pending" | "approved" | "rejected")[] = ["pending", "approved", "approved", "approved", "rejected"];
        const status = randomPick(statuses);

        await prisma.stockOut.create({
            data: {
                sparepartId: sparepart.id,
                employeeId: employee.id,
                equipmentId: equipment.id,
                quantity,
                purpose: randomPick(["Perbaikan rutin", "Penggantian komponen rusak", "Service berkala", "Overhaul"]),
                status,
                approvedAt: status === "approved" ? date : null,
                rejectedReason: status === "rejected" ? "Stok tidak mencukupi" : null,
            },
        });

        // Update stock if approved
        if (status === "approved") {
            await prisma.sparepart.update({
                where: { id: sparepart.id },
                data: { currentStock: { decrement: Math.min(quantity, sparepart.currentStock) } },
            });
        }
    }

    // Petty Cash Transactions
    const pcCategories = await prisma.pettyCashCategory.findMany();

    // Income
    for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - randomInt(1, 30));

        await prisma.pettyCash.create({
            data: {
                date,
                type: "in",
                amount: randomInt(500000, 5000000),
                description: `Pengisian kas kecil #${i + 1}`,
            },
        });
    }

    // Expenses
    for (let i = 0; i < 15; i++) {
        const date = new Date();
        date.setDate(date.getDate() - randomInt(1, 30));
        const category = randomPick(pcCategories);

        await prisma.pettyCash.create({
            data: {
                date,
                type: "out",
                categoryId: category.id,
                amount: randomInt(50000, 500000),
                description: `Pengeluaran ${category.name.toLowerCase()} #${i + 1}`,
            },
        });
    }

    // Attendance Records
    console.log("Creating attendance records...");
    for (let i = 0; i < 50; i++) {
        const employee = randomPick(employees);
        const date = new Date();
        date.setDate(date.getDate() - randomInt(1, 30));
        date.setHours(0, 0, 0, 0);

        // Check if attendance already exists
        const existing = await prisma.attendance.findUnique({
            where: {
                employeeId_date: {
                    employeeId: employee.id,
                    date,
                },
            },
        });

        if (!existing) {
            const clockInHour = randomInt(7, 9);
            const clockInMinute = randomInt(0, 59);
            const clockIn = new Date(date);
            clockIn.setHours(clockInHour, clockInMinute, 0, 0);

            const clockOut = new Date(date);
            clockOut.setHours(randomInt(16, 18), randomInt(0, 59), 0, 0);

            let status = "present";
            if (clockInHour > 8 || (clockInHour === 8 && clockInMinute > 0)) {
                status = "late";
            }

            await prisma.attendance.create({
                data: {
                    employeeId: employee.id,
                    date,
                    clockIn,
                    clockOut,
                    status,
                    overtimeHours: randomInt(0, 3),
                },
            });
        }
    }

    console.log("✅ Database seeding completed!");
}

main()
    .catch((e) => {
        console.error("❌ Seeding error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
