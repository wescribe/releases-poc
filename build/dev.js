import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { buildSite } from './site.js'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const dist = path.join(root, 'dist')
const port = Number(process.env.PORT ?? 4173)
const base = process.env.BASE_PATH ?? '/'
const siteUrl = process.env.SITE_URL ?? 'http://localhost:4173'
const gaId = process.env.GA_ID || null   // analytics stays off in development unless asked for

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

async function build() {
  try {
    const { pages, warnings } = await buildSite({ contentDir: path.join(root, 'content'), outDir: dist, base, siteUrl, gaId })
    for (const w of warnings) console.error(`warning: ${w}`)
    console.log(`[${new Date().toLocaleTimeString()}] built ${pages.length} files`)
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] build failed: ${err.message}`)
  }
}

let timer
function scheduleBuild() {
  clearTimeout(timer)
  timer = setTimeout(build, 100)
}

await build()
for (const dir of ['content', 'site', 'client', 'build']) {
  fs.watch(path.join(root, dir), { recursive: true }, scheduleBuild)
}

http.createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, `http://localhost:${port}`).pathname)
  if (base !== '/' && pathname.startsWith(base.slice(0, -1))) pathname = pathname.slice(base.length - 1) || '/'
  if (pathname.endsWith('/')) pathname += 'index.html'
  const file = path.join(dist, path.normalize(pathname))
  if (!file.startsWith(dist)) { res.writeHead(403); return res.end() }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('Not found') }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
    res.end(data)
  })
}).listen(port, () => console.log(`Serving dist/ at http://localhost:${port}${base}`))
