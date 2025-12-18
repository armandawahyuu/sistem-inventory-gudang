#!/usr/bin/env node

/**
 * Database Health Check Script
 * Check database connectivity, performance, and security
 * 
 * Usage: node scripts/db-health-check.js
 */

const { execSync } = require('child_process');
const path = require('path');

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
    title: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}`),
};

let errors = 0;
let warnings = 0;

// Parse DATABASE_URL - supports multiple formats
function parseDatabaseUrl(url) {
    if (!url) return null;

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
        // Fallback regex for edge cases
        const regex = /^(?:postgresql|postgres):\/\/(?:([^:@]+)(?::([^@]*))?@)?([^:\/]+)(?::(\d+))?\/([^?]+)/;
        const match = url.match(regex);

        if (!match) {
            return null;
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

// ============================================
// CHECK 1: Database Connection
// ============================================
async function checkConnection() {
    log.title('Database Connection');

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        log.error('DATABASE_URL not set');
        errors++;
        return false;
    }

    const db = parseDatabaseUrl(databaseUrl);
    if (!db) {
        log.error('Invalid DATABASE_URL format');
        errors++;
        return false;
    }

    log.info(`Host: ${db.host}:${db.port}`);
    log.info(`Database: ${db.database}`);
    log.info(`User: ${db.user}`);

    // Check if host is localhost/internal
    const isLocal = ['localhost', '127.0.0.1', '::1'].includes(db.host) ||
        db.host.startsWith('10.') ||
        db.host.startsWith('192.168.') ||
        db.host.startsWith('172.');

    if (isLocal) {
        log.success('Database is on private network (not exposed to internet)');
    } else {
        log.warn('Database may be exposed to public internet');
        warnings++;
    }

    // Check SSL
    if (databaseUrl.includes('sslmode=require') || databaseUrl.includes('ssl=true')) {
        log.success('SSL connection enabled');
    } else if (!isLocal) {
        log.warn('SSL not explicitly enabled for remote database');
        warnings++;
    }

    // Test connection using Prisma
    try {
        const result = execSync('npx prisma db execute --stdin <<< "SELECT 1"', {
            cwd: path.join(__dirname, '..'),
            encoding: 'utf-8',
            stdio: 'pipe',
            timeout: 10000,
        });
        log.success('Database connection successful');
        return true;
    } catch (error) {
        // Try alternative method
        try {
            execSync('npx prisma db pull --force', {
                cwd: path.join(__dirname, '..'),
                encoding: 'utf-8',
                stdio: 'pipe',
                timeout: 30000,
            });
            log.success('Database connection successful');
            return true;
        } catch {
            log.error('Database connection failed');
            errors++;
            return false;
        }
    }
}

// ============================================
// CHECK 2: Database User Permissions
// ============================================
function checkUserPermissions() {
    log.title('User Permissions');

    const databaseUrl = process.env.DATABASE_URL;
    const db = parseDatabaseUrl(databaseUrl);

    if (!db) return;

    // Check if using default/root user
    const dangerousUsers = ['postgres', 'root', 'admin', 'sa'];

    if (dangerousUsers.includes(db.user.toLowerCase())) {
        log.warn(`Using ${db.user} user - consider creating a dedicated app user`);
        warnings++;
    } else {
        log.success(`Using dedicated user: ${db.user}`);
    }

    // Check password strength (basic check)
    if (db.password.length < 12) {
        log.warn('Database password is short (recommend 12+ characters)');
        warnings++;
    } else {
        log.success('Database password length is adequate');
    }

    // Check for common weak passwords
    const weakPasswords = ['password', '123456', 'admin', 'postgres', 'root'];
    if (weakPasswords.includes(db.password.toLowerCase())) {
        log.error('Database password is too weak!');
        errors++;
    }
}

// ============================================
// CHECK 3: Schema Integrity
// ============================================
async function checkSchemaIntegrity() {
    log.title('Schema Integrity');

    try {
        // Run prisma validate
        execSync('npx prisma validate', {
            cwd: path.join(__dirname, '..'),
            encoding: 'utf-8',
            stdio: 'pipe',
        });
        log.success('Prisma schema is valid');

        // Check for pending migrations
        try {
            const result = execSync('npx prisma migrate status', {
                cwd: path.join(__dirname, '..'),
                encoding: 'utf-8',
                stdio: 'pipe',
            });

            if (result.includes('Database schema is up to date')) {
                log.success('Database schema is up to date');
            } else if (result.includes('pending')) {
                log.warn('There are pending migrations');
                warnings++;
            }
        } catch (error) {
            // migrate status might fail if using db push
            log.info('Using db push strategy (no migrations)');
        }

    } catch (error) {
        log.error('Prisma schema validation failed');
        errors++;
    }
}

// ============================================
// CHECK 4: Table Statistics
// ============================================
async function checkTableStats() {
    log.title('Table Statistics');

    // Read schema to get model names
    const fs = require('fs');
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

    if (!fs.existsSync(schemaPath)) {
        log.warn('schema.prisma not found');
        return;
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    const modelMatches = schema.match(/^model\s+(\w+)\s*{/gm);

    if (modelMatches) {
        const modelCount = modelMatches.length;
        log.info(`Total models in schema: ${modelCount}`);

        // Check for indexes
        const indexMatches = schema.match(/@@index/g);
        const indexCount = indexMatches ? indexMatches.length : 0;
        log.info(`Total indexes defined: ${indexCount}`);

        if (indexCount < modelCount) {
            log.info('Consider adding more indexes for frequently queried fields');
        }

        // Check for onDelete behavior
        const relationsWithOnDelete = (schema.match(/onDelete:\s*\w+/g) || []).length;
        const totalRelations = (schema.match(/@relation/g) || []).length;

        if (relationsWithOnDelete < totalRelations * 0.5) {
            log.warn('Many relations missing onDelete behavior');
            warnings++;
        } else {
            log.success('Relations have proper onDelete behavior');
        }
    }
}

// ============================================
// CHECK 5: Connection Pool Settings
// ============================================
function checkConnectionPool() {
    log.title('Connection Pool');

    const databaseUrl = process.env.DATABASE_URL || '';

    // Check for connection pool params
    if (databaseUrl.includes('connection_limit')) {
        log.success('Connection limit is configured');
    } else {
        log.info('Using default connection pool settings');
    }

    if (databaseUrl.includes('pool_timeout')) {
        log.success('Pool timeout is configured');
    }

    // Check Prisma datasource
    const fs = require('fs');
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        if (schema.includes('directUrl')) {
            log.success('Direct URL configured for migrations');
        }
    }
}

// ============================================
// CHECK 6: Backup Status
// ============================================
function checkBackupStatus() {
    log.title('Backup Status');

    const fs = require('fs');
    const backupDir = path.join(__dirname, '..', 'backups');

    if (!fs.existsSync(backupDir)) {
        log.warn('Backup directory does not exist');
        log.info('Run: node scripts/db-backup.js');
        warnings++;
        return;
    }

    const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('backup_'))
        .sort()
        .reverse();

    if (files.length === 0) {
        log.warn('No backups found');
        warnings++;
        return;
    }

    log.success(`Found ${files.length} backup(s)`);

    // Check last backup date
    const latestBackup = files[0];
    const backupPath = path.join(backupDir, latestBackup);
    const stats = fs.statSync(backupPath);
    const daysSinceBackup = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceBackup < 1) {
        log.success(`Latest backup: ${latestBackup} (today)`);
    } else if (daysSinceBackup < 7) {
        log.success(`Latest backup: ${latestBackup} (${Math.floor(daysSinceBackup)} days ago)`);
    } else {
        log.warn(`Latest backup is ${Math.floor(daysSinceBackup)} days old`);
        warnings++;
    }
}

// ============================================
// MAIN
// ============================================
async function main() {
    console.log(`\n${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║     DATABASE HEALTH CHECK SCRIPT       ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}`);

    // Load .env
    try {
        require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    } catch {
        // dotenv might not be installed globally
    }

    const connected = await checkConnection();

    if (connected) {
        checkUserPermissions();
        await checkSchemaIntegrity();
        await checkTableStats();
        checkConnectionPool();
        checkBackupStatus();
    }

    // Summary
    log.title('Summary');

    if (errors === 0 && warnings === 0) {
        log.success('All database health checks passed! ✨');
    } else {
        if (errors > 0) {
            log.error(`${errors} error(s) found - must fix!`);
        }
        if (warnings > 0) {
            log.warn(`${warnings} warning(s) found - review recommended`);
        }
    }

    console.log('');
    process.exit(errors > 0 ? 1 : 0);
}

main().catch(console.error);
