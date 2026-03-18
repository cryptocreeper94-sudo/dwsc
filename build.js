/**
 * Lume Browser Bundler for DWSC
 * Transforms src/main.lume → dist/dwsc.js
 * 
 * Transformation rules:
 *   - Wraps in IIFE with Lume Standard Library
 *   - /// comments → // comments
 *   - Multi-line "..." strings → template literals `...`
 *   - for each X in Y → for (const X of Y)
 *   - for i in range(a, b) → for (let i = a; i < b; i++)
 *   - define X = Y → const X = Y
 *   - show X → console.log(X)
 *   - Preserves all other syntax (dom.create, state.reactive, etc.)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Read source ──
const srcPath = resolve(__dirname, 'src/main.lume')
const distPath = resolve(__dirname, 'dist/dwsc.js')
const source = readFileSync(srcPath, 'utf-8')

// ── Transform .lume → JS ──
function transformLume(src) {
    let lines = src.split('\n')
    let output = []
    let inMultiLineString = false
    let multiLineBuffer = []
    let multiLineVarPrefix = ''

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i]

        // Convert /// comments to //
        if (line.trimStart().startsWith('///')) {
            output.push(line.replace('///', '//'))
            continue
        }

        // Handle multi-line string detection
        // Pattern: something("    or something(`
        // We detect lines that open a string with " but don't close it on the same line
        if (!inMultiLineString) {
            // Check for dom.inject_css(" pattern with unclosed string
            const injectMatch = line.match(/^(\s*dom\.inject_css\()\"$/)
            if (injectMatch) {
                inMultiLineString = true
                multiLineBuffer = []
                multiLineVarPrefix = injectMatch[1]
                continue
            }

            // Convert 'define' to 'const'
            line = line.replace(/^(\s*)define\s+/, '$1const ')

            // Convert 'show' to 'console.log'
            line = line.replace(/^(\s*)show\s+(.+)$/, '$1console.log($2)')

            // Convert 'for each X in Y' (with indented body)
            const forEachMatch = line.match(/^(\s*)for\s+each\s+(\w+)\s+in\s+(.+)$/)
            if (forEachMatch) {
                output.push(`${forEachMatch[1]}for (const ${forEachMatch[2]} of ${forEachMatch[3]}) {`)
                // Look ahead for the indented block body
                const baseIndent = forEachMatch[1].length
                let j = i + 1
                while (j < lines.length) {
                    const nextLine = lines[j]
                    const trimmed = nextLine.trim()
                    if (trimmed === '') { j++; continue }
                    const nextIndent = nextLine.match(/^(\s*)/)[1].length
                    if (nextIndent <= baseIndent) break
                    // Recursively handle nested transforms
                    let transformed = nextLine
                    transformed = transformed.replace(/^(\s*)define\s+/, '$1const ')
                    transformed = transformed.replace(/^(\s*)show\s+(.+)$/, '$1console.log($2)')
                    output.push(transformed)
                    j++
                }
                output.push(`${forEachMatch[1]}}`)
                i = j - 1
                continue
            }

            // Convert 'for i in range(a, b)' 
            const forRangeMatch = line.match(/^(\s*)for\s+(\w+)\s+in\s+range\((.+),\s*(.+)\)$/)
            if (forRangeMatch) {
                output.push(`${forRangeMatch[1]}for (let ${forRangeMatch[2]} = ${forRangeMatch[3]}; ${forRangeMatch[2]} < ${forRangeMatch[4]}; ${forRangeMatch[2]}++) {`)
                const baseIndent = forRangeMatch[1].length
                let j = i + 1
                while (j < lines.length) {
                    const nextLine = lines[j]
                    const trimmed = nextLine.trim()
                    if (trimmed === '') { j++; continue }
                    const nextIndent = nextLine.match(/^(\s*)/)[1].length
                    if (nextIndent <= baseIndent) break
                    let transformed = nextLine
                    transformed = transformed.replace(/^(\s*)define\s+/, '$1const ')
                    output.push(transformed)
                    j++
                }
                output.push(`${forRangeMatch[1]}}`)
                i = j - 1
                continue
            }

            // Convert if blocks with indentation (Lume-style if without parens)
            const ifMatch = line.match(/^(\s*)if\s+(.+)$/)
            if (ifMatch && !line.includes('{') && !ifMatch[2].startsWith('(')) {
                const baseIndent = ifMatch[1].length
                const nextLine = i + 1 < lines.length ? lines[i + 1] : ''
                const nextTrimmed = nextLine.trim()
                const nextIndent = nextLine.match(/^(\s*)/)?.[1]?.length || 0

                if (nextTrimmed && nextIndent > baseIndent) {
                    // Block if — scan ahead for indented body, add closing }
                    output.push(`${ifMatch[1]}if (${ifMatch[2]}) {`)
                    let j = i + 1
                    while (j < lines.length) {
                        const bodyLine = lines[j]
                        const bodyTrimmed = bodyLine.trim()
                        if (bodyTrimmed === '') { output.push(bodyLine); j++; continue }
                        const bodyIndent = bodyLine.match(/^(\s*)/)[1].length
                        if (bodyIndent <= baseIndent) break
                        let transformed = bodyLine
                        transformed = transformed.replace(/^(\s*)define\s+/, '$1const ')
                        transformed = transformed.replace(/^(\s*)show\s+(.+)$/, '$1console.log($2)')
                        output.push(transformed)
                        j++
                    }
                    output.push(`${ifMatch[1]}}`)
                    i = j - 1
                } else {
                    // Inline if — pass through as-is
                    output.push(line)
                }
                continue
            }

            output.push(line)
        } else {
            // In multi-line string mode
            // Check for closing pattern: ", "identifier")
            const closeMatch = line.match(/^\"(,\s*\"[^"]*\"\s*\))$/)
            if (closeMatch) {
                // End of multi-line string
                const cssContent = multiLineBuffer.join('\n')
                output.push(`${multiLineVarPrefix}\``)
                output.push(cssContent)
                output.push(`\`${closeMatch[1]}`)
                inMultiLineString = false
                multiLineBuffer = []
                continue
            }
            multiLineBuffer.push(line)
        }
    }

    return output.join('\n')
}

// ── Lume Standard Library (Browser Runtime) ──
const STDLIB = `// Lume Compiled Bundle — Browser
// Zero Dependencies — Built with Lume
// Source: src/main.lume
// Generated by Lume Compiler v0.8.0

(function() {
"use strict";

// ═══ Lume Standard Library (Browser) ═══
const text = {
  upper: (s) => String(s).toUpperCase(),
  lower: (s) => String(s).toLowerCase(),
  trim: (s) => String(s).trim(),
  split: (s, sep) => String(s).split(sep),
  join: (arr, sep = ', ') => arr.join(sep),
  replace: (s, from, to) => String(s).replaceAll(from, to),
  contains: (s, sub) => String(s).includes(sub),
  length: (s) => String(s).length,
};

const math = {
  abs: Math.abs, ceil: Math.ceil, floor: Math.floor, round: Math.round,
  min: (...a) => Math.min(...a), max: (...a) => Math.max(...a),
  random: () => Math.random(),
  random_int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  clamp: (v, lo, hi) => Math.min(Math.max(v, lo), hi),
};

const list = {
  first: (a) => a[0], last: (a) => a[a.length - 1],
  map: (a, fn) => a.map(fn), filter: (a, fn) => a.filter(fn),
  range: (start, end) => { const r = []; for (let i = start; i < end; i++) r.push(i); return r; },
  count: (a) => a.length,
};

const dom = {
  create: (tag, opts = {}) => {
    const el = document.createElement(tag);
    if (opts.text) el.textContent = opts.text;
    if (opts.html) el.innerHTML = opts.html;
    if (opts.id) el.id = opts.id;
    if (opts.className) el.className = opts.className;
    if (opts.styles) Object.assign(el.style, opts.styles);
    if (opts.attrs) { for (const [k, v] of Object.entries(opts.attrs)) el.setAttribute(k, v); }
    if (opts.children) { for (const c of opts.children) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); }
    if (opts.onClick) el.addEventListener('click', opts.onClick);
    return el;
  },
  select: (s) => document.querySelector(s),
  select_all: (s) => [...document.querySelectorAll(s)],
  add_child: (p, c) => { if (typeof p === 'string') p = document.querySelector(p); if (typeof c === 'string') c = document.createTextNode(c); p.appendChild(c); return c; },
  set_text: (el, t) => { if (typeof el === 'string') el = document.querySelector(el); el.textContent = t; },
  set_html: (el, h) => { if (typeof el === 'string') el = document.querySelector(el); el.innerHTML = h; },
  set_style: (el, p, v) => { if (typeof el === 'string') el = document.querySelector(el); el.style[p] = v; },
  set_styles: (el, s) => { if (typeof el === 'string') el = document.querySelector(el); Object.assign(el.style, s); },
  add_class: (el, ...c) => { if (typeof el === 'string') el = document.querySelector(el); el.classList.add(...c); },
  remove_class: (el, ...c) => { if (typeof el === 'string') el = document.querySelector(el); el.classList.remove(...c); },
  toggle_class: (el, c) => { if (typeof el === 'string') el = document.querySelector(el); el.classList.toggle(c); },
  on: (el, ev, fn) => { if (typeof el === 'string') el = document.querySelector(el); el.addEventListener(ev, fn); },
  mount: (el, t) => { const p = t ? (typeof t === 'string' ? document.querySelector(t) : t) : document.body; p.appendChild(el); return el; },
  inject_css: (css, id) => {
    if (id) { const e = document.getElementById(id); if (e) { e.textContent = css; return e; } }
    const s = document.createElement('style'); if (id) s.id = id; s.textContent = css; document.head.appendChild(s); return s;
  },
  animate: (el, kf, opts = {}) => {
    if (typeof el === 'string') el = document.querySelector(el);
    return el.animate(kf, { duration: opts.duration || 1000, easing: opts.easing || 'ease', iterations: opts.iterations || 1, fill: opts.fill || 'forwards', delay: opts.delay || 0 });
  },
  remove: (el) => { if (typeof el === 'string') el = document.querySelector(el); if (el && el.parentNode) el.parentNode.removeChild(el); },
  clear: (el) => { if (typeof el === 'string') el = document.querySelector(el); while (el.firstChild) el.removeChild(el.firstChild); },
  ready: (fn) => { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); },
};

const state = {
  machine: (cfg) => {
    let cur = cfg.initial; const ls = [];
    return {
      get current() { return cur; },
      send(ev) { const sc = cfg.states[cur]; if (sc && sc.on && sc.on[ev]) { const nx = sc.on[ev]; const pv = cur; cur = typeof nx === 'string' ? nx : nx.target; if (typeof nx === 'object' && nx.action) nx.action(pv, cur); ls.forEach(fn => fn(cur, pv, ev)); } return cur; },
      on_change(fn) { ls.push(fn); },
    };
  },
  reactive: (init) => {
    let v = init; const ls = [];
    return {
      get: () => v,
      set: (nv) => { const o = v; v = nv; ls.forEach(fn => fn(v, o)); },
      on_change: (fn) => { ls.push(fn); },
      bind: (el) => { if (typeof el === 'string') el = document.querySelector(el); el.textContent = v; ls.push((nv) => { el.textContent = nv; }); },
    };
  },
};

// ═══ Application Code ═══

`

const FOOTER = `
})();
`

// ── Build ──
console.log('  ✦ Lume Browser Bundler')
console.log(`  Source: ${srcPath}`)
console.log(`  Output: ${distPath}`)

const appCode = transformLume(source)
const bundle = STDLIB + appCode + FOOTER

writeFileSync(distPath, bundle, 'utf-8')
console.log(`  ✓ Bundle written: ${(bundle.length / 1024).toFixed(1)} KB`)
console.log('  ✦ Done')
