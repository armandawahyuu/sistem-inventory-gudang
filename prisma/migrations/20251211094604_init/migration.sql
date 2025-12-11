-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'supervisor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeavyEquipment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "site" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeavyEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sparepart" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "brand" TEXT,
    "unit" TEXT NOT NULL,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "rackLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sparepart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentCompatibility" (
    "id" TEXT NOT NULL,
    "sparepartId" TEXT NOT NULL,
    "equipmentType" TEXT NOT NULL,
    "equipmentBrand" TEXT,
    "equipmentModel" TEXT,

    CONSTRAINT "EquipmentCompatibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "clockIn" TIMESTAMP(3),
    "clockOut" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'present',
    "overtimeHours" DOUBLE PRECISION DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockIn" (
    "id" TEXT NOT NULL,
    "sparepartId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "supplierId" TEXT,
    "invoiceNumber" TEXT,
    "purchasePrice" DOUBLE PRECISION,
    "warrantyExpiry" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockOut" (
    "id" TEXT NOT NULL,
    "sparepartId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedReason" TEXT,
    "scannedBarcode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockOut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PettyCashCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PettyCashCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PettyCash" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" TEXT NOT NULL,
    "categoryId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "receipt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PettyCash_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warranty" (
    "id" TEXT NOT NULL,
    "stockInId" TEXT NOT NULL,
    "sparepartId" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "claimStatus" TEXT NOT NULL DEFAULT 'active',
    "claimDate" TIMESTAMP(3),
    "claimNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Warranty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "HeavyEquipment_code_key" ON "HeavyEquipment"("code");

-- CreateIndex
CREATE INDEX "HeavyEquipment_type_idx" ON "HeavyEquipment"("type");

-- CreateIndex
CREATE INDEX "HeavyEquipment_site_idx" ON "HeavyEquipment"("site");

-- CreateIndex
CREATE INDEX "HeavyEquipment_status_idx" ON "HeavyEquipment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Sparepart_code_key" ON "Sparepart"("code");

-- CreateIndex
CREATE INDEX "Sparepart_name_idx" ON "Sparepart"("name");

-- CreateIndex
CREATE INDEX "Sparepart_categoryId_idx" ON "Sparepart"("categoryId");

-- CreateIndex
CREATE INDEX "Sparepart_code_idx" ON "Sparepart"("code");

-- CreateIndex
CREATE INDEX "EquipmentCompatibility_sparepartId_idx" ON "EquipmentCompatibility"("sparepartId");

-- CreateIndex
CREATE INDEX "EquipmentCompatibility_equipmentType_idx" ON "EquipmentCompatibility"("equipmentType");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_nik_key" ON "Employee"("nik");

-- CreateIndex
CREATE INDEX "Employee_name_idx" ON "Employee"("name");

-- CreateIndex
CREATE INDEX "Employee_position_idx" ON "Employee"("position");

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE INDEX "Attendance_status_idx" ON "Attendance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_employeeId_date_key" ON "Attendance"("employeeId", "date");

-- CreateIndex
CREATE INDEX "StockIn_sparepartId_idx" ON "StockIn"("sparepartId");

-- CreateIndex
CREATE INDEX "StockIn_supplierId_idx" ON "StockIn"("supplierId");

-- CreateIndex
CREATE INDEX "StockIn_createdAt_idx" ON "StockIn"("createdAt");

-- CreateIndex
CREATE INDEX "StockOut_sparepartId_idx" ON "StockOut"("sparepartId");

-- CreateIndex
CREATE INDEX "StockOut_equipmentId_idx" ON "StockOut"("equipmentId");

-- CreateIndex
CREATE INDEX "StockOut_employeeId_idx" ON "StockOut"("employeeId");

-- CreateIndex
CREATE INDEX "StockOut_status_idx" ON "StockOut"("status");

-- CreateIndex
CREATE INDEX "StockOut_createdAt_idx" ON "StockOut"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PettyCashCategory_name_key" ON "PettyCashCategory"("name");

-- CreateIndex
CREATE INDEX "PettyCash_date_idx" ON "PettyCash"("date");

-- CreateIndex
CREATE INDEX "PettyCash_type_idx" ON "PettyCash"("type");

-- CreateIndex
CREATE INDEX "PettyCash_categoryId_idx" ON "PettyCash"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Warranty_stockInId_key" ON "Warranty"("stockInId");

-- CreateIndex
CREATE INDEX "Warranty_expiryDate_idx" ON "Warranty"("expiryDate");

-- CreateIndex
CREATE INDEX "Warranty_claimStatus_idx" ON "Warranty"("claimStatus");

-- CreateIndex
CREATE INDEX "Warranty_sparepartId_idx" ON "Warranty"("sparepartId");

-- AddForeignKey
ALTER TABLE "Sparepart" ADD CONSTRAINT "Sparepart_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentCompatibility" ADD CONSTRAINT "EquipmentCompatibility_sparepartId_fkey" FOREIGN KEY ("sparepartId") REFERENCES "Sparepart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockIn" ADD CONSTRAINT "StockIn_sparepartId_fkey" FOREIGN KEY ("sparepartId") REFERENCES "Sparepart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockIn" ADD CONSTRAINT "StockIn_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOut" ADD CONSTRAINT "StockOut_sparepartId_fkey" FOREIGN KEY ("sparepartId") REFERENCES "Sparepart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOut" ADD CONSTRAINT "StockOut_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "HeavyEquipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOut" ADD CONSTRAINT "StockOut_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PettyCash" ADD CONSTRAINT "PettyCash_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PettyCashCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warranty" ADD CONSTRAINT "Warranty_stockInId_fkey" FOREIGN KEY ("stockInId") REFERENCES "StockIn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warranty" ADD CONSTRAINT "Warranty_sparepartId_fkey" FOREIGN KEY ("sparepartId") REFERENCES "Sparepart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
