import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderMarkdown } from '../build/render.js'

const base = { base: '/' }

test('columns render as a section with one div per column', () => {
  const { html } = renderMarkdown(':::::columns\n::::column\nLeft\n::::\n::::column\nRight\n::::\n:::::', base)
  assert.match(html, /<div class="columns columns-2">/)
  assert.equal(html.match(/<div class="column">/g).length, 2)
})

test('callout takes a type and defaults to note', () => {
  assert.match(renderMarkdown(':::callout{type=tip}\nHi\n:::', base).html, /class="callout callout-tip"/)
  assert.match(renderMarkdown(':::callout\nHi\n:::', base).html, /class="callout callout-note"/)
  assert.match(renderMarkdown(':::callout{type=bogus}\nHi\n:::', base).html, /class="callout callout-note"/)
})

test('unknown directives render visibly and warn', () => {
  const { html, warnings } = renderMarkdown(':::carousel\nHi\n:::', base)
  assert.match(html, /class="directive-unknown directive-carousel"/)
  assert.match(html, /Hi/)
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /carousel/)
})

test('columns with one or four children still render but warn', () => {
  const one = renderMarkdown(':::::columns\n::::column\nA\n::::\n:::::', base)
  assert.equal(one.warnings.length, 1)
  assert.match(one.html, /columns-1/)
  const four = renderMarkdown(':::::columns\n' + '::::column\nA\n::::\n'.repeat(4) + ':::::', base)
  assert.equal(four.warnings.length, 1)
  assert.match(four.html, /columns-4/)
})

test('level-two headings get unique ids and are collected', () => {
  const { html, headings } = renderMarkdown('## HubSpot\n\n## Pages\n\n## HubSpot\n\n### Not collected', base)
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
  assert.match(renderMarkdown('Values like # or & and <b>', base).html, /# or &#x26; and &#x3C;b>/)
})

test('inline colon text such as times of day is literal text, not a directive', () => {
  const { html, warnings } = renderMarkdown('Created at 12:24 PM, see :tip and ::leaf', base)
  assert.match(html, /12:24 PM, see :tip and ::leaf/)
  assert.deepEqual(warnings, [])
})

test('GFM tables and strikethrough render', () => {
  const { html } = renderMarkdown('| A | B |\n|---|---|\n| 1 | 2 |\n\n~~old~~', base)
  assert.match(html, /<table>/)
  assert.match(html, /<del>old<\/del>/)
})

const carousel = [
  '::::carousel-list',
  ':::item{image=/images/blocks/a.svg alt="Block A"}',
  '**Contact Card** with a photo.',
  ':::',
  ':::item{image=/images/blocks/b.svg alt="Block B"}',
  '**vCard** with one tap.',
  ':::',
  '::::',
].join('\n')

test('carousel-list renders a list of triggers and a stack of images, first item active', () => {
  const { html, warnings } = renderMarkdown(carousel, { base: '/poc/' })
  assert.deepEqual(warnings, [])
  assert.match(html, /<div class="carousel-list" data-carousel-list>/)
  assert.match(html, /<ol class="carousel-list-items">/)
  assert.equal(html.match(/<li class="carousel-list-item">/g).length, 2)
  assert.match(html, /<button class="carousel-list-trigger" type="button" aria-pressed="true" data-index="0"><strong>Contact Card<\/strong> with a photo\.<\/button>/)
  assert.match(html, /<button class="carousel-list-trigger" type="button" aria-pressed="false" data-index="1"><strong>vCard<\/strong> with one tap\.<\/button>/)
  assert.match(html, /<div class="carousel-list-visual">/)
  assert.match(html, /<img class="carousel-list-image" data-index="0" src="\/poc\/images\/blocks\/a\.svg" alt="Block A">/)
  assert.match(html, /<img class="carousel-list-image" data-index="1" src="\/poc\/images\/blocks\/b\.svg" alt="Block B" hidden>/)
  assert.doesNotMatch(html, /<p>/)
})

test('carousel-list warns on non-item children, a lone item, or an item without an image', () => {
  const stray = renderMarkdown('::::carousel-list\nLoose text\n:::item{image=/a.svg alt="A"}\nA\n:::\n:::item{image=/b.svg alt="B"}\nB\n:::\n::::', base)
  assert.equal(stray.warnings.length, 1)
  assert.match(stray.warnings[0], /item children/)
  assert.match(stray.html, /Loose text/)
  const lone = renderMarkdown('::::carousel-list\n:::item{image=/a.svg alt="A"}\nA\n:::\n::::', base)
  assert.equal(lone.warnings.length, 1)
  assert.match(lone.warnings[0], /at least two/)
  const noImage = renderMarkdown('::::carousel-list\n:::item\nA\n:::\n:::item{image=/b.svg alt="B"}\nB\n:::\n::::', base)
  assert.equal(noImage.warnings.length, 1)
  assert.match(noImage.warnings[0], /image/)
  assert.match(noImage.html, /<img class="carousel-list-image" data-index="0" src="" alt="">/)
})

test('an item outside a carousel-list is an unknown directive', () => {
  const { html, warnings } = renderMarkdown(':::item{image=/a.svg}\nA\n:::', base)
  assert.equal(warnings.length, 1)
  assert.match(html, /directive-unknown directive-item/)
})
