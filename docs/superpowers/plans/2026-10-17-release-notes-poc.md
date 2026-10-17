# WeScribe Release Notes POC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static release-notes site for Spokenote, built from markdown with layout directives, with a clean markdown export per page, deployed to GitHub Pages.

**Architecture:** A Node build script reads `content/releases/*.md`, renders each through a unified pipeline (remark-parse, remark-directive, a custom directive-to-HTML plugin, remark-rehype, rehype-stringify) into HTML pages assembled from template-literal functions, and runs the same parsed tree through an unwrapping plugin plus remark-stringify to produce the export. Output goes to `dist/`, served locally by a tiny dev server and deployed by GitHub Actions.

**Tech Stack:** Node 20, ES modules, `node:test` for tests, unified ecosystem (remark-parse, remark-directive, remark-rehype, remark-stringify, rehype-slug, rehype-stringify, unist-util-visit, mdast-util-to-string), gray-matter, plain CSS and vanilla JavaScript. No framework, no bundler.

**Spec:** `docs/superpowers/specs/2026-10-17-release-notes-poc-design.md`

## Global Constraints

- Node 20 or newer. `package.json` has `"type": "module"` and `"engines": {"node": ">=20"}`.
- Every link and asset URL is prefixed by a base path read from `process.env.BASE_PATH`, default `/`. GitHub Pages uses `/releases-poc/`.
- Footer copy on every page, exactly: `Powered by WeScribe. © 2026.`
- Version numbers and dates are secondary: never in a page title, headline, card title or `<title>`. The `<title>` of a release page is `<headline> · Spokenote release notes`.
- Callout `type` is one of `note`, `tip`, `warning`; anything else falls back to `note`.
- `columns` holds two or three `column` children. Anything else renders anyway with a build warning.
- Unknown directives render as `<div class="directive-unknown directive-<name>">` with a build warning. The build never fails on content.
- The export contains no `:::`, no `{`-attribute syntax and no HTML tags.
- Responsive breakpoint: `900px`. Below it, columns stack, the rail is hidden, card grids go to one column.
- No personal data in content, fixtures or placeholders.
- `dist/`, `node_modules/` and `.superpowers/` are never committed.
- Commit after every task with the attribution line `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

Inputs the spec implies but does not spell out. Each has a test in the task that owns the code.

1. A release file missing `title`, `summary`, `date`, `version` or `hero` must fail the build with an error naming the file and the field, never render the word `undefined`. (Task 1)
2. YAML parses `date: 2026-09-29` into a JavaScript `Date`; the loader must normalize it to the string `2026-09-29` so formatting never shifts by a day across time zones. (Task 1)
3. Content containing `&`, `<` or `>` (the v2.19.0 notes mention `# or &`) must be escaped in HTML and preserved verbatim in the export. (Tasks 2 and 3)
4. Two level-two headings with the same text on one page must get distinct ids so the rail links both. (Task 2)
5. A site with only one release must still build: the index has a hero card and no grid, and the "What's new" row is omitted when there are no other releases. (Task 4)

---

### Task 1: Project scaffold and content loader

**Files:**
- Create: `package.json`, `.nvmrc`
- Create: `build/content.js`
- Create: `test/fixtures/releases/alpha.md`, `test/fixtures/releases/beta.md`, `test/fixtures/releases/missing-hero.md`, `test/fixtures/index.md`
- Test: `test/content.test.js`

**Interfaces:**
- Produces: `loadReleases(dir: string): Promise<Release[]>` sorted newest first by `date`. `Release = { slug, title, summary, date, version, hero, body }` where `slug` is the file name without `.md`, `date` is an ISO `YYYY-MM-DD` string, `body` is the markdown after front matter.
- Produces: `loadIndex(file: string): Promise<{ title: string, intro: string }>` where `intro` is the markdown body.
- Produces: `formatDate(iso: string): string` → `September 29, 2026` and `formatMonth(iso: string): string` → `September 2026`, both using `Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ... })`.
- Produces: class `ContentError extends Error` with `file` and `field` properties.

- [ ] **Step 1: Create `package.json` and install dependencies**

Scripts: `"test": "node --test test/"`, `"build": "node build/index.js"`, `"dev": "node build/dev.js"`. Dependencies: `unified`, `remark-parse`, `remark-directive`, `remark-rehype`, `remark-stringify`, `rehype-slug`, `rehype-stringify`, `unist-util-visit`, `mdast-util-to-string`, `gray-matter`. No dev dependencies. Write `20` to `.nvmrc`.

Run: `npm install && npm test`
Expected: install succeeds; test run reports 0 tests.

- [ ] **Step 2: Write the fixtures**

`alpha.md`: front matter `title: Alpha headline`, `summary: Alpha summary.`, `date: 2026-09-29`, `version: 2.19.0`, `hero: /images/releases/alpha.svg`, body `## First\n\nHello.`. `beta.md`: same shape, `date: 2026-09-01`, `version: 2.18.0`. `missing-hero.md`: alpha without the `hero` line. `index.md`: front matter `title: Spokenote release notes`, body `What changed and why it matters.`

- [ ] **Step 3: Write the failing tests**

```js
test('loadReleases sorts newest first and normalizes date to a string', async () => {
  const releases = await loadReleases(fixtureDir)  // a temp dir holding alpha.md and beta.md only
  assert.deepEqual(releases.map(r => r.slug), ['alpha', 'beta'])
  assert.equal(releases[0].date, '2026-09-29')
  assert.equal(typeof releases[0].date, 'string')
  assert.equal(releases[0].body.trim(), '## First\n\nHello.')
})
test('loadReleases names the file and field when front matter is missing', async () => {
  await assert.rejects(loadReleases(dirWithMissingHero), err =>
    err instanceof ContentError && err.file.endsWith('missing-hero.md') && err.field === 'hero')
})
test('formatDate and formatMonth are UTC-safe', () => {
  assert.equal(formatDate('2026-09-29'), 'September 29, 2026')
  assert.equal(formatMonth('2026-07-14'), 'July 2026')
})
test('loadIndex returns title and intro', async () => {
  const index = await loadIndex(path.join(fixtures, 'index.md'))
  assert.equal(index.title, 'Spokenote release notes')
  assert.equal(index.intro.trim(), 'What changed and why it matters.')
})
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, module `build/content.js` not found.

- [ ] **Step 5: Implement `build/content.js`**

Use `gray-matter`. Validate the five required fields in order `title, summary, date, version, hero`, throwing `ContentError` on the first missing one. If `date` is a `Date`, convert with `toISOString().slice(0, 10)`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, 4 tests.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .nvmrc build/content.js test/
git commit -m "Add project scaffold and release content loader"
```

---

### Task 2: Directive rendering

**Files:**
- Create: `build/directives.js`, `build/render.js`
- Test: `test/render.test.js`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `renderMarkdown(markdown: string, { base: string }): { html: string, headings: { id: string, text: string }[], warnings: string[] }`. `headings` are the level-two headings in order. Any `src` or `href` beginning with `/` is rewritten to `base + path-without-leading-slash`.
- Produces: `remarkDirectivesToHtml` (remark plugin, in `directives.js`) that sets `data.hName` and `data.hProperties` on directive nodes and pushes warnings as `file.message(...)`.

- [ ] **Step 1: Write the failing tests**

```js
test('columns render as a section with one div per column', () => {
  const { html } = renderMarkdown(':::::columns\n::::column\nLeft\n::::\n::::column\nRight\n::::\n:::::', { base: '/' })
  assert.match(html, /<div class="columns columns-2">/)
  assert.equal(html.match(/<div class="column">/g).length, 2)
})
test('callout takes a type and defaults to note', () => {
  assert.match(renderMarkdown(':::callout{type=tip}\nHi\n:::', { base: '/' }).html, /class="callout callout-tip"/)
  assert.match(renderMarkdown(':::callout\nHi\n:::', { base: '/' }).html, /class="callout callout-note"/)
  assert.match(renderMarkdown(':::callout{type=bogus}\nHi\n:::', { base: '/' }).html, /class="callout callout-note"/)
})
test('unknown directives render visibly and warn', () => {
  const { html, warnings } = renderMarkdown(':::carousel\nHi\n:::', { base: '/' })
  assert.match(html, /class="directive-unknown directive-carousel"/)
  assert.match(html, /Hi/)
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /carousel/)
})
test('columns with one or four children still render but warn', () => {
  const one = renderMarkdown(':::::columns\n::::column\nA\n::::\n:::::', { base: '/' })
  assert.equal(one.warnings.length, 1)
  assert.match(one.html, /columns-1/)
})
test('level-two headings get unique ids and are collected', () => {
  const { html, headings } = renderMarkdown('## HubSpot\n\n## Pages\n\n## HubSpot\n\n### Not collected', { base: '/' })
  assert.deepEqual(headings.map(h => h.text), ['HubSpot', 'Pages', 'HubSpot'])
  assert.deepEqual(headings.map(h => h.id), ['hubspot', 'pages', 'hubspot-1'])
  assert.match(html, /<h2 id="hubspot-1">/)
})
test('absolute paths are prefixed with the base path', () => {
  const { html } = renderMarkdown('![x](/images/a.svg) [y](/releases/b/)', { base: '/releases-poc/' })
  assert.match(html, /src="\/releases-poc\/images\/a.svg"/)
  assert.match(html, /href="\/releases-poc\/releases\/b\/"/)
})
test('special characters are escaped', () => {
  assert.match(renderMarkdown('Values like # or & and <b>', { base: '/' }).html, /# or &#x26; and &#x3C;b>/)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, module `build/render.js` not found.

- [ ] **Step 3: Implement `build/directives.js`**

Export `remarkDirectivesToHtml`. Visit `containerDirective`, `leafDirective` and `textDirective` nodes. For `columns`: count `column` children, set `hName: 'div'`, `className: ['columns', 'columns-' + count]`, warn unless the count is 2 or 3 and every child is a `column` directive. For `column`: `div.column`. For `callout`: `div.callout.callout-<type>` with the fallback rule. Everything else: `div.directive-unknown.directive-<name>` plus a warning naming the directive.

- [ ] **Step 4: Implement `build/render.js`**

Pipeline: `remark-parse` → `remark-directive` → `remarkDirectivesToHtml` → `remark-rehype` → `rehype-slug` → a small inline rehype plugin that collects `h2` nodes into `headings` (text via `hast-util-to-string` or by walking text children) and rewrites root-relative `src`/`href` → `rehype-stringify`. Use `processSync`. Warnings come from `file.messages.map(String)`.

Note the escaping assertion in the last test: `rehype-stringify` emits `&#x26;` and `&#x3C;` by default. Keep those defaults.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, all tests from Tasks 1 and 2.

- [ ] **Step 6: Commit**

```bash
git add build/directives.js build/render.js test/render.test.js
git commit -m "Render layout directives to HTML"
```

---

### Task 3: Markdown export

**Files:**
- Create: `build/export.js`
- Test: `test/export.test.js`

**Interfaces:**
- Consumes: `Release` and `formatDate` from Task 1.
- Produces: `exportMarkdown(release: Release): string`.

- [ ] **Step 1: Write the failing tests**

```js
const release = { slug: 'a', title: 'Draft pages before you publish', summary: 'Work privately.', date: '2026-09-29', version: '2.19.0', hero: '/images/releases/a.svg', body }
test('export starts with headline, summary and one metadata line', () => {
  const out = exportMarkdown({ ...release, body: 'Body.' })
  assert.equal(out, '# Draft pages before you publish\n\nWork privately.\n\nReleased September 29, 2026 · Version 2.19.0\n\nBody.\n')
})
test('columns flatten in order and fences disappear', () => {
  const out = exportMarkdown({ ...release, body: ':::::columns\n::::column\n## Left\n\nL text\n::::\n::::column\nR text\n::::\n:::::' })
  assert.ok(out.indexOf('## Left') < out.indexOf('L text') && out.indexOf('L text') < out.indexOf('R text'))
  assert.doesNotMatch(out, /:::/)
})
test('callout keeps its inner markdown and drops the attribute', () => {
  const out = exportMarkdown({ ...release, body: ':::callout{type=tip}\n**Business only**\n\nDetails.\n:::' })
  assert.match(out, /\*\*Business only\*\*\n\nDetails\./)
  assert.doesNotMatch(out, /type=tip/)
})
test('export preserves special characters and contains no HTML', () => {
  const out = exportMarkdown({ ...release, body: 'Values like # or & break.' })
  assert.match(out, /# or & break/)
  assert.doesNotMatch(out, /<[a-z]/)
})
test('the hero image is not in the export', () => {
  assert.doesNotMatch(exportMarkdown({ ...release, body: 'Body.' }), /a\.svg/)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, module `build/export.js` not found.

- [ ] **Step 3: Implement `build/export.js`**

Parse with `remark-parse` + `remark-directive`. Apply an inline plugin that replaces every `containerDirective` and `textDirective` with its children (recursively, so nested directives unwrap too) and removes `leafDirective` nodes. Stringify with `remark-stringify` using `{ bullet: '-', emphasis: '_', strong: '*', rule: '-' }`. Prepend the header: `# ${title}`, blank line, summary, blank line, `Released ${formatDate(date)} · Version ${version}`, blank line. Ensure exactly one trailing newline.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add build/export.js test/export.test.js
git commit -m "Export release markdown with layout stripped"
```

---

### Task 4: Templates, build entry and dev server

**Files:**
- Create: `build/templates.js`, `build/index.js`, `build/site.js`, `build/dev.js`
- Create: `site/styles.css` (minimal, replaced in Task 7), `site/theme.js` (minimal, replaced in Task 7)
- Create: `content/index.md`
- Test: `test/site.test.js`

**Interfaces:**
- Consumes: `loadReleases`, `loadIndex`, `formatDate`, `formatMonth` (Task 1); `renderMarkdown` (Task 2); `exportMarkdown` (Task 3).
- Produces: `buildSite({ contentDir, outDir, base }): Promise<{ pages: string[], warnings: string[] }>` in `build/site.js`. `build/index.js` calls it with `contentDir = 'content'`, `outDir = 'dist'`, `base = process.env.BASE_PATH ?? '/'`, prints warnings to stderr, exits 0.
- Produces: in `build/templates.js`: `layout({ title, base, body, description })`, `releasePage({ release, html, headings, related, base })`, `indexPage({ index, releases, base })`, `releaseCard({ release, base })`, `escapeHtml(s)`. All return strings.
- Output paths: `dist/index.html`, `dist/releases/<slug>/index.html`, `dist/releases/<slug>/<slug>.md`, `dist/assets/styles.css`, `dist/assets/theme.js`, `dist/images/**` copied from `content/images/`.

- [ ] **Step 1: Write `content/index.md`**

Front matter `title: Spokenote release notes`. Body, two sentences: `What's new in Spokenote, and why it matters to you. Each release gets a short tour of the changes that affect how you work.`

- [ ] **Step 2: Write the failing tests**

Build the Task 1 fixtures (alpha, beta, plus a third `gamma.md` dated `2026-07-14`) into a temp dir with `base: '/poc/'`, then assert:

```js
test('build writes every page and asset', () => {
  for (const p of ['index.html', 'releases/alpha/index.html', 'releases/alpha/alpha.md', 'assets/styles.css', 'assets/theme.js']) assert.ok(exists(path.join(out, p)), p)
})
test('release page order: hero, date, headline, summary, version, sections, what\'s new, footer', () => {
  const html = read('releases/alpha/index.html')
  const order = ['/poc/images/releases/alpha.svg', 'September 29, 2026', '<h1', 'Alpha summary.', 'Version 2.19.0', '<h2 id="first"', 'What\'s new', 'Powered by WeScribe. © 2026.']
  let last = -1
  for (const s of order) { const i = html.indexOf(s); assert.ok(i > last, s); last = i }
  assert.match(html, /<title>Alpha headline · Spokenote release notes<\/title>/)
  assert.match(html, /href="\/poc\/releases\/alpha\/alpha\.md"[^>]*>View as markdown/)
  assert.match(html, /href="#first"/)                               // rail entry
  assert.match(html, /href="\/poc\/assets\/styles\.css"/)
  assert.match(html, /<a[^>]*href="\/poc\/"[^>]*>[^<]*Spokenote/)    // wordmark links home
})
test('what\'s new shows the two most recent other releases and links to the index', () => {
  const html = read('releases/gamma/index.html')
  assert.match(html, /releases\/alpha\//); assert.match(html, /releases\/beta\//)
  assert.doesNotMatch(html.split('What\'s new')[1], /releases\/gamma\//)
})
test('index has intro, a hero card for the newest and a grid of the rest, newest first', () => {
  const html = read('index.html')
  assert.match(html, /why it matters to you/)
  assert.ok(html.indexOf('class="hero-card"') < html.indexOf('class="card-grid"'))
  assert.ok(html.indexOf('releases/alpha/') < html.indexOf('releases/beta/') && html.indexOf('releases/beta/') < html.indexOf('releases/gamma/'))
  assert.doesNotMatch(html, /2\.19\.0/)   // no version numbers on the index
})
test('a single release still builds, with no grid and no what\'s new row', () => {
  // build a dir containing only alpha.md
  assert.doesNotMatch(read1('index.html'), /card-grid/)
  assert.doesNotMatch(read1('releases/alpha/index.html'), /What's new/)
})
test('the export beside the page matches exportMarkdown', () => {
  assert.equal(read('releases/alpha/alpha.md'), exportMarkdown(alphaRelease))
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, module `build/site.js` not found.

- [ ] **Step 4: Implement `build/templates.js`**

Template literals with `escapeHtml` on every interpolated content value. `layout` emits `<!doctype html>`, `<html lang="en">`, viewport meta, `<title>`, stylesheet link, an inline script in `<head>` that reads `localStorage.theme` and sets `data-theme` on `<html>` before paint, the top bar (`<a class="wordmark" href="${base}">Spokenote</a>` and `<button class="theme-toggle" aria-label="Toggle dark mode">`), `<main>`, the footer `<footer>Powered by WeScribe. © 2026.</footer>`, and `<script src="${base}assets/theme.js" defer>`. `releasePage` lays out `<img class="hero" src alt="">`, `<p class="eyebrow">`, `<h1>`, `<p class="lead">`, `<p class="version">Version X</p>` wrapped with the article and an `<aside class="rail">` holding `<nav aria-label="On this page">` with one link per heading, then `<section class="whats-new">` only when `related.length > 0`, with `releaseCard` per item and `<a href="${base}">All releases</a>`. `indexPage` renders intro HTML (via `renderMarkdown`), `<article class="hero-card">` for `releases[0]`, and `<div class="card-grid">` only when `releases.length > 1`. Cards show month via `formatMonth`, never the version.

- [ ] **Step 5: Implement `build/site.js` and `build/index.js`**

`buildSite`: load index and releases, empty and recreate `outDir`, copy `site/*` to `assets/` and `content/images` to `images/` (skip if absent), render each release, compute `related` as the two most recent releases other than the current one, write pages and exports, write `index.html`. Return written paths and all warnings prefixed with the slug.

- [ ] **Step 6: Implement `build/dev.js`**

Build once, then `fs.watch` (recursive) on `content/`, `site/` and `build/`, rebuilding on change with a 100ms debounce. Serve `dist/` on `http://localhost:4173` with `node:http`: map `/` and any path ending in `/` to `index.html`, set content types for `.html .css .js .svg .md .png`, 404 otherwise. Print the URL.

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Smoke-run the real build**

Run: `npm run build && ls dist`
Expected: `index.html assets images` (no release folders yet, since `content/releases/` is empty; the build must not fail on zero releases, it writes an index with the intro only).

- [ ] **Step 9: Commit**

```bash
git add build/ site/ content/index.md test/site.test.js
git commit -m "Assemble pages, build to dist, add dev server"
```

---

### Task 5: Placeholder images

**Files:**
- Create: `scripts/make-placeholder.js`
- Create: `content/images/releases/*.svg` (one 16:9 hero per release slug, plus in-page `*-shot-1.svg`, `*-shot-2.svg` where Task 6 needs them)
- Test: `test/placeholder.test.js`

**Interfaces:**
- Produces: `placeholderSvg({ seed: string, width: number, height: number, label?: string }): string` exported from the script module, and a CLI: `node scripts/make-placeholder.js <seed> <out.svg> [--ratio 16:9|4:3] [--label "text"]`.

- [ ] **Step 1: Write the failing test**

```js
test('placeholderSvg is deterministic, sized, and contains no external references', () => {
  const a = placeholderSvg({ seed: 'draft-pages', width: 1600, height: 900 })
  assert.equal(a, placeholderSvg({ seed: 'draft-pages', width: 1600, height: 900 }))
  assert.notEqual(a, placeholderSvg({ seed: 'other', width: 1600, height: 900 }))
  assert.match(a, /viewBox="0 0 1600 900"/)
  assert.doesNotMatch(a, /https?:/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement the generator**

Hash the seed to pick two hues from a fixed palette of soft greens, blues and ambers that sit well with the accent, draw a gradient background, three to five large translucent rounded shapes or circles positioned from the hash, and an optional label in a system sans-serif at the bottom left. Abstract, no text unless `--label` is given. 16:9 is 1600×900, 4:3 is 1200×900.

- [ ] **Step 4: Run test to verify it passes, then generate the images**

Run: `npm test`
Expected: PASS.

Run the CLI once per release slug Task 6 will use (see that task's file names) for the hero, and once per in-page image Task 6 references.

- [ ] **Step 5: Commit**

```bash
git add scripts/make-placeholder.js content/images test/placeholder.test.js
git commit -m "Add deterministic SVG placeholder generator and images"
```

---

### Task 6: Author the release content

**Files:**
- Create: `content/releases/draft-pages-before-you-publish.md` (v2.19.0), `content/releases/instant-win-sweepstakes.md` (v2.18.0), `content/releases/chat-support-and-integration-health.md` (v2.17.0)
- Test: `test/content-integrity.test.js`

**Interfaces:**
- Consumes: the source texts in `content/source/*.txt`, `renderMarkdown`, `exportMarkdown`, `loadReleases`.

Rules for authoring, from the spec: the source file is the truth. Add a customer-facing headline (`title`) and a one-sentence `summary`. Tighten wording for a non-technical customer, but every item in the source must appear. Keep each item's lead-in phrase (the text before the first ` - ` on a source line) verbatim as bold text or a heading, so the integrity test can find it. Use `:::::columns` with `::::column` for side-by-side sections and `:::callout{type=...}` for asides. Reference images as `/images/releases/<slug>-shot-N.svg`. Use the v2.19.0 split from the spec's "Left to the builder" section as the pattern.

- [ ] **Step 1: Write the failing integrity test**

```js
const pairs = [['v2.19.0', 'draft-pages-before-you-publish'], ['v2.18.0', 'instant-win-sweepstakes'], ['v2.17.0', 'chat-support-and-integration-health']]
for (const [version, slug] of pairs) {
  test(`${slug}: every source lead-in survives into the export, and the render is clean`, async () => {
    const release = (await loadReleases('content/releases')).find(r => r.slug === slug)
    assert.ok(release, 'release exists')
    assert.equal(release.version, version.slice(1))
    const source = fs.readFileSync(`content/source/${version}.txt`, 'utf8')
    const leadIns = [...source.matchAll(/^(.+?) - /gm)].map(m => m[1].trim()).filter(s => s.length > 2)
    const exported = exportMarkdown(release).toLowerCase()
    for (const lead of leadIns) assert.ok(exported.includes(lead.toLowerCase()), `missing: ${lead}`)
    const { warnings } = renderMarkdown(release.body, { base: '/' })
    assert.deepEqual(warnings, [])
    assert.doesNotMatch(release.title, /\d\.\d/)   // headline has no version number
    for (const img of release.body.matchAll(/!\[[^\]]*\]\(\/(images[^)]+)\)/g)) assert.ok(fs.existsSync(`content/${img[1]}`), img[1])
    assert.ok(fs.existsSync(`content${release.hero}`), release.hero)
  })
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL, releases not found.

- [ ] **Step 3: Write `draft-pages-before-you-publish.md`**

Front matter: title `Draft pages before you publish`, summary `Work on a page or a whole campaign privately, publish when you're ready, and edit live pages without disturbing what visitors see.`, date `2026-09-29`, version `2.19.0`, hero `/images/releases/draft-pages-before-you-publish.svg`. Sections, in order: Page Drafting as two columns (text left; image `-shot-1.svg` and a `tip` callout "Business workspaces only" right, with "Dynamic content survives a save" under it); Page Editing single column with two `###` items; Full-screen editing layout as two columns, image `-shot-2.svg` first; Navigation and Campaigns as two columns; Integrations and Media Library as two columns; Bug Fixes single column list; Behind the Scenes as a `note` callout containing a list.

- [ ] **Step 4: Write `instant-win-sweepstakes.md`**

Front matter: title `Run instant-win sweepstakes from a QR code`, summary `Scan, confirm your age, and find out on the spot. Sweepstakes are now available to every organization, with fairness and fraud checks built in.`, date `2026-09-01`, version `2.18.0`. Sections: Sweepstakes as two columns (the seven items split across the two columns, with "Built to be provably fair" and "Nothing can be faked or double-counted" in a `tip` callout); Campaigns and HubSpot as two columns; Pages and Block Editor as two columns; Dashboard and Users as two columns; Bug Fixes single column. Replace the sponsor's name with "a national sponsor" in the lead sentence only; this is wording for a customer audience, not a dropped item.

- [ ] **Step 5: Write `chat-support-and-integration-health.md`**

Front matter: title `Chat support, a knowledge base link, and integration health at a glance`, summary `Reach support and the knowledge base from your profile menu, and see and fix integration connections yourself.`, date `2026-07-14`, version `2.17.0`. Sections: Support as two columns (Chat Support and Knowledge Base one per column); Campaigns created by integrations and Integration Settings as two columns; Access Page and Workspace Users List single column; Bug fixes single column list. Omit the sentence about this being the last release before a partner deal; it is internal scheduling, not a change, and the integrity test does not treat it as an item.

- [ ] **Step 6: Generate any images the three files reference**

Run the Task 5 CLI for each `hero` and each `-shot-N.svg` referenced, with labels like `Editor with Save Draft and Publish`.

- [ ] **Step 7: Run tests to verify they pass, then build and look**

Run: `npm test && npm run dev`
Expected: PASS; open `http://localhost:4173/` and each release page; every section renders, no `directive-unknown` class in the HTML (`grep -r directive-unknown dist` prints nothing).

- [ ] **Step 8: Commit**

```bash
git add content/releases content/images test/content-integrity.test.js
git commit -m "Author the three Spokenote releases as sectioned markdown"
```

---

### Task 7: Styling, theme toggle, rail scroll-spy, responsive layout

**Files:**
- Modify: `site/styles.css`, `site/theme.js`
- Modify: `build/templates.js` only if a class hook is missing
- Test: `test/site.test.js` (add two assertions)

**Interfaces:**
- Consumes: the class names from Task 4: `.wordmark .theme-toggle .hero .eyebrow .lead .version .rail .columns .columns-2 .columns-3 .column .callout .callout-note .callout-tip .callout-warning .directive-unknown .whats-new .hero-card .card-grid .card`.

- [ ] **Step 1: Add the failing assertions to `test/site.test.js`**

```js
test('stylesheet defines the accent token, dark theme and the 900px breakpoint', () => {
  const css = read('assets/styles.css')
  assert.match(css, /--accent:/)
  assert.match(css, /\[data-theme="dark"\]/)
  assert.match(css, /prefers-color-scheme: dark/)
  assert.match(css, /@media \(max-width: 900px\)/)
})
test('theme script toggles data-theme and persists to localStorage', () => {
  const js = read('assets/theme.js')
  assert.match(js, /localStorage/); assert.match(js, /data-theme/); assert.match(js, /IntersectionObserver/)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: the two new tests FAIL.

- [ ] **Step 3: Write `site/styles.css`**

Tokens on `:root`: `--accent: #16a34a`, surface, text, muted, border, callout tints for the three types. Dark values under `:root[data-theme="dark"]` and under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`. System sans-serif stack, 16px base, 1.6 line height, `max-width: 720px` content column, rail `width: 200px; position: sticky; top: 24px`, page grid `grid-template-columns: minmax(0, 720px) 200px` centered. `.hero { aspect-ratio: 16 / 9; width: 100%; border-radius: 12px }`. `.columns { display: grid; gap: 24px }` with `.columns-2` and `.columns-3` column counts. `.callout` padded 16px, radius 10px, 3px left border in the type color. `.directive-unknown` gets a dashed red outline so it is impossible to miss. `.hero-card` two-column grid; `.card-grid` two columns. `@media (max-width: 900px)`: `.columns, .hero-card, .card-grid { grid-template-columns: 1fr }`, `.rail { display: none }`, page grid single column, 16px side gutters.

- [ ] **Step 4: Write `site/theme.js`**

Toggle: on click, read current `data-theme` (or resolve from `matchMedia`), set the opposite on `document.documentElement`, save to `localStorage.theme`. Scroll-spy: `IntersectionObserver` on every `main h2[id]` with `rootMargin: '0px 0px -70% 0px'`; add `.active` to the rail link whose hash matches the topmost intersecting heading. Guard every `localStorage` access with try/catch.

- [ ] **Step 5: Run tests, then check by eye**

Run: `npm test && npm run dev`
Expected: PASS. In the browser: toggle dark mode and reload (choice sticks); scroll a release page (rail highlight follows); narrow the window below 900px (columns stack, rail disappears, cards stack); check the index and a release page on a phone-sized viewport in devtools.

- [ ] **Step 6: Commit**

```bash
git add site/ test/site.test.js
git commit -m "Style the site, add theme toggle, scroll-spy and responsive rules"
```

---

### Task 8: GitHub Pages deployment

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `npm ci`, `npm test`, `BASE_PATH=/releases-poc/ npm run build`, output `dist/`.

- [ ] **Step 1: Write the workflow**

Trigger on `push` to `main` and `workflow_dispatch`. Permissions `contents: read`, `pages: write`, `id-token: write`. One `build` job: `actions/checkout@v4`, `actions/setup-node@v4` with `node-version-file: .nvmrc` and `cache: npm`, `npm ci`, `npm test`, `BASE_PATH=/releases-poc/ npm run build`, `actions/upload-pages-artifact@v3` with `path: dist`. One `deploy` job needing `build`, environment `github-pages`, running `actions/deploy-pages@v4`. Concurrency group `pages`, `cancel-in-progress: true`.

- [ ] **Step 2: Verify the base-path build locally**

Run: `BASE_PATH=/releases-poc/ npm run build && grep -c 'href="/releases-poc/assets/styles.css"' dist/index.html`
Expected: `1`.

- [ ] **Step 3: Check the repository is public and Pages is set to GitHub Actions**

Run: `gh repo view wescribe/releases-poc --json visibility -q .visibility`
Expected: `PUBLIC`. If `PRIVATE`, stop and tell the product owner; do not change visibility yourself.

Run: `gh api repos/wescribe/releases-poc/pages -q .build_type`
Expected: `workflow`. If it returns 404, enable it: `gh api -X POST repos/wescribe/releases-poc/pages -f build_type=workflow`.

- [ ] **Step 4: Commit, push, and verify the live site**

```bash
git add .github/workflows/deploy.yml
git commit -m "Deploy to GitHub Pages with GitHub Actions"
git push
gh run watch
```

Then: `curl -sI https://wescribe.github.io/releases-poc/ | head -1`
Expected: `HTTP/2 200`. Open the URL and click through the index, a release page and its "View as markdown" link.

---

### Task 9: README and editor approach document

**Files:**
- Modify: `README.md`
- Create: `docs/editor-approach.md`
- Modify: `IDEAS.md` (add a `## Blocks` heading listing the planned block types if the README points there; otherwise leave as is)

**Interfaces:**
- Consumes: the format and export rules exactly as implemented in Tasks 2 and 3, and the live URL from Task 8.

- [ ] **Step 1: Write `README.md`**

Audience: WeScribe engineers and product. Sections, in order: what this is and the live URL; quick start (`nvm use`, `npm install`, `npm run dev`, `npm test`, `npm run build`); the content model (page, section, slot, block); the stored format with the front matter fields and one real directive example copied from a release file; the export rules as five numbered points; "Format options considered" with a subsection each for fenced directives, MDX-style components and HTML comment markers, giving pros, cons, and a closing paragraph on why fences won; planned block types (carousel, feature card, image with caption, modal behavior on any block) marked as not built; project layout; how deployment works and the base-path rule; a pointer to `docs/editor-approach.md`, `IDEAS.md` and the design spec.

- [ ] **Step 2: Write `docs/editor-approach.md`**

Audience: the WeScribe team deciding how to build the real editor. Sections: the product requirements the editor must meet (section and block model, layouts from a menu, slash commands and drag-and-drop later, AI-drafted content the author tweaks, lossless round trip to the directive markdown); option one, an off-the-shelf editor framework, comparing ProseMirror, Tiptap and Lexical on schema flexibility for nested containers, markdown serialization, collaboration support, React fit, license and ecosystem; option two, a custom editor built with AI assistance, covering what "from scratch" really means on top of `contenteditable`, the hidden costs (selection, undo history, IME input, paste sanitizing, accessibility), and where AI help does and does not change the math; a comparison table; a recommendation; and the questions that would change it. Cite official documentation URLs for each library. No invented benchmark numbers.

- [ ] **Step 3: Check both documents against the code**

Run: `npm test` and read each code claim in the README against `build/` and `test/`.
Expected: every example in the README builds under the current parser; copy one into a scratch file under `content/releases/`, run `npm run build`, confirm no warnings, then delete the scratch file.

- [ ] **Step 4: Commit and push**

```bash
git add README.md docs/editor-approach.md IDEAS.md
git commit -m "Document the format, the alternatives and the editor approach"
git push
```

---

## Self-review notes

- Spec coverage: content model and directives (Task 2), export (Task 3), pages and frame (Task 4), responsive and theming (Task 7), placeholders (Task 5), content (Task 6), build and dev (Task 4), deploy and base path (Task 8), documents (Task 9), IDEAS.md already exists. All three supplied releases are in Task 6. Adding a future release is a repeat of Task 6 steps 3 to 8 for one file.
- Names used across tasks: `loadReleases`, `loadIndex`, `formatDate`, `formatMonth`, `ContentError`, `renderMarkdown`, `remarkDirectivesToHtml`, `exportMarkdown`, `buildSite`, `layout`, `releasePage`, `indexPage`, `releaseCard`, `escapeHtml`, `placeholderSvg`. Class names listed once in Task 7.
- Review Focus items 1 and 2 are tested in Task 1, 3 in Tasks 2 and 3, 4 in Task 2, 5 in Task 4.
