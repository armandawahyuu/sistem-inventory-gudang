/**
 * Encryption Library
 * AES-256 encryption for sensitive data protection
 */

import CryptoJS from "crypto-js";

// ============================================
// CONFIGURATION
// ============================================

// Get encryption key from environment variable
// IMPORTANT: Set ENCRYPTION_KEY in .env (32 chars for AES-256)
function getEncryptionKey(): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        console.warn("[Security] ENCRYPTION_KEY not set, using fallback (NOT SECURE FOR PRODUCTION)");
        return "DEFAULT_INSECURE_KEY_CHANGE_ME!";
    }
    return key;
}

// ============================================
// ENCRYPTION FUNCTIONS
// ============================================

/**
 * Encrypt sensitive data using AES-256
 * @param data Data to encrypt
 * @returns Encrypted string (Base64)
 */
export function encryptData(data: string): string {
    if (!data) return "";
    const key = getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(data, key);
    return encrypted.toString();
}

/**
 * Decrypt data encrypted with encryptData
 * @param encryptedData Encrypted string (Base64)
 * @returns Decrypted original data
 */
export function decryptData(encryptedData: string): string {
    if (!encryptedData) return "";
    try {
        const key = getEncryptionKey();
        const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error("[Encryption] Decryption failed:", error);
        return "";
    }
}

/**
 * Encrypt object fields that are sensitive
 * @param data Object with sensitive fields
 * @param sensitiveFields Array of field names to encrypt
 * @returns Object with encrypted sensitive fields
 */
export function encryptSensitiveFields<T extends Record<string, unknown>>(
    data: T,
    sensitiveFields: string[]
): T {
    const result = { ...data };
    for (const field of sensitiveFields) {
        if (field in result && typeof result[field] === "string") {
            (result as Record<string, unknown>)[field] = encryptData(result[field] as string);
        }
    }
    return result;
}

/**
 * Decrypt object fields that were encrypted
 * @param data Object with encrypted fields
 * @param encryptedFields Array of field names to decrypt
 * @returns Object with decrypted fields
 */
export function decryptSensitiveFields<T extends Record<string, unknown>>(
    data: T,
    encryptedFields: string[]
): T {
    const result = { ...data };
    for (const field of encryptedFields) {
        if (field in result && typeof result[field] === "string") {
            (result as Record<string, unknown>)[field] = decryptData(result[field] as string);
        }
    }
    return result;
}

// ============================================
// HASHING (One-way)
// ============================================

/**
 * Hash data using SHA-256 (one-way, for comparison)
 * @param data Data to hash
 * @returns SHA-256 hash
 */
export function hashData(data: string): string {
    return CryptoJS.SHA256(data).toString();
}

/**
 * Hash data with salt using PBKDF2
 * @param data Data to hash
 * @param salt Salt value
 * @returns PBKDF2 hash
 */
export function hashWithSalt(data: string, salt: string): string {
    const key = CryptoJS.PBKDF2(data, salt, {
        keySize: 256 / 32,
        iterations: 10000,
    });
    return key.toString();
}

/**
 * Generate random salt
 * @returns Random 16-byte salt as hex string
 */
export function generateSalt(): string {
    return CryptoJS.lib.WordArray.random(16).toString();
}

// ============================================
// FILE ENCRYPTION
// ============================================

/**
 * Encrypt file content for backup
 * @param content File content as string
 * @returns Encrypted content
 */
export function encryptFileContent(content: string): string {
    const key = getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(content, key);
    return encrypted.toString();
}

/**
 * Decrypt file content
 * @param encryptedContent Encrypted content
 * @returns Decrypted content
 */
export function decryptFileContent(encryptedContent: string): string {
    try {
        const key = getEncryptionKey();
        const decrypted = CryptoJS.AES.decrypt(encryptedContent, key);
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error("[Encryption] File decryption failed:", error);
        return "";
    }
}

// ============================================
// SENSITIVE DATA FIELDS
// ============================================

/**
 * List of fields considered sensitive and should be encrypted
 */
export const SENSITIVE_FIELDS = {
    employee: ["address"], // NIK is indexed, so we mask instead of encrypt
    user: [],
    supplier: ["address"],
    pettyCash: [],
};
