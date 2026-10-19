import path from 'node:path'
import { buildSite } from './site.js'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const base = process.env.BASE_PATH ?? '/'
const siteUrl = process.env.SITE_URL ?? 'http://localhost:4173'
const gaId = process.env.GA_ID ?? 'G-WSD6JG3B8B'

const { pages, warnings } = await buildSite({
  contentDir: path.join(root, 'content'),
  outDir: path.join(root, 'dist'),
  base,
  siteUrl,
  gaId: gaId || null,
})

for (const w of warnings) console.error(`warning: ${w}`)
console.log(`Built ${pages.length} files into dist/ with base path ${base}${warnings.length ? ` (${warnings.length} warning${warnings.length === 1 ? '' : 's'})` : ''}`)
