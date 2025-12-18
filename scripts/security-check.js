#!/usr/bin/env node

/**
 * Security Check Script
 * Run this before deployment to ensure security best practices
 * 
 * Usage: node scripts/security-check.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');

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

// ============================================
// CHECK 1: .env in .gitignore
// ============================================
function checkGitignore() {
    log.title('Checking .gitignore');

    const gitignorePath = path.join(ROOT_DIR, '.gitignore');

    if (!fs.existsSync(gitignorePath)) {
        log.error('.gitignore file not found!');
        errors++;
        return;
    }

    const content = fs.readFileSync(gitignorePath, 'utf-8');
    const lines = content.split('\n').map(l => l.trim());

    const envPatterns = ['.env', '.env.local', '.env*'];
    const hasEnvIgnore = envPatterns.some(pattern =>
        lines.some(line => line === pattern || line.startsWith(pattern))
    );

    if (hasEnvIgnore) {
        log.success('.env files are in .gitignore');
    } else {
        log.error('.env files are NOT in .gitignore - SECURITY RISK!');
        errors++;
    }

    // Check if .env.example exists
    if (fs.existsSync(path.join(ROOT_DIR, '.env.example'))) {
        log.success('.env.example exists for reference');
    } else {
        log.warn('.env.example not found - consider creating one');
        warnings++;
    }
}

// ============================================
// CHECK 2: Required Environment Variables
// ============================================
function checkEnvVariables() {
    log.title('Checking Environment Variables');

    const requiredVars = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL',
    ];

    const recommendedVars = [
        'ENCRYPTION_KEY',
        'ALLOWED_ORIGINS',
    ];

    // Check .env file exists
    const envPath = path.join(ROOT_DIR, '.env');
    if (!fs.existsSync(envPath)) {
        log.error('.env file not found!');
        errors++;
        return;
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
            envVars[match[1].trim()] = match[2].trim();
        }
    });

    // Check required
    for (const varName of requiredVars) {
        if (envVars[varName] && envVars[varName] !== '' && !envVars[varName].includes('your-')) {
            log.success(`${varName} is set`);
        } else if (envVars[varName]?.includes('your-')) {
            log.error(`${varName} has placeholder value - update it!`);
            errors++;
        } else {
            log.error(`${varName} is NOT set - REQUIRED!`);
            errors++;
        }
    }

    // Check recommended
    for (const varName of recommendedVars) {
        if (envVars[varName] && envVars[varName] !== '') {
            log.success(`${varName} is set`);
        } else {
            log.warn(`${varName} is not set (recommended)`);
            warnings++;
        }
    }

    // Check NEXTAUTH_SECRET length
    if (envVars['NEXTAUTH_SECRET'] && envVars['NEXTAUTH_SECRET'].length < 32) {
        log.error('NEXTAUTH_SECRET should be at least 32 characters!');
        errors++;
    }

    // Check ENCRYPTION_KEY length
    if (envVars['ENCRYPTION_KEY'] && envVars['ENCRYPTION_KEY'].length !== 32) {
        log.warn('ENCRYPTION_KEY should be exactly 32 characters for AES-256');
        warnings++;
    }
}

// ============================================
// CHECK 3: Hardcoded Secrets in Code
// ============================================
function checkHardcodedSecrets() {
    log.title('Checking for Hardcoded Secrets');

    const patterns = [
        { name: 'API Key', regex: /['"](?:api[_-]?key|apikey)['"]?\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/gi },
        { name: 'Secret', regex: /['"](?:secret|password)['"]?\s*[:=]\s*['"][^'"]{8,}['"]/gi },
        { name: 'Bearer Token', regex: /['"]Bearer\s+[a-zA-Z0-9._-]{20,}['"]/gi },
        { name: 'Private Key', regex: /-----BEGIN (?:RSA )?PRIVATE KEY-----/gi },
        { name: 'AWS Key', regex: /AKIA[0-9A-Z]{16}/gi },
    ];

    const srcDir = path.join(ROOT_DIR, 'src');
    const filesToCheck = [];

    function walkDir(dir) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory() && !file.includes('node_modules')) {
                walkDir(filePath);
            } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
                filesToCheck.push(filePath);
            }
        }
    }

    walkDir(srcDir);

    let foundSecrets = false;

    for (const filePath of filesToCheck) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const relativePath = path.relative(ROOT_DIR, filePath);

        for (const { name, regex } of patterns) {
            const matches = content.match(regex);
            if (matches) {
                // Skip if it's clearly an example or placeholder
                const hasPlaceholder = matches.some(m =>
                    m.includes('your-') ||
                    m.includes('example') ||
                    m.includes('placeholder') ||
                    m.includes('process.env')
                );

                if (!hasPlaceholder) {
                    log.warn(`Possible ${name} in ${relativePath}`);
                    foundSecrets = true;
                    warnings++;
                }
            }
        }
    }

    if (!foundSecrets) {
        log.success('No obvious hardcoded secrets found');
    }
}

// ============================================
// CHECK 4: NPM Audit
// ============================================
function checkNpmAudit() {
    log.title('Running NPM Audit');

    try {
        const result = execSync('npm audit --json 2>/dev/null', {
            cwd: ROOT_DIR,
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
        });

        const audit = JSON.parse(result);
        const vulnerabilities = audit.metadata?.vulnerabilities || {};

        const critical = vulnerabilities.critical || 0;
        const high = vulnerabilities.high || 0;
        const moderate = vulnerabilities.moderate || 0;
        const low = vulnerabilities.low || 0;

        if (critical > 0) {
            log.error(`${critical} critical vulnerabilities found!`);
            errors++;
        }

        if (high > 0) {
            log.error(`${high} high vulnerabilities found!`);
            errors++;
        }

        if (moderate > 0) {
            log.warn(`${moderate} moderate vulnerabilities found`);
            warnings++;
        }

        if (low > 0) {
            log.info(`${low} low vulnerabilities found`);
        }

        if (critical === 0 && high === 0 && moderate === 0 && low === 0) {
            log.success('No vulnerabilities found');
        }

    } catch (error) {
        // npm audit returns non-zero if vulnerabilities found
        if (error.stdout) {
            try {
                const audit = JSON.parse(error.stdout);
                const total = audit.metadata?.vulnerabilities?.total || 0;
                if (total > 0) {
                    log.warn(`${total} total vulnerabilities found - run 'npm audit' for details`);
                    warnings++;
                }
            } catch {
                log.warn('Could not parse npm audit output');
            }
        } else {
            log.warn('npm audit check skipped');
        }
    }
}

// ============================================
// CHECK 5: Production Readiness
// ============================================
function checkProductionReadiness() {
    log.title('Checking Production Readiness');

    const envPath = path.join(ROOT_DIR, '.env');
    const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

    // Check NODE_ENV
    if (envContent.includes('NODE_ENV="production"') || envContent.includes("NODE_ENV='production'")) {
        log.success('NODE_ENV is set to production');
    } else {
        log.info('NODE_ENV is not production (OK for development)');
    }

    // Check for debug flags
    if (envContent.includes('DEBUG=true') || envContent.includes('DEBUG="true"')) {
        log.warn('DEBUG mode is enabled');
        warnings++;
    } else {
        log.success('DEBUG mode is not explicitly enabled');
    }

    // Check package-lock.json exists
    if (fs.existsSync(path.join(ROOT_DIR, 'package-lock.json'))) {
        log.success('package-lock.json exists (reproducible builds)');
    } else {
        log.warn('package-lock.json not found');
        warnings++;
    }

    // Check middleware exists
    if (fs.existsSync(path.join(ROOT_DIR, 'src/middleware.ts'))) {
        log.success('middleware.ts exists (security middleware)');
    } else {
        log.warn('middleware.ts not found');
        warnings++;
    }
}

// ============================================
// MAIN
// ============================================
function main() {
    console.log(`\n${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║       SECURITY CHECK SCRIPT            ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}`);

    checkGitignore();
    checkEnvVariables();
    checkHardcodedSecrets();
    checkNpmAudit();
    checkProductionReadiness();

    // Summary
    log.title('Summary');

    if (errors === 0 && warnings === 0) {
        log.success('All security checks passed! ✨');
    } else {
        if (errors > 0) {
            log.error(`${errors} error(s) found - must fix before production!`);
        }
        if (warnings > 0) {
            log.warn(`${warnings} warning(s) found - review recommended`);
        }
    }

    console.log('');

    // Exit with error if critical issues found
    process.exit(errors > 0 ? 1 : 0);
}

main();
