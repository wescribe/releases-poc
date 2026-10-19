import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { buildSite } from '../build/site.js'
import { loadReleases } from '../build/content.js'
import { exportMarkdown } from '../build/export.js'

const fixtures = path.resolve('test/fixtures')

function contentDirWith(...names) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'poc-content-'))
  fs.mkdirSync(path.join(dir, 'releases'))
  fs.mkdirSync(path.join(dir, 'images', 'releases'), { recursive: true })
  fs.copyFileSync(path.join(fixtures, 'index.md'), path.join(dir, 'index.md'))
  for (const n of names) {
    fs.copyFileSync(path.join(fixtures, 'releases', n), path.join(dir, 'releases', n))
    fs.writeFileSync(path.join(dir, 'images', 'releases', n.replace('.md', '.svg')), '<svg xmlns="http://www.w3.org/2000/svg"/>')
  }
  return dir
}

let out, out1, content
const read = p => fs.readFileSync(path.join(out, p), 'utf8')
const read1 = p => fs.readFileSync(path.join(out1, p), 'utf8')
const exists = p => fs.existsSync(path.join(out, p))

before(async () => {
  content = contentDirWith('alpha.md', 'beta.md', 'gamma.md')
  out = fs.mkdtempSync(path.join(os.tmpdir(), 'poc-dist-'))
  await buildSite({ contentDir: content, outDir: out, base: '/poc/', siteUrl: 'https://example.test', gaId: 'G-TEST123' })
  out1 = fs.mkdtempSync(path.join(os.tmpdir(), 'poc-dist1-'))
  await buildSite({ contentDir: contentDirWith('alpha.md'), outDir: out1, base: '/' })
})

test('build writes every page and asset', () => {
  for (const p of ['index.html', 'releases/alpha/index.html', 'releases/alpha/alpha.md', 'releases/gamma/index.html', 'assets/styles.css', 'assets/theme.js', 'images/releases/alpha.svg']) {
    assert.ok(exists(p), p)
  }
})

test("release page order: hero, date, headline, summary, version, sections, what's new, footer", () => {
  const html = read('releases/alpha/index.html')
  const order = ['/poc/images/releases/alpha.svg', 'September 29, 2026', '<h1', 'Alpha summary.', 'Version 2.19.0', '<h2 id="first"', "What's new", 'Powered by WeScribe. © 2026.']
  let last = -1
  for (const s of order) {
    const i = html.indexOf(s, last + 1)
    assert.ok(i > last, `${s} should come after the previous marker (found at ${i}, previous at ${last})`)
    last = i
  }
  assert.match(html, /<title>Alpha headline · Spokenote release notes<\/title>/)
  assert.match(html, /<aside class="rail">[\s\S]*href="#first"[\s\S]*<a class="export-link" href="\/poc\/releases\/alpha\/alpha\.md" target="_blank" rel="noopener">View as markdown<\/a>[\s\S]*<\/aside>/)
  assert.doesNotMatch(html.split('<aside')[0], /View as markdown/)
  const rail = html.match(/<aside class="rail">[\s\S]*<\/aside>/)[0]
  assert.match(rail, /<button class="share-toggle"[^>]*aria-expanded="false"[^>]*>Share this page<\/button>/)
  assert.ok(rail.indexOf('Share this page') < rail.indexOf('View as markdown'), 'share comes before export')
  assert.match(rail, /<ul class="share-menu"[^>]*hidden[^>]*data-message="Alpha headline: Alpha summary\."[^>]*>/)
  for (const n of ['facebook', 'x', 'linkedin', 'whatsapp', 'telegram', 'email', 'sms']) assert.match(rail, new RegExp(`data-share="${n}"[^>]*><span class="share-icon"><svg`))
  assert.match(html, /<p class="version"><span class="version-pill">Version 2\.19\.0<\/span><\/p>/)
  assert.match(html, /href="\/poc\/assets\/styles\.css"/)
  assert.match(html, /<a class="wordmark" href="\/poc\/" aria-label="Spokenote release notes">\s*<svg[^>]*class="logo"/)
})

test("what's new is a carousel of every other release, newest first, with hidden prev and next buttons", () => {
  const html = read('releases/gamma/index.html')
  const section = html.split("What's new")[1]
  assert.match(section, /class="carousel"/)
  assert.match(section, /<button class="carousel-btn carousel-prev"[^>]*aria-label="Previous releases"[^>]*hidden/)
  assert.match(section, /<button class="carousel-btn carousel-next"[^>]*aria-label="Next releases"[^>]*hidden/)
  assert.ok(section.indexOf('releases/alpha/') < section.indexOf('releases/beta/'))
  assert.doesNotMatch(section, /releases\/gamma\//)
  assert.match(section, /href="\/poc\/"[^>]*>All releases/)
})

test('index has no intro heading, a hero card for the newest and a grid of the rest, newest first', () => {
  const html = read('index.html')
  assert.doesNotMatch(html, /class="intro"/)
  assert.doesNotMatch(html.split('<main>')[1], /why it matters/)
  assert.ok(html.indexOf('class="hero-card"') < html.indexOf('class="card-grid"'))
  assert.ok(html.indexOf('releases/alpha/') < html.indexOf('releases/beta/'))
  assert.ok(html.indexOf('releases/beta/') < html.indexOf('releases/gamma/'))
  assert.doesNotMatch(html, /2\.19\.0/)
  assert.match(html, /September 2026/)
})

test("a single release still builds, with no grid and no what's new row", () => {
  assert.doesNotMatch(read1('index.html'), /card-grid/)
  assert.match(read1('index.html'), /hero-card/)
  assert.doesNotMatch(read1('releases/alpha/index.html'), /What's new/)
})

test('a release without a version shows no version pill', async () => {
  const dir = contentDirWith('no-version.md')
  const o = fs.mkdtempSync(path.join(os.tmpdir(), 'poc-dist3-'))
  await buildSite({ contentDir: dir, outDir: o, base: '/' })
  const html = fs.readFileSync(path.join(o, 'releases/no-version/index.html'), 'utf8')
  assert.doesNotMatch(html, /version-pill/)
  assert.match(html, /September 8, 2026/)
})

test('release pages carry Open Graph and Twitter tags with the cover as the large image', () => {
  const html = read('releases/alpha/index.html')
  const head = html.split('</head>')[0]
  assert.match(head, /<meta property="og:type" content="article">/)
  assert.match(head, /<meta property="og:title" content="Alpha headline">/)
  assert.match(head, /<meta property="og:description" content="Alpha summary\.">/)
  assert.match(head, /<meta property="og:url" content="https:\/\/example\.test\/poc\/releases\/alpha\/">/)
  assert.match(head, /<meta property="og:image" content="https:\/\/example\.test\/poc\/images\/releases\/alpha\.svg">/)
  assert.match(head, /<meta property="og:site_name" content="Spokenote release notes">/)
  assert.match(head, /<meta property="article:published_time" content="2026-09-29">/)
  assert.match(head, /<meta name="twitter:card" content="summary_large_image">/)
  assert.match(head, /<meta name="twitter:title" content="Alpha headline">/)
  assert.match(head, /<meta name="twitter:image" content="https:\/\/example\.test\/poc\/images\/releases\/alpha\.svg">/)
  assert.match(head, /<link rel="canonical" href="https:\/\/example\.test\/poc\/releases\/alpha\/">/)
})

test('the index carries Open Graph and Twitter tags using the newest cover', () => {
  const head = read('index.html').split('</head>')[0]
  assert.match(head, /<meta property="og:type" content="website">/)
  assert.match(head, /<meta property="og:title" content="Spokenote release notes">/)
  assert.match(head, /<meta property="og:url" content="https:\/\/example\.test\/poc\/">/)
  assert.match(head, /<meta property="og:image" content="https:\/\/example\.test\/poc\/images\/releases\/alpha\.svg">/)
  assert.match(head, /<meta name="twitter:card" content="summary_large_image">/)
  assert.doesNotMatch(head, /article:published_time/)
})

test('every page loads the Google Analytics tag when a measurement id is configured', () => {
  for (const p of ['index.html', 'releases/alpha/index.html', 'releases/gamma/index.html']) {
    const head = read(p).split('</head>')[0]
    assert.match(head, /<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-TEST123"><\/script>/, p)
    assert.match(head, /gtag\('config', 'G-TEST123'\)/, p)
  }
})

test('pages built without a measurement id carry no analytics tag', () => {
  assert.doesNotMatch(read1('index.html'), /googletagmanager/)
})

test('the site script reports the custom analytics events', () => {
  const js = read('assets/theme.js')
  for (const name of ['toc_click', 'share', 'view_markdown', 'carousel_nav', 'theme_toggle']) assert.match(js, new RegExp(`track\\('${name}'`), name)
  assert.match(js, /typeof window\.gtag === 'function'/)
})

test('release pages name their release on the body for analytics', () => {
  assert.match(read('releases/alpha/index.html'), /<body data-release="alpha">/)
  assert.match(read('index.html'), /<body data-release="index">/)
})

test('every page links the favicon set and the favicon files are copied', () => {
  for (const p of ['index.html', 'releases/alpha/index.html']) {
    const head = read(p).split('</head>')[0]
    assert.match(head, /<link rel="icon" href="\/poc\/favicon\.ico" sizes="any">/, p)
    assert.match(head, /<link rel="apple-touch-icon" href="\/poc\/apple-touch-icon\.png">/, p)
  }
  for (const f of ['favicon.ico', 'apple-touch-icon.png']) assert.ok(exists(f), f)
})

test('robots.txt at the output root blocks every .md file', () => {
  const robots = read('robots.txt')
  assert.match(robots, /^User-agent: \*$/m)
  assert.match(robots, /^Disallow: \/\*\.md\$$/m)
})

test('the export beside the page matches exportMarkdown', async () => {
  const alpha = (await loadReleases(path.join(content, 'releases'))).find(r => r.slug === 'alpha')
  assert.equal(read('releases/alpha/alpha.md'), exportMarkdown(alpha))
})

test('content values are HTML-escaped in templates', async () => {
  const dir = contentDirWith('alpha.md')
  fs.writeFileSync(path.join(dir, 'releases', 'alpha.md'), fs.readFileSync(path.join(dir, 'releases', 'alpha.md'), 'utf8').replace('Alpha summary.', '"Links with # or & <b>bold</b>"'))
  const o = fs.mkdtempSync(path.join(os.tmpdir(), 'poc-dist2-'))
  await buildSite({ contentDir: dir, outDir: o, base: '/' })
  const html = fs.readFileSync(path.join(o, 'releases/alpha/index.html'), 'utf8')
  assert.match(html, /# or &amp; &lt;b&gt;bold&lt;\/b&gt;/)
})

test('stylesheet defines the accent token, dark theme and the 900px breakpoint', () => {
  const css = read('assets/styles.css')
  assert.match(css, /--accent:/)
  assert.match(css, /\[data-theme="dark"\]/)
  assert.match(css, /prefers-color-scheme: dark/)
  assert.match(css, /@media \(max-width: 900px\)/)
})

test('theme script toggles data-theme, persists to localStorage and runs a scroll-spy', () => {
  const js = read('assets/theme.js')
  assert.match(js, /localStorage/)
  assert.match(js, /data-theme/)
  assert.match(js, /IntersectionObserver/)
})
