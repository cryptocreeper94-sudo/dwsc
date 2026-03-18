#!/usr/bin/env node
/**
 * Lume Self-Healing Module
 * 
 * Standalone CLI tool for Lume bundle validation, rollback, and diagnostics.
 * Part of the Lume Self-Healing Build Pipeline (Tier 1).
 * 
 * Usage:
 *   node lume-heal.js validate    — Run all validation stages
 *   node lume-heal.js rollback    — Restore last known good bundle
 *   node lume-heal.js status      — Show current build health
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = resolve(__dirname, 'dist/dwsc.js')
const hashPath = resolve(__dirname, 'dist/.last-good-hash')
const srcPath = resolve(__dirname, 'src/main.lume')

const command = process.argv[2] || 'status'

// ── Validate ──
function validate() {
    console.log('\n  ✦ Lume Heal — Validate\n')
    
    if (!existsSync(distPath)) {
        console.log('  ✗ No bundle found at dist/dwsc.js')
        console.log('  ⟐ Run: node build.js\n')
        process.exit(1)
    }

    let errors = 0

    // Stage 1: Syntax
    console.log('  ⟐ Syntax check...')
    try {
        execSync(`node -c "${distPath}"`, { stdio: 'pipe' })
        console.log('  ✓ Syntax valid')
    } catch (e) {
        const stderr = e.stderr?.toString() || ''
        const match = stderr.match(/SyntaxError: (.+)/)
        console.log(`  ✗ Syntax error: ${match ? match[1] : 'unknown'}`)
        errors++
    }

    // Stage 2: Structure
    console.log('  ⟐ Structure check...')
    const bundle = readFileSync(distPath, 'utf-8')
    let pd = 0, bd = 0, inTL = false
    for (const line of bundle.split('\n')) {
        for (let c = 0; c < line.length; c++) {
            const ch = line[c]
            if (ch === '`') { inTL = !inTL; continue }
            if (inTL) continue
            if (ch === '"' || ch === "'") {
                const q = ch; c++
                while (c < line.length && line[c] !== q) { if (line[c] === '\\') c++; c++ }
                continue
            }
            if (ch === '(') pd++; if (ch === ')') pd--
            if (ch === '{') bd++; if (ch === '}') bd--
        }
    }
    if (pd === 0 && bd === 0) {
        console.log('  ✓ Structure balanced')
    } else {
        console.log(`  ✗ Unbalanced: parens=${pd}, braces=${bd}`)
        errors++
    }

    // Result
    if (errors === 0) {
        console.log('\n  ✦ Bundle is healthy ✦\n')
    } else {
        console.log(`\n  ✗ ${errors} issue(s) found`)
        console.log('  ⟐ Run: node lume-heal.js rollback\n')
        process.exit(1)
    }
}

// ── Rollback ──
function rollback() {
    console.log('\n  ✦ Lume Heal — Rollback\n')
    
    if (!existsSync(hashPath)) {
        console.log('  ✗ No last-known-good hash found')
        console.log('  ⟐ No previous valid build recorded\n')
        process.exit(1)
    }

    const hash = readFileSync(hashPath, 'utf-8').trim()
    console.log(`  ⟐ Restoring from commit: ${hash.slice(0, 8)}`)

    try {
        execSync(`git show ${hash}:dist/dwsc.js > "${distPath}"`, { stdio: 'pipe' })
        console.log('  ✓ Bundle restored')
        
        // Verify the restored bundle
        try {
            execSync(`node -c "${distPath}"`, { stdio: 'pipe' })
            console.log('  ✓ Restored bundle passes syntax check')
            console.log('\n  ✦ Rollback complete — safe to deploy ✦\n')
        } catch {
            console.log('  ⚠ Restored bundle has issues — manual review needed\n')
        }
    } catch (e) {
        console.log(`  ✗ Rollback failed: ${e.message}`)
        console.log('  ⟐ Manual intervention required\n')
        process.exit(1)
    }
}

// ── Status ──
function status() {
    console.log('\n  ✦ Lume Heal — Status\n')

    // Bundle info
    if (existsSync(distPath)) {
        const stats = readFileSync(distPath, 'utf-8')
        console.log(`  Bundle: dist/dwsc.js (${(stats.length / 1024).toFixed(1)} KB)`)
    } else {
        console.log('  Bundle: not found')
    }

    // Last good hash
    if (existsSync(hashPath)) {
        const hash = readFileSync(hashPath, 'utf-8').trim()
        console.log(`  Last good: ${hash.slice(0, 8)}`)
    } else {
        console.log('  Last good: none recorded')
    }

    // Current HEAD
    try {
        const head = execSync('git rev-parse HEAD', { stdio: 'pipe' }).toString().trim()
        console.log(`  Current HEAD: ${head.slice(0, 8)}`)
    } catch {
        console.log('  Current HEAD: not in git')
    }

    // Source info
    if (existsSync(srcPath)) {
        const src = readFileSync(srcPath, 'utf-8')
        console.log(`  Source: src/main.lume (${src.split('\n').length} lines)`)
    }

    console.log('')
}

// ── Route command ──
switch (command) {
    case 'validate': validate(); break
    case 'rollback': rollback(); break
    case 'status':   status();   break
    default:
        console.log(`  Unknown command: ${command}`)
        console.log('  Usage: node lume-heal.js [validate|rollback|status]\n')
        process.exit(1)
}
