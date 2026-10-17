import { test } from 'node:test'
import assert from 'node:assert/strict'
import { placeholderSvg } from '../scripts/make-placeholder.js'

test('placeholderSvg is deterministic, sized, and contains no external references', () => {
  const a = placeholderSvg({ seed: 'draft-pages', width: 1600, height: 900 })
  assert.equal(a, placeholderSvg({ seed: 'draft-pages', width: 1600, height: 900 }))
  assert.notEqual(a, placeholderSvg({ seed: 'other', width: 1600, height: 900 }))
  assert.match(a, /viewBox="0 0 1600 900"/)
  assert.doesNotMatch(a, /https?:\/\/(?!www\.w3\.org)/)
  assert.doesNotMatch(a, /<script/)
})

test('placeholderSvg escapes the label', () => {
  const svg = placeholderSvg({ seed: 'x', width: 1200, height: 900, label: 'Save <Draft> & Publish' })
  assert.match(svg, /Save &lt;Draft&gt; &amp; Publish/)
})
