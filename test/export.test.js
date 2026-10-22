import { test } from 'node:test'
import assert from 'node:assert/strict'
import { exportMarkdown } from '../build/export.js'

const release = { slug: 'a', title: 'Draft pages before you publish', summary: 'Work privately.', date: '2026-09-29', version: '2.19.0', hero: '/images/releases/a.svg', body: '' }

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

test('nested directives unwrap all the way down', () => {
  const out = exportMarkdown({ ...release, body: ':::::columns\n::::column\n:::callout{type=note}\nInner.\n:::\n::::\n::::column\nOther.\n::::\n:::::' })
  assert.match(out, /Inner\.\n\nOther\./)
  assert.doesNotMatch(out, /:::/)
})

test('export preserves special characters and contains no HTML', () => {
  const out = exportMarkdown({ ...release, body: 'Values like # or & break.' })
  assert.match(out, /# or & break/)
  assert.doesNotMatch(out, /<[a-z]/)
})

test('the hero image is not in the export', () => {
  assert.doesNotMatch(exportMarkdown({ ...release, body: 'Body.' }), /a\.svg/)
})

test('inline colon text such as times of day survives the export', () => {
  const out = exportMarkdown({ ...release, body: 'Created at 12:24 PM, see :tip.' })
  assert.match(out, /12:24 PM, see :tip\./)
})

test('GFM tables and strikethrough pass through the export unescaped', () => {
  const out = exportMarkdown({ ...release, body: '| A | B |\n|---|---|\n| 1 | 2 |\n\n~~old~~ and - [ ] task' })
  assert.match(out, /\| A +\| B +\|/)
  assert.match(out, /~~old~~/)
  assert.doesNotMatch(out, /\\~/)
})

test('raw HTML in content does not appear as HTML in the export', () => {
  const out = exportMarkdown({ ...release, body: 'Line with <b>bold</b>.\n\n<div class="x">block</div>' })
  assert.doesNotMatch(out, /(^|[^\\])<[a-z/]/m)
  assert.match(out, /bold/)
  assert.match(out, /block/)
})

test('a release without a version has a date-only metadata line', () => {
  const out = exportMarkdown({ ...release, version: null, body: 'Body.' })
  assert.match(out, /\nReleased September 29, 2026\n\nBody\./)
  assert.doesNotMatch(out, /Version/)
})

test('carousel-list exports as a plain bulleted list without its images', () => {
  const body = '::::carousel-list\n:::item{image=/images/blocks/a.svg alt="Block A"}\n**Contact Card** with a photo.\n:::\n:::item{image=/images/blocks/b.svg alt="Block B"}\n**vCard** with one tap.\n:::\n::::'
  const out = exportMarkdown({ ...release, body })
  assert.match(out, /- \*\*Contact Card\*\* with a photo\.\n- \*\*vCard\*\* with one tap\.\n/)
  assert.doesNotMatch(out, /a\.svg|b\.svg|:::|image=/)
})
