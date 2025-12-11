export const APP_NAME = "Sistem Inventory Gudang";
export const APP_DESCRIPTION = "Sistem Inventory Gudang Sparepart Alat Berat";

export const ROLES = {
    ADMIN: "ADMIN",
    MANAGER: "MANAGER",
    STAFF: "STAFF",
} as const;

export const STATUS_ALAT_BERAT = {
    AKTIF: "Aktif",
    RUSAK: "Rusak",
    MAINTENANCE: "Maintenance",
    TIDAK_AKTIF: "Tidak Aktif",
} as const;

export const STATUS_APPROVAL = {
    PENDING: "Menunggu",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
} as const;

export const STATUS_ABSENSI = {
    HADIR: "Hadir",
    IZIN: "Izin",
    SAKIT: "Sakit",
    CUTI: "Cuti",
    ALPHA: "Alpha",
} as const;

export const TIPE_KAS_KECIL = {
    PEMASUKAN: "Pemasukan",
    PENGELUARAN: "Pengeluaran",
} as const;

export const SATUAN_OPTIONS = [
    "PCS",
    "SET",
    "UNIT",
    "LITER",
    "KG",
    "METER",
    "ROLL",
    "BOX",
    "PACK",
] as const;
