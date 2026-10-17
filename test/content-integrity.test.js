import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { loadReleases } from '../build/content.js'
import { renderMarkdown } from '../build/render.js'
import { exportMarkdown } from '../build/export.js'

const pairs = [
  ['v2.19.0', 'draft-pages-before-you-publish'],
  ['v2.18.0', 'instant-win-sweepstakes'],
  ['v2.17.0', 'chat-support-and-integration-health'],
]

for (const [version, slug] of pairs) {
  test(`${slug}: every source lead-in survives into the export, and the render is clean`, async () => {
    const release = (await loadReleases('content/releases')).find(r => r.slug === slug)
    assert.ok(release, 'release exists')
    assert.equal(release.version, version.slice(1))
    const source = fs.readFileSync(`content/source/${version}.txt`, 'utf8')
    const leadIns = [...source.matchAll(/^(.+?) - /gm)].map(m => m[1].trim()).filter(s => s.length > 2 && s.length <= 60)
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
