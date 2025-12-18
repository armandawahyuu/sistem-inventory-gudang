/**
 * Data Masking Library
 * Protect sensitive data when displaying to users
 */

// ============================================
// MASK FUNCTIONS
// ============================================

/**
 * Mask NIK (show first 3 and last 4 digits)
 * Example: 3201234567890123 -> 320*********0123
 * @param nik NIK string
 * @returns Masked NIK
 */
export function maskNik(nik: string | null | undefined): string {
    if (!nik || nik.length < 8) return nik || "";
    const first = nik.slice(0, 3);
    const last = nik.slice(-4);
    const middle = "*".repeat(nik.length - 7);
    return `${first}${middle}${last}`;
}

/**
 * Mask phone number (show first 4 and last 4 digits)
 * Example: 081234567890 -> 0812****7890
 * @param phone Phone number
 * @returns Masked phone
 */
export function maskPhone(phone: string | null | undefined): string {
    if (!phone || phone.length < 8) return phone || "";
    const first = phone.slice(0, 4);
    const last = phone.slice(-4);
    const middle = "*".repeat(phone.length - 8);
    return `${first}${middle}${last}`;
}

/**
 * Mask email (show first letter, ***, and domain)
 * Example: wahyu@gmail.com -> w***@gmail.com
 * @param email Email address
 * @returns Masked email
 */
export function maskEmail(email: string | null | undefined): string {
    if (!email || !email.includes("@")) return email || "";
    const [local, domain] = email.split("@");
    if (local.length <= 1) return email;
    return `${local[0]}***@${domain}`;
}

/**
 * Mask name (show first name and initial of last name)
 * Example: Wahyu Santoso -> Wahyu S.
 * @param name Full name
 * @returns Masked name
 */
export function maskName(name: string | null | undefined): string {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length <= 1) return name;
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1][0];
    return `${firstName} ${lastInitial}.`;
}

/**
 * Mask address (show only city/kabupaten)
 * Example: Jl. Merdeka No. 123, Bandung -> ******, Bandung
 * @param address Full address
 * @returns Masked address
 */
export function maskAddress(address: string | null | undefined): string {
    if (!address) return "";
    const parts = address.split(",");
    if (parts.length > 1) {
        const lastPart = parts[parts.length - 1].trim();
        return `******, ${lastPart}`;
    }
    return "******";
}

/**
 * Mask credit card / account number (show last 4 digits)
 * Example: 1234567890123456 -> ************3456
 * @param number Account number
 * @returns Masked number
 */
export function maskAccountNumber(number: string | null | undefined): string {
    if (!number || number.length < 4) return number || "";
    const last = number.slice(-4);
    const masked = "*".repeat(number.length - 4);
    return `${masked}${last}`;
}

// ============================================
// MASK OBJECT HELPER
// ============================================

interface MaskConfig {
    field: string;
    maskFn: (value: string | null | undefined) => string;
}

const DEFAULT_MASK_CONFIG: MaskConfig[] = [
    { field: "nik", maskFn: maskNik },
    { field: "phone", maskFn: maskPhone },
    { field: "email", maskFn: maskEmail },
    { field: "address", maskFn: maskAddress },
];

/**
 * Mask sensitive fields in an object
 * @param data Object containing sensitive data
 * @param config Optional custom mask configuration
 * @returns Object with masked sensitive fields
 */
export function maskSensitiveData<T extends Record<string, unknown>>(
    data: T,
    config: MaskConfig[] = DEFAULT_MASK_CONFIG
): T {
    const result = { ...data };
    for (const { field, maskFn } of config) {
        if (field in result && typeof result[field] === "string") {
            (result as Record<string, unknown>)[field] = maskFn(result[field] as string);
        }
    }
    return result;
}

/**
 * Mask array of objects
 * @param dataArray Array of objects
 * @param config Optional custom mask configuration
 * @returns Array with masked objects
 */
export function maskArrayData<T extends Record<string, unknown>>(
    dataArray: T[],
    config: MaskConfig[] = DEFAULT_MASK_CONFIG
): T[] {
    return dataArray.map((item) => maskSensitiveData(item, config));
}

// ============================================
// PERMISSION-BASED MASKING
// ============================================

/**
 * Check if user has permission to view unmasked data
 * @param userRole User's role
 * @returns True if user can view full data
 */
export function canViewFullData(userRole: string): boolean {
    // Only admin can view full unmasked data
    return userRole === "admin";
}

/**
 * Conditionally mask data based on user role
 * @param data Data to potentially mask
 * @param userRole User's role
 * @returns Masked or original data based on permission
 */
export function conditionalMask<T extends Record<string, unknown>>(
    data: T,
    userRole: string
): T {
    if (canViewFullData(userRole)) {
        return data;
    }
    return maskSensitiveData(data);
}

/**
 * Conditionally mask array based on user role
 */
export function conditionalMaskArray<T extends Record<string, unknown>>(
    dataArray: T[],
    userRole: string
): T[] {
    if (canViewFullData(userRole)) {
        return dataArray;
    }
    return maskArrayData(dataArray);
}
