#!/usr/bin/env node
/**
 * Lume Self-Healing Module
 * 
 * Standalone CLI tool for Lume bundle validation, rollback, monitoring, and diagnostics.
 * Part of the Lume Self-Healing Build Pipeline.
 * 
 * Usage:
 *   node lume-heal.js validate    — Run all validation stages
 *   node lume-heal.js rollback    — Restore last known good bundle  
 *   node lume-heal.js status      — Show current build health
 *   node lume-heal.js check <url> — Check a live Lume deployment
 *   node lume-heal.js monitor <url> [interval] — Continuous health monitoring
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
const arg1 = process.argv[3]
const arg2 = process.argv[4]


// ════════════════════════════════════════════════════
// ═══ VALIDATE — Local bundle validation ═══════════
// ════════════════════════════════════════════════════

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

    // Stage 3: Health beacon check
    console.log('  ⟐ Health beacon check...')
    if (bundle.includes('__LUME_HEALTH__')) {
        console.log('  ✓ Health beacon present')
    } else {
        console.log('  ⚠ No health beacon found (rebuild recommended)')
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


// ════════════════════════════════════════════════════
// ═══ ROLLBACK — Restore last known good bundle ════
// ════════════════════════════════════════════════════

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


// ════════════════════════════════════════════════════
// ═══ STATUS — Current build health overview ═══════
// ════════════════════════════════════════════════════

function status() {
    console.log('\n  ✦ Lume Heal — Status\n')

    if (existsSync(distPath)) {
        const stats = readFileSync(distPath, 'utf-8')
        console.log(`  Bundle: dist/dwsc.js (${(stats.length / 1024).toFixed(1)} KB)`)
        console.log(`  Beacon: ${stats.includes('__LUME_HEALTH__') ? '✓ present' : '✗ missing'}`)
    } else {
        console.log('  Bundle: not found')
    }

    if (existsSync(hashPath)) {
        const hash = readFileSync(hashPath, 'utf-8').trim()
        console.log(`  Last good: ${hash.slice(0, 8)}`)
    } else {
        console.log('  Last good: none recorded')
    }

    try {
        const head = execSync('git rev-parse HEAD', { stdio: 'pipe' }).toString().trim()
        console.log(`  Current HEAD: ${head.slice(0, 8)}`)
    } catch {
        console.log('  Current HEAD: not in git')
    }

    if (existsSync(srcPath)) {
        const src = readFileSync(srcPath, 'utf-8')
        console.log(`  Source: src/main.lume (${src.split('\n').length} lines)`)
    }

    console.log('')
}


// ════════════════════════════════════════════════════
// ═══ CHECK — Verify a live Lume deployment ════════
// ════════════════════════════════════════════════════

async function check(url) {
    if (!url) {
        console.log('\n  Usage: node lume-heal.js check <url>')
        console.log('  Example: node lume-heal.js check https://dwsc.io\n')
        process.exit(1)
    }

    console.log(`\n  ✦ Lume Heal — Live Check: ${url}\n`)
    let errors = 0

    // Check 1: HTML loads
    console.log('  ⟐ Checking HTML response...')
    try {
        const htmlRes = await fetch(url, { redirect: 'follow' })
        if (htmlRes.ok) {
            const html = await htmlRes.text()
            console.log(`  ✓ HTML: ${htmlRes.status} (${(html.length / 1024).toFixed(1)} KB)`)
            
            // Detect script src
            const scriptMatch = html.match(/src=["']([^"']*\.js)["']/)
            if (scriptMatch) {
                const scriptUrl = new URL(scriptMatch[1], url).href
                console.log(`  ⟐ Found bundle: ${scriptMatch[1]}`)
                
                // Check 2: Bundle loads
                console.log('  ⟐ Checking bundle response...')
                try {
                    const jsRes = await fetch(scriptUrl)
                    if (jsRes.ok) {
                        const js = await jsRes.text()
                        console.log(`  ✓ Bundle: ${jsRes.status} (${(js.length / 1024).toFixed(1)} KB)`)

                        // Check 3: Health beacon present
                        if (js.includes('__LUME_HEALTH__')) {
                            console.log('  ✓ Health beacon: present')
                        } else {
                            console.log('  ⚠ Health beacon: not found (older build?)')
                        }

                        // Check 4: IIFE structure
                        if (js.includes('(function()') && js.trimEnd().endsWith('})();')) {
                            console.log('  ✓ IIFE wrapper: intact')
                        } else {
                            console.log('  ⚠ IIFE wrapper: unexpected format')
                        }

                        // Check 5: Lume stdlib present
                        if (js.includes('Lume Standard Library')) {
                            console.log('  ✓ Lume stdlib: present')
                        } else {
                            console.log('  ⚠ Lume stdlib: not detected (may be a non-Lume bundle)')
                        }
                    } else {
                        console.log(`  ✗ Bundle failed: HTTP ${jsRes.status}`)
                        errors++
                    }
                } catch (e) {
                    console.log(`  ✗ Bundle fetch failed: ${e.message}`)
                    errors++
                }
            } else {
                console.log('  ⚠ No .js script tag found in HTML')
            }
        } else {
            console.log(`  ✗ HTML failed: HTTP ${htmlRes.status}`)
            errors++
        }
    } catch (e) {
        console.log(`  ✗ Connection failed: ${e.message}`)
        errors++
    }

    // Result
    if (errors === 0) {
        console.log('\n  ✦ Deployment is healthy ✦\n')
    } else {
        console.log(`\n  ✗ ${errors} issue(s) detected`)
        console.log('  ⟐ Deployment may need attention\n')
        process.exit(1)
    }
}


// ════════════════════════════════════════════════════
// ═══ MONITOR — Continuous health monitoring ═══════
// ════════════════════════════════════════════════════

async function monitor(url, intervalSec = 30) {
    if (!url) {
        console.log('\n  Usage: node lume-heal.js monitor <url> [interval_seconds]')
        console.log('  Example: node lume-heal.js monitor https://dwsc.io 60\n')
        process.exit(1)
    }

    const interval = parseInt(intervalSec) || 30
    console.log(`\n  ✦ Lume Heal — Monitor Mode`)
    console.log(`  Target: ${url}`)
    console.log(`  Interval: ${interval}s`)
    console.log(`  Press Ctrl+C to stop\n`)

    let consecutiveFailures = 0
    let totalChecks = 0
    let totalFailures = 0

    const runCheck = async () => {
        totalChecks++
        const time = new Date().toLocaleTimeString()
        
        try {
            const res = await fetch(url, { redirect: 'follow' })
            if (res.ok) {
                const html = await res.text()
                
                // Quick health indicators
                const hasContent = html.length > 500
                const hasScript = html.includes('.js')
                
                if (hasContent && hasScript) {
                    consecutiveFailures = 0
                    process.stdout.write(`  [${time}] ✓ UP (${res.status}, ${(html.length / 1024).toFixed(0)}KB)`)
                    if (totalChecks > 1) process.stdout.write(` — ${totalChecks} checks, ${totalFailures} failures`)
                    console.log('')
                } else {
                    consecutiveFailures++
                    totalFailures++
                    console.log(`  [${time}] ⚠ DEGRADED — response too small or missing scripts`)
                }
            } else {
                consecutiveFailures++
                totalFailures++
                console.log(`  [${time}] ✗ DOWN — HTTP ${res.status}`)
            }
        } catch (e) {
            consecutiveFailures++
            totalFailures++
            console.log(`  [${time}] ✗ DOWN — ${e.message}`)
        }

        // Alert on consecutive failures
        if (consecutiveFailures >= 3) {
            console.log('')
            console.log('  ═══════════════════════════════════════')
            console.log(`  ⚠ ALERT: ${consecutiveFailures} consecutive failures!`)
            console.log('  ⟐ Possible actions:')
            console.log('    1. node lume-heal.js check ' + url)
            console.log('    2. node lume-heal.js rollback')
            console.log('    3. Check Render dashboard')
            console.log('  ═══════════════════════════════════════')
            console.log('')
        }
    }

    // Initial check
    await runCheck()

    // Continuous monitoring
    setInterval(runCheck, interval * 1000)
}


// ═══ Route command ═══
switch (command) {
    case 'validate': validate(); break
    case 'rollback': rollback(); break
    case 'status':   status();   break
    case 'check':    check(arg1); break
    case 'monitor':  monitor(arg1, arg2); break
    default:
        console.log(`\n  ✦ Lume Heal — Self-Healing Module\n`)
        console.log('  Commands:')
        console.log('    validate         — Run all validation stages on local bundle')
        console.log('    rollback         — Restore last known good bundle')
        console.log('    status           — Show current build health')  
        console.log('    check <url>      — Verify a live Lume deployment')
        console.log('    monitor <url>    — Continuous health monitoring')
        console.log('')
        process.exit(command === 'help' ? 0 : 1)
}
