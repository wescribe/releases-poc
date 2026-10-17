#!/usr/bin/env node
// Deterministic abstract SVG placeholders for hero visuals and in-page images.
// Usage: node scripts/make-placeholder.js <seed> <out.svg> [--ratio 16:9|4:3] [--label "text"]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Soft pairs that sit well with the green accent: [from, to, shape]
const PALETTES = [
  ['#dbeafe', '#dcfce7', '#86efac'],
  ['#dcfce7', '#fef9c3', '#fde68a'],
  ['#e0f2fe', '#ede9fe', '#c4b5fd'],
  ['#fef3c7', '#fce7f3', '#f9a8d4'],
  ['#ecfdf5', '#cffafe', '#67e8f9'],
  ['#f0fdf4', '#e0e7ff', '#a5b4fc'],
]

function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h
}

function rng(seed) {
  let state = hash(seed) || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function escapeXml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

export function placeholderSvg({ seed, width, height, label }) {
  const next = rng(seed)
  const [from, to, shape] = PALETTES[hash(seed) % PALETTES.length]
  const angle = Math.round(next() * 360)
  const count = 3 + Math.floor(next() * 3)
  const shapes = []
  for (let i = 0; i < count; i++) {
    const r = Math.round(height * (0.18 + next() * 0.32))
    const cx = Math.round(next() * width)
    const cy = Math.round(next() * height)
    const opacity = (0.25 + next() * 0.35).toFixed(2)
    if (next() < 0.5) {
      shapes.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${shape}" opacity="${opacity}"/>`)
    } else {
      const w = r * 2
      const h = Math.round(r * (0.6 + next() * 0.8))
      shapes.push(`<rect x="${cx - r}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${Math.round(h * 0.25)}" fill="${shape}" opacity="${opacity}"/>`)
    }
  }
  const text = label
    ? `<text x="${Math.round(width * 0.05)}" y="${Math.round(height * 0.92)}" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="${Math.round(height * 0.045)}" font-weight="600" fill="#0f172a" opacity="0.7">${escapeXml(label)}</text>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(label ?? 'Placeholder visual')}">
<defs><linearGradient id="g" gradientTransform="rotate(${angle} 0.5 0.5)"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="${width}" height="${height}" fill="url(#g)"/>
${shapes.join('\n')}
${text}
</svg>
`
}

const RATIOS = { '16:9': [1600, 900], '4:3': [1200, 900] }

function main(argv) {
  const [seed, out, ...rest] = argv
  if (!seed || !out) {
    console.error('Usage: node scripts/make-placeholder.js <seed> <out.svg> [--ratio 16:9|4:3] [--label "text"]')
    process.exit(1)
  }
  let ratio = '16:9'
  let label
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--ratio') ratio = rest[++i]
    else if (rest[i] === '--label') label = rest[++i]
  }
  const dims = RATIOS[ratio]
  if (!dims) {
    console.error(`Unknown ratio "${ratio}". Use 16:9 or 4:3.`)
    process.exit(1)
  }
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, placeholderSvg({ seed, width: dims[0], height: dims[1], label }))
  console.log(`wrote ${out}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2))
