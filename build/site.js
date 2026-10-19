import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadReleases, loadIndex } from './content.js'
import { renderMarkdown } from './render.js'
import { exportMarkdown } from './export.js'
import { releasePage, indexPage } from './templates.js'

const SITE_DIR = fileURLToPath(new URL('../site/', import.meta.url))
const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url))   // copied to the output root as-is

async function exists(p) {
  try { await fs.access(p); return true } catch { return false }
}

async function write(file, text, pages) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, text)
  pages.push(file)
}

export async function buildSite({ contentDir, outDir, base = '/', siteUrl = 'http://localhost:4173', gaId = null }) {
  if (!base.endsWith('/')) base += '/'
  siteUrl = siteUrl.replace(/\/$/, '')
  const index = await loadIndex(path.join(contentDir, 'index.md'))
  const releases = await loadReleases(path.join(contentDir, 'releases'))

  await fs.rm(outDir, { recursive: true, force: true })
  await fs.mkdir(outDir, { recursive: true })
  await fs.cp(SITE_DIR, path.join(outDir, 'assets'), { recursive: true })
  if (await exists(PUBLIC_DIR)) await fs.cp(PUBLIC_DIR, outDir, { recursive: true })
  const imagesDir = path.join(contentDir, 'images')
  if (await exists(imagesDir)) await fs.cp(imagesDir, path.join(outDir, 'images'), { recursive: true })

  const pages = []
  const warnings = []
  for (const release of releases) {
    const { html, headings, warnings: w } = renderMarkdown(release.body, { base })
    warnings.push(...w.map(msg => `${release.slug}: ${msg}`))
    const related = releases.filter(r => r.slug !== release.slug)
    const dir = path.join(outDir, 'releases', release.slug)
    await write(path.join(dir, 'index.html'), releasePage({ release, html, headings, related, base, siteUrl, gaId }), pages)
    await write(path.join(dir, `${release.slug}.md`), exportMarkdown(release), pages)
  }

  await write(path.join(outDir, 'index.html'), indexPage({ index, releases, base, siteUrl, gaId }), pages)

  // Keep the markdown exports out of search results. Crawlers only read
  // robots.txt at the host root, so on a subpath host this file is advisory
  // unless it is also served from the root.
  await write(path.join(outDir, 'robots.txt'), 'User-agent: *\nDisallow: /*.md$\n', pages)

  return { pages, warnings }
}
