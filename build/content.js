import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'

const REQUIRED = ['title', 'summary', 'date', 'version', 'hero']

export class ContentError extends Error {
  constructor(file, field, reason = `missing required front matter field "${field}"`) {
    super(`${file}: ${reason}`)
    this.name = 'ContentError'
    this.file = file
    this.field = field
  }
}

const DAY = /^\d{4}-\d{2}-\d{2}$/

// YAML reads "2026-09-29" as a Date at UTC midnight. Anything else (a time,
// a time zone, or words) is a mistake we refuse rather than shift silently.
function normalizeDate(value, file) {
  let day
  if (value instanceof Date) {
    if (value.getUTCHours() || value.getUTCMinutes() || value.getUTCSeconds()) {
      throw new ContentError(file, 'date', `front matter "date" must be a plain day in YYYY-MM-DD form, not a time`)
    }
    day = value.toISOString().slice(0, 10)
  } else {
    day = String(value).trim()
  }
  if (!DAY.test(day) || Number.isNaN(Date.parse(`${day}T00:00:00Z`))) {
    throw new ContentError(file, 'date', `front matter "date" must be a plain day in YYYY-MM-DD form`)
  }
  return day
}

// YAML reads "version: 2.10" as the number 2.1. Take the text as written.
function rawVersion(raw, parsed) {
  const match = raw.match(/^version:[ \t]*(.+?)[ \t]*$/m)
  const text = match ? match[1].replace(/^["']|["']$/g, '') : String(parsed)
  return text
}

async function readRelease(file) {
  const raw = await fs.readFile(file, 'utf8')
  const { data, content } = matter(raw)
  for (const field of REQUIRED) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new ContentError(file, field)
    }
  }
  return {
    slug: path.basename(file, '.md'),
    title: String(data.title),
    summary: String(data.summary),
    date: normalizeDate(data.date, file),
    version: rawVersion(raw, data.version),
    hero: String(data.hero),
    body: content,
  }
}

export async function loadReleases(dir) {
  let names = []
  try {
    names = (await fs.readdir(dir)).filter(n => n.endsWith('.md')).sort()
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }
  const releases = await Promise.all(names.map(n => readRelease(path.join(dir, n))))
  return releases.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export async function loadIndex(file) {
  const raw = await fs.readFile(file, 'utf8')
  const { data, content } = matter(raw)
  return { title: String(data.title ?? 'Release notes'), intro: content }
}

const dateFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })
const monthFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long' })

function toUtcDate(iso) {
  return new Date(`${iso}T00:00:00Z`)
}

export function formatDate(iso) {
  return dateFormat.format(toUtcDate(iso))
}

export function formatMonth(iso) {
  return monthFormat.format(toUtcDate(iso))
}
