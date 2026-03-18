#!/usr/bin/env node
/**
 * Lume Self-Healing Module v2.0
 * 
 * Part of the Lume Self-Healing Build Pipeline.
 * Includes build validation, rollback, live monitoring, build history, and evolution engine.
 * 
 * Commands:
 *   validate         — Run all validation stages on local bundle
 *   rollback         — Restore last known good bundle
 *   status           — Show current build health
 *   check <url>      — Verify a live Lume deployment
 *   monitor <url>    — Continuous health monitoring
 *   history          — View build history and trends
 *   evolve           — Run the evolution engine (pattern analysis + recommendations)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = resolve(__dirname, 'dist/dwsc.js')
const hashPath = resolve(__dirname, 'dist/.last-good-hash')
const srcPath = resolve(__dirname, 'src/main.lume')
const historyPath = resolve(__dirname, '.lume-history.json')

const command = process.argv[2] || 'status'
const arg1 = process.argv[3]
const arg2 = process.argv[4]

function loadHistory() {
    try { return JSON.parse(readFileSync(historyPath, 'utf-8')) } catch { return [] }
}


// ════════════════════════════════════════════════════
// ═══ VALIDATE ═════════════════════════════════════
// ════════════════════════════════════════════════════

function validate() {
    console.log('\n  ✦ Lume Heal — Validate\n')
    
    if (!existsSync(distPath)) {
        console.log('  ✗ No bundle found at dist/dwsc.js')
        console.log('  ⟐ Run: node build.js\n')
        process.exit(1)
    }

    let errors = 0
    const bundle = readFileSync(distPath, 'utf-8')

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

    // Stage 3: Health beacon
    console.log('  ⟐ Health beacon check...')
    if (bundle.includes('__LUME_HEALTH__')) {
        console.log('  ✓ Health beacon present')
    } else {
        console.log('  ⚠ No health beacon found')
    }

    if (errors === 0) {
        console.log('\n  ✦ Bundle is healthy ✦\n')
    } else {
        console.log(`\n  ✗ ${errors} issue(s) found`)
        console.log('  ⟐ Run: node lume-heal.js rollback\n')
        process.exit(1)
    }
}


// ════════════════════════════════════════════════════
// ═══ ROLLBACK ═════════════════════════════════════
// ════════════════════════════════════════════════════

function rollback() {
    console.log('\n  ✦ Lume Heal — Rollback\n')
    
    if (!existsSync(hashPath)) {
        console.log('  ✗ No last-known-good hash found\n')
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
        console.log(`  ✗ Rollback failed: ${e.message}\n`)
        process.exit(1)
    }
}


// ════════════════════════════════════════════════════
// ═══ STATUS ═══════════════════════════════════════
// ════════════════════════════════════════════════════

function status() {
    console.log('\n  ✦ Lume Heal — Status\n')

    if (existsSync(distPath)) {
        const bundle = readFileSync(distPath, 'utf-8')
        console.log(`  Bundle:    dist/dwsc.js (${(bundle.length / 1024).toFixed(1)} KB)`)
        console.log(`  Beacon:    ${bundle.includes('__LUME_HEALTH__') ? '✓ present' : '✗ missing'}`)
    } else {
        console.log('  Bundle: not found')
    }

    if (existsSync(hashPath)) {
        console.log(`  Last good: ${readFileSync(hashPath, 'utf-8').trim().slice(0, 8)}`)
    }

    try {
        const head = execSync('git rev-parse HEAD', { stdio: 'pipe' }).toString().trim()
        console.log(`  HEAD:      ${head.slice(0, 8)}`)
    } catch {}

    if (existsSync(srcPath)) {
        console.log(`  Source:    ${readFileSync(srcPath, 'utf-8').split('\n').length} lines`)
    }

    const history = loadHistory()
    if (history.length > 0) {
        const valid = history.filter(h => h.valid).length
        console.log(`  History:   ${history.length} builds, ${valid} passed (${Math.round(valid/history.length*100)}%)`)
    }

    console.log('')
}


// ════════════════════════════════════════════════════
// ═══ CHECK — Live deployment verification ════════
// ════════════════════════════════════════════════════

async function check(url) {
    if (!url) {
        console.log('\n  Usage: node lume-heal.js check <url>\n')
        process.exit(1)
    }

    console.log(`\n  ✦ Lume Heal — Live Check: ${url}\n`)
    let errors = 0

    console.log('  ⟐ Checking HTML response...')
    try {
        const htmlRes = await fetch(url, { redirect: 'follow' })
        if (htmlRes.ok) {
            const html = await htmlRes.text()
            console.log(`  ✓ HTML: ${htmlRes.status} (${(html.length / 1024).toFixed(1)} KB)`)
            
            const scriptMatch = html.match(/src=["']([^"']*\.js)["']/)
            if (scriptMatch) {
                const scriptUrl = new URL(scriptMatch[1], url).href
                console.log(`  ⟐ Found bundle: ${scriptMatch[1]}`)
                
                try {
                    const jsRes = await fetch(scriptUrl)
                    if (jsRes.ok) {
                        const js = await jsRes.text()
                        console.log(`  ✓ Bundle: ${jsRes.status} (${(js.length / 1024).toFixed(1)} KB)`)
                        console.log(`  ${js.includes('__LUME_HEALTH__') ? '✓' : '⚠'} Health beacon: ${js.includes('__LUME_HEALTH__') ? 'present' : 'not found'}`)
                        console.log(`  ${js.includes('(function()') ? '✓' : '⚠'} IIFE wrapper: ${js.includes('(function()') ? 'intact' : 'unexpected'}`)
                        console.log(`  ${js.includes('Lume Standard Library') ? '✓' : '⚠'} Lume stdlib: ${js.includes('Lume Standard Library') ? 'present' : 'not detected'}`)
                    } else {
                        console.log(`  ✗ Bundle failed: HTTP ${jsRes.status}`)
                        errors++
                    }
                } catch (e) {
                    console.log(`  ✗ Bundle fetch failed: ${e.message}`)
                    errors++
                }
            } else {
                console.log('  ⚠ No .js script tag found')
            }
        } else {
            console.log(`  ✗ HTML failed: HTTP ${htmlRes.status}`)
            errors++
        }
    } catch (e) {
        console.log(`  ✗ Connection failed: ${e.message}`)
        errors++
    }

    console.log(errors === 0 ? '\n  ✦ Deployment is healthy ✦\n' : `\n  ✗ ${errors} issue(s)\n`)
    if (errors > 0) process.exit(1)
}


// ════════════════════════════════════════════════════
// ═══ MONITOR — Continuous health monitoring ═══════
// ════════════════════════════════════════════════════

async function monitor(url, intervalSec = 30) {
    if (!url) {
        console.log('\n  Usage: node lume-heal.js monitor <url> [interval_seconds]\n')
        process.exit(1)
    }

    const interval = parseInt(intervalSec) || 30
    console.log(`\n  ✦ Lume Heal — Monitor Mode`)
    console.log(`  Target: ${url}  |  Interval: ${interval}s  |  Ctrl+C to stop\n`)

    let fails = 0, checks = 0, totalFails = 0

    const tick = async () => {
        checks++
        const time = new Date().toLocaleTimeString()
        try {
            const res = await fetch(url, { redirect: 'follow' })
            if (res.ok) {
                const html = await res.text()
                if (html.length > 500 && html.includes('.js')) {
                    fails = 0
                    console.log(`  [${time}] ✓ UP (${res.status}, ${(html.length/1024).toFixed(0)}KB) — ${checks} checks, ${totalFails} failures`)
                } else {
                    fails++; totalFails++
                    console.log(`  [${time}] ⚠ DEGRADED — response too small`)
                }
            } else {
                fails++; totalFails++
                console.log(`  [${time}] ✗ DOWN — HTTP ${res.status}`)
            }
        } catch (e) {
            fails++; totalFails++
            console.log(`  [${time}] ✗ DOWN — ${e.message}`)
        }

        if (fails >= 3) {
            console.log('\n  ═══════════════════════════════════════')
            console.log(`  ⚠ ALERT: ${fails} consecutive failures!`)
            console.log('  ⟐ node lume-heal.js check ' + url)
            console.log('  ⟐ node lume-heal.js rollback')
            console.log('  ═══════════════════════════════════════\n')
        }
    }

    await tick()
    setInterval(tick, interval * 1000)
}


// ════════════════════════════════════════════════════
// ═══ HISTORY — Build history and trends ═══════════
// ════════════════════════════════════════════════════

function history() {
    const builds = loadHistory()
    
    if (builds.length === 0) {
        console.log('\n  ✦ Lume Heal — History\n')
        console.log('  No build history found. Run: node build.js\n')
        return
    }

    const valid = builds.filter(h => h.valid)
    const failed = builds.filter(h => !h.valid)
    const avgTime = Math.round(builds.reduce((s, b) => s + (b.buildTimeMs || 0), 0) / builds.length)
    const avgSize = Math.round(builds.reduce((s, b) => s + b.bundleSize, 0) / builds.length / 1024)

    console.log('\n  ✦ Lume Heal — Build History\n')
    console.log('  ─── Overview ─────────────────────────')
    console.log(`  Total builds:    ${builds.length}`)
    console.log(`  Passed:          ${valid.length} (${Math.round(valid.length/builds.length*100)}%)`)
    console.log(`  Failed:          ${failed.length} (${Math.round(failed.length/builds.length*100)}%)`)
    console.log(`  Avg build time:  ${avgTime}ms`)
    console.log(`  Avg bundle size: ${avgSize} KB`)

    // Bundle size trend
    if (builds.length >= 3) {
        const recent = builds.slice(-3)
        const sizes = recent.map(b => (b.bundleSize / 1024).toFixed(1))
        console.log(`  Size trend:      ${sizes.join(' → ')} KB`)
    }

    // Error frequency analysis
    if (failed.length > 0) {
        console.log('\n  ─── Error Analysis ────────────────────')
        const errorTypes = {}
        failed.forEach(f => {
            f.errors.forEach(e => {
                const key = e.error
                if (!errorTypes[key]) errorTypes[key] = { count: 0, commits: new Set(), stages: new Set() }
                errorTypes[key].count++
                errorTypes[key].commits.add(f.commit)
                errorTypes[key].stages.add(e.stage)
            })
        })
        
        Object.entries(errorTypes)
            .sort((a, b) => b[1].count - a[1].count)
            .forEach(([error, data]) => {
                console.log(`  [${data.count}x] ${error}`)
                console.log(`       Stages: ${[...data.stages].join(', ')} | Commits: ${[...data.commits].join(', ')}`)
            })
    }

    // Recent builds
    console.log('\n  ─── Recent Builds ────────────────────')
    builds.slice(-8).forEach(b => {
        const status = b.valid ? '✓' : '✗'
        const time = b.timestamp?.slice(0, 16)?.replace('T', ' ') || 'unknown'
        const size = (b.bundleSize / 1024).toFixed(1)
        const duration = b.buildTimeMs ? `${b.buildTimeMs}ms` : '—'
        const errors = !b.valid ? ` — ${b.errors.map(e => e.error).join('; ')}` : ''
        console.log(`  ${status} ${time} | ${b.commit} | ${size}KB | ${duration}${errors}`)
    })

    console.log('')
}


// ════════════════════════════════════════════════════
// ═══ EVOLVE — Pattern analysis & recommendations ═
// ════════════════════════════════════════════════════

function evolve() {
    const builds = loadHistory()
    
    if (builds.length < 3) {
        console.log('\n  ✦ Lume Heal — Evolution Engine\n')
        console.log('  Need at least 3 builds for pattern analysis.')
        console.log(`  Current: ${builds.length} builds\n`)
        return
    }

    console.log('\n  ✦ Lume Heal — Evolution Engine\n')
    console.log('  Analyzing build patterns...\n')

    const recommendations = []
    const valid = builds.filter(h => h.valid)
    const failed = builds.filter(h => !h.valid)

    // ── Analysis 1: Failure Rate Trend ──
    const recentHalf = builds.slice(-Math.ceil(builds.length / 2))
    const olderHalf = builds.slice(0, Math.floor(builds.length / 2))
    const recentFail = recentHalf.filter(h => !h.valid).length / recentHalf.length
    const olderFail = olderHalf.length > 0 ? olderHalf.filter(h => !h.valid).length / olderHalf.length : 0

    if (recentFail > olderFail && recentFail > 0.3) {
        recommendations.push({
            severity: 'HIGH',
            title: 'Increasing Failure Rate',
            detail: `Recent failure rate (${Math.round(recentFail*100)}%) is higher than historical (${Math.round(olderFail*100)}%).`,
            action: 'Review recent changes — code quality may be degrading.'
        })
    } else if (recentFail === 0 && builds.length > 5) {
        recommendations.push({
            severity: 'INFO',
            title: 'Clean Build Streak',
            detail: `Last ${recentHalf.length} builds all passed.`,
            action: 'Pipeline is healthy. Keep it up!'
        })
    }

    // ── Analysis 2: Bundle Size Growth ──
    if (builds.length >= 5) {
        const firstSize = builds[0].bundleSize
        const lastSize = builds[builds.length - 1].bundleSize
        const growth = ((lastSize - firstSize) / firstSize * 100).toFixed(1)
        
        if (parseFloat(growth) > 20) {
            recommendations.push({
                severity: 'WARN',
                title: 'Bundle Size Growing',
                detail: `Bundle grew ${growth}% (${(firstSize/1024).toFixed(0)}KB → ${(lastSize/1024).toFixed(0)}KB) over ${builds.length} builds.`,
                action: 'Consider code splitting or removing unused features.'
            })
        } else if (parseFloat(growth) < 0) {
            recommendations.push({
                severity: 'INFO',
                title: 'Bundle Size Optimized',
                detail: `Bundle shrunk ${Math.abs(growth)}% — good optimization.`,
                action: 'None needed.'
            })
        }
    }

    // ── Analysis 3: Build Performance ──
    const timesMs = builds.filter(b => b.buildTimeMs).map(b => b.buildTimeMs)
    if (timesMs.length >= 3) {
        const avg = Math.round(timesMs.reduce((s, t) => s + t, 0) / timesMs.length)
        const max = Math.max(...timesMs)
        const recentAvg = Math.round(timesMs.slice(-3).reduce((s, t) => s + t, 0) / 3)

        if (recentAvg > avg * 1.5) {
            recommendations.push({
                severity: 'WARN',
                title: 'Build Getting Slower',
                detail: `Recent avg: ${recentAvg}ms vs overall avg: ${avg}ms.`,
                action: 'Check for complex transforms or growing source file.'
            })
        }
        
        if (max > avg * 3) {
            recommendations.push({
                severity: 'INFO',
                title: 'Build Time Spike Detected',
                detail: `Max build time (${max}ms) is ${(max/avg).toFixed(1)}x the average (${avg}ms).`,
                action: 'Monitor for consistency. Spikes may indicate resource contention.'
            })
        }
    }

    // ── Analysis 4: Recurring Errors ──
    if (failed.length > 0) {
        const errorTypes = {}
        failed.forEach(f => {
            f.errors.forEach(e => {
                if (!errorTypes[e.error]) errorTypes[e.error] = { count: 0, lines: new Set() }
                errorTypes[e.error].count++
                if (e.sourceLine) errorTypes[e.error].lines.add(e.sourceLine)
            })
        })

        Object.entries(errorTypes)
            .filter(([, d]) => d.count >= 2)
            .sort((a, b) => b[1].count - a[1].count)
            .forEach(([error, data]) => {
                recommendations.push({
                    severity: 'HIGH',
                    title: `Recurring Error: ${error}`,
                    detail: `Occurred ${data.count}x${data.lines.size > 0 ? ` near source line(s): ${[...data.lines].join(', ')}` : ''}.`,
                    action: 'This is a hotspot. Consider refactoring the affected code or adding a transform rule.'
                })
            })
    }

    // ── Analysis 5: Source File Growth ──
    const srcLines = builds.filter(b => b.sourceLines).map(b => b.sourceLines)
    if (srcLines.length >= 3) {
        const growth = srcLines[srcLines.length - 1] - srcLines[0]
        if (growth > 500) {
            recommendations.push({
                severity: 'WARN',
                title: 'Source File Growing Rapidly',
                detail: `main.lume grew by ${growth} lines over ${builds.length} builds.`,
                action: 'Consider splitting into multiple Lume modules or extracting reusable components.'
            })
        }
    }

    // ── Analysis 6: Commit Diversity ──
    const commitSet = new Set(builds.map(b => b.commit))
    if (commitSet.size < builds.length * 0.3 && builds.length > 5) {
        recommendations.push({
            severity: 'INFO',
            title: 'Frequent Rebuilds Without Commits',
            detail: `${builds.length} builds across only ${commitSet.size} distinct commits.`,
            action: 'Multiple rebuilds per commit may indicate debugging cycles. Consider running validation locally first.'
        })
    }

    // ── Print Recommendations ──
    if (recommendations.length === 0) {
        console.log('  ✦ No issues detected — pipeline is running optimally ✦\n')
        return
    }

    const severityIcon = { HIGH: '🔴', WARN: '🟡', INFO: '🟢' }
    const severityOrder = { HIGH: 0, WARN: 1, INFO: 2 }

    recommendations
        .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
        .forEach((rec, i) => {
            console.log(`  ${severityIcon[rec.severity]} ${rec.title}`)
            console.log(`     ${rec.detail}`)
            console.log(`     → ${rec.action}`)
            if (i < recommendations.length - 1) console.log('')
        })

    console.log('\n  ───────────────────────────────────────')
    const high = recommendations.filter(r => r.severity === 'HIGH').length
    const warn = recommendations.filter(r => r.severity === 'WARN').length
    const info = recommendations.filter(r => r.severity === 'INFO').length
    console.log(`  Summary: ${high} critical, ${warn} warnings, ${info} informational`)
    console.log('  ✦ Evolution analysis complete ✦\n')
}


// ═══ Route command ═══
switch (command) {
    case 'validate': validate(); break
    case 'rollback': rollback(); break
    case 'status':   status();   break
    case 'check':    check(arg1); break
    case 'monitor':  monitor(arg1, arg2); break
    case 'history':  history(); break
    case 'evolve':   evolve(); break
    default:
        console.log(`\n  ✦ Lume Heal v2.0 — Self-Healing Module\n`)
        console.log('  Build:')
        console.log('    validate         — Run all validation stages')
        console.log('    rollback         — Restore last known good bundle')
        console.log('    status           — Current build health')
        console.log('  Deploy:')
        console.log('    check <url>      — Verify live deployment')
        console.log('    monitor <url>    — Continuous health monitoring')
        console.log('  Evolution:')
        console.log('    history          — Build history and trends')
        console.log('    evolve           — Pattern analysis + recommendations')
        console.log('')
        process.exit(command === 'help' ? 0 : 1)
}
