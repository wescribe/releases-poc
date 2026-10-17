import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'

const REQUIRED = ['title', 'summary', 'date', 'version', 'hero']

export class ContentError extends Error {
  constructor(file, field) {
    super(`${file}: missing required front matter field "${field}"`)
    this.name = 'ContentError'
    this.file = file
    this.field = field
  }
}

function normalizeDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value)
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
    date: normalizeDate(data.date),
    version: String(data.version),
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
