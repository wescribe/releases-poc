import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { loadReleases, loadIndex, formatDate, formatMonth, ContentError } from '../build/content.js'

const fixtures = path.resolve('test/fixtures')

function tempDirWith(...names) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'poc-content-'))
  for (const n of names) fs.copyFileSync(path.join(fixtures, 'releases', n), path.join(dir, n))
  return dir
}

test('loadReleases sorts newest first and normalizes date to a string', async () => {
  const releases = await loadReleases(tempDirWith('beta.md', 'alpha.md'))
  assert.deepEqual(releases.map(r => r.slug), ['alpha', 'beta'])
  assert.equal(releases[0].date, '2026-09-29')
  assert.equal(typeof releases[0].date, 'string')
  assert.equal(releases[0].title, 'Alpha headline')
  assert.equal(releases[0].version, '2.19.0')
  assert.equal(releases[0].body.trim(), '## First\n\nHello.')
})

test('loadReleases names the file and field when front matter is missing', async () => {
  await assert.rejects(loadReleases(tempDirWith('missing-hero.md')), err =>
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

test('version keeps its trailing zero even though YAML would read 2.10 as a number', async () => {
  const [r] = await loadReleases(tempDirWith('version-2-10.md'))
  assert.equal(r.version, '2.10')
})

test('a date that is not a plain YYYY-MM-DD day is rejected with the file and field', async () => {
  for (const f of ['date-with-time.md', 'date-words.md']) {
    await assert.rejects(loadReleases(tempDirWith(f)), err =>
      err instanceof ContentError && err.file.endsWith(f) && err.field === 'date' && /YYYY-MM-DD/.test(err.message))
  }
})

test('version is optional: a release without one loads with version null', async () => {
  const [r] = await loadReleases(tempDirWith('no-version.md'))
  assert.equal(r.version, null)
  assert.equal(r.title, 'No version headline')
})
