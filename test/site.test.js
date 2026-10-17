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
  await buildSite({ contentDir: content, outDir: out, base: '/poc/' })
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
  assert.match(html, /href="\/poc\/releases\/alpha\/alpha\.md"[^>]*>View as markdown/)
  assert.match(html, /href="#first"/)
  assert.match(html, /href="\/poc\/assets\/styles\.css"/)
  assert.match(html, /<a[^>]*href="\/poc\/"[^>]*>[^<]*Spokenote/)
})

test("what's new shows the two most recent other releases and links to the index", () => {
  const html = read('releases/gamma/index.html')
  const section = html.split("What's new")[1]
  assert.match(section, /releases\/alpha\//)
  assert.match(section, /releases\/beta\//)
  assert.doesNotMatch(section, /releases\/gamma\//)
  assert.match(section, /href="\/poc\/"[^>]*>All releases/)
})

test('index has intro, a hero card for the newest and a grid of the rest, newest first', () => {
  const html = read('index.html')
  assert.match(html, /why it matters/)
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
