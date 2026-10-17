import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { loadReleases } from '../build/content.js'
import { renderMarkdown } from '../build/render.js'
import { exportMarkdown } from '../build/export.js'

// [source file in content/source, release slug, version or null, lead-ins deliberately left out of the public page]
const pairs = [
  ['v2.19.0', 'draft-pages-before-you-publish', '2.19.0', {
    // Internal engineering notes cut from the public page on 2026-10-17.
    omit: ['Sweepstakes load test', 'Sweepstakes rate limit', 'Security hardening', 'Cleanup'],
  }],
  ['v2.18.0', 'instant-win-sweepstakes', '2.18.0'],
  ['v2.17.0', 'chat-support-and-integration-health', '2.17.0'],
  ['2026-09-08-email-html-formatter', 'email-html-formatter', null],
]

for (const [sourceName, slug, version, { omit = [] } = {}] of pairs) {
  test(`${slug}: every source lead-in survives into the export, and the render is clean`, async () => {
    const release = (await loadReleases('content/releases')).find(r => r.slug === slug)
    assert.ok(release, 'release exists')
    assert.equal(release.version, version)
    const source = fs.readFileSync(`content/source/${sourceName}.txt`, 'utf8')
    const leadIns = [...source.matchAll(/^(.+?) - /gm)].map(m => m[1].trim()).filter(s => s.length > 2 && s.length <= 60 && !omit.includes(s))
    assert.ok(leadIns.length > 3, 'source has lead-ins')
    const exported = exportMarkdown(release).toLowerCase()
    for (const lead of leadIns) assert.ok(exported.includes(lead.toLowerCase()), `missing: ${lead}`)
    const { warnings } = renderMarkdown(release.body, { base: '/' })
    assert.deepEqual(warnings, [])
    assert.doesNotMatch(release.title, /\d\.\d/)
    for (const img of release.body.matchAll(/!\[[^\]]*\]\(\/(images[^)]+)\)/g)) assert.ok(fs.existsSync(`content/${img[1]}`), img[1])
    assert.ok(fs.existsSync(`content${release.hero}`), release.hero)
  })
}
