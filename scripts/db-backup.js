#!/usr/bin/env node

/**
 * Database Backup Script
 * Automated backup with encryption support
 * 
 * Usage: node scripts/db-backup.js
 * 
 * Requirements:
 * - pg_dump must be installed (PostgreSQL client tools)
 * - DATABASE_URL must be set in .env
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');
const ENCRYPT_BACKUPS = process.env.ENCRYPT_BACKUPS === 'true';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
};

// Parse DATABASE_URL - supports multiple formats
function parseDatabaseUrl(url) {
    if (!url) throw new Error('DATABASE_URL not provided');

    try {
        // Handle both postgresql:// and postgres://
        const normalizedUrl = url.replace(/^postgres:\/\//, 'postgresql://');

        // Try URL parsing first
        const urlObj = new URL(normalizedUrl);

        return {
            user: decodeURIComponent(urlObj.username || 'postgres'),
            password: decodeURIComponent(urlObj.password || ''),
            host: urlObj.hostname || 'localhost',
            port: urlObj.port || '5432',
            database: urlObj.pathname.replace(/^\//, '').split('?')[0] || 'postgres',
        };
    } catch (e) {
        // Fallback regex for edge cases (including no password)
        const regex = /^(?:postgresql|postgres):\/\/(?:([^:@]+)(?::([^@]*))?@)?([^:\/]+)(?::(\d+))?\/([^?]+)/;
        const match = url.match(regex);

        if (!match) {
            throw new Error('Invalid DATABASE_URL format');
        }

        return {
            user: match[1] || 'postgres',
            password: match[2] || '',
            host: match[3] || 'localhost',
            port: match[4] || '5432',
            database: match[5] || 'postgres',
        };
    }
}

// Create backup directory if not exists
function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        log.info(`Created backup directory: ${BACKUP_DIR}`);
    }
}

// Generate backup filename
function getBackupFilename() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `backup_${timestamp}.sql`;
}

// Encrypt file using AES-256
function encryptFile(inputPath, outputPath, key) {
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const keyBuffer = crypto.scryptSync(key, 'salt', 32);

    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
    const input = fs.readFileSync(inputPath);
    const encrypted = Buffer.concat([iv, cipher.update(input), cipher.final()]);

    fs.writeFileSync(outputPath, encrypted);
    fs.unlinkSync(inputPath); // Remove unencrypted file
}

// Decrypt file
function decryptFile(inputPath, outputPath, key) {
    const algorithm = 'aes-256-cbc';
    const keyBuffer = crypto.scryptSync(key, 'salt', 32);

    const encrypted = fs.readFileSync(inputPath);
    const iv = encrypted.slice(0, 16);
    const encryptedData = encrypted.slice(16);

    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    fs.writeFileSync(outputPath, decrypted);
}

// Perform backup
async function performBackup() {
    log.info('Starting database backup...');

    // Check DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        log.error('DATABASE_URL not set in environment');
        process.exit(1);
    }

    const db = parseDatabaseUrl(databaseUrl);
    ensureBackupDir();

    const filename = getBackupFilename();
    const backupPath = path.join(BACKUP_DIR, filename);

    try {
        // Set PGPASSWORD for pg_dump
        process.env.PGPASSWORD = db.password;

        // Run pg_dump
        const command = `pg_dump -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} -F p -f "${backupPath}"`;

        log.info(`Backing up database: ${db.database}`);
        execSync(command, { stdio: 'pipe' });

        // Get file size
        const stats = fs.statSync(backupPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

        log.success(`Backup created: ${filename} (${sizeMB} MB)`);

        // Encrypt if enabled
        if (ENCRYPT_BACKUPS && ENCRYPTION_KEY) {
            const encryptedPath = backupPath + '.enc';
            log.info('Encrypting backup...');
            encryptFile(backupPath, encryptedPath, ENCRYPTION_KEY);
            log.success(`Encrypted backup: ${filename}.enc`);
        }

        return backupPath;

    } catch (error) {
        log.error(`Backup failed: ${error.message}`);

        // Cleanup failed backup
        if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
        }

        process.exit(1);
    } finally {
        delete process.env.PGPASSWORD;
    }
}

// Cleanup old backups
function cleanupOldBackups() {
    log.info(`Cleaning up backups older than ${RETENTION_DAYS} days...`);

    const files = fs.readdirSync(BACKUP_DIR);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    let deletedCount = 0;

    for (const file of files) {
        if (!file.startsWith('backup_')) continue;

        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            deletedCount++;
        }
    }

    if (deletedCount > 0) {
        log.success(`Deleted ${deletedCount} old backup(s)`);
    } else {
        log.info('No old backups to delete');
    }
}

// List existing backups
function listBackups() {
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('backup_'))
        .sort()
        .reverse();

    console.log('\nExisting backups:');
    console.log('─'.repeat(60));

    if (files.length === 0) {
        console.log('No backups found');
        return;
    }

    for (const file of files.slice(0, 10)) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        const date = stats.mtime.toISOString().slice(0, 19).replace('T', ' ');
        console.log(`  ${file} - ${sizeMB} MB - ${date}`);
    }

    if (files.length > 10) {
        console.log(`  ... and ${files.length - 10} more`);
    }

    console.log('');
}

// Main
async function main() {
    console.log(`\n${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║       DATABASE BACKUP SCRIPT           ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

    // Load .env
    try {
        require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    } catch {
        // dotenv might not be installed globally
    }

    const action = process.argv[2] || 'backup';

    switch (action) {
        case 'backup':
            await performBackup();
            cleanupOldBackups();
            listBackups();
            break;

        case 'list':
            ensureBackupDir();
            listBackups();
            break;

        case 'cleanup':
            ensureBackupDir();
            cleanupOldBackups();
            break;

        default:
            console.log('Usage: node scripts/db-backup.js [backup|list|cleanup]');
    }
}

main().catch(console.error);
