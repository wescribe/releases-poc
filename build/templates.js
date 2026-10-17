import { formatDate, formatMonth } from './content.js'
import { withBase } from './render.js'

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const FOOTER = 'Powered by WeScribe. © 2026.'

export function layout({ title, base, body, description = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
${description ? `<meta name="description" content="${escapeHtml(description)}">\n` : ''}<link rel="stylesheet" href="${base}assets/styles.css">
<script>try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}</script>
</head>
<body>
<header class="topbar">
  <a class="wordmark" href="${base}">Spokenote <span class="wordmark-sub">Release notes</span></a>
  <button class="theme-toggle" type="button" aria-label="Toggle dark mode" title="Toggle dark mode">
    <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
    <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
  </button>
</header>
<main>
${body}
</main>
<footer class="footer">${FOOTER}</footer>
<script src="${base}assets/theme.js" defer></script>
</body>
</html>
`
}

function releaseUrl(base, release) {
  return `${base}releases/${encodeURIComponent(release.slug)}/`
}

export function releaseCard({ release, base }) {
  const url = releaseUrl(base, release)
  return `<article class="card">
  <a class="card-image-link" href="${url}"><img class="card-image" src="${escapeHtml(withBase(base, release.hero))}" alt=""></a>
  <div class="card-body">
    <p class="eyebrow">${escapeHtml(formatMonth(release.date))}</p>
    <h3 class="card-title"><a href="${url}">${escapeHtml(release.title)}</a></h3>
    <p class="card-summary">${escapeHtml(release.summary)}</p>
  </div>
</article>`
}

export function releasePage({ release, html, headings, related, base }) {
  const exportUrl = `${releaseUrl(base, release)}${encodeURIComponent(release.slug)}.md`
  const rail = headings.length
    ? `<aside class="rail">
  <nav aria-label="On this page">
    <p class="rail-title">On this page</p>
    <ul>
${headings.map(h => `      <li><a href="#${escapeHtml(h.id)}">${escapeHtml(h.text)}</a></li>`).join('\n')}
    </ul>
  </nav>
</aside>`
    : ''
  const whatsNew = related.length
    ? `<section class="whats-new" aria-labelledby="whats-new-title">
  <div class="whats-new-head">
    <h2 id="whats-new-title" class="whats-new-title">What's new</h2>
    <a class="all-releases" href="${base}">All releases</a>
  </div>
  <div class="card-grid">
${related.map(r => releaseCard({ release: r, base })).join('\n')}
  </div>
</section>`
    : ''
  const body = `<div class="page">
  <article class="release">
    <img class="hero" src="${escapeHtml(withBase(base, release.hero))}" alt="">
    <header class="release-head">
      <p class="eyebrow">${escapeHtml(formatDate(release.date))}</p>
      <h1 class="headline">${escapeHtml(release.title)}</h1>
      <p class="lead">${escapeHtml(release.summary)}</p>
      <p class="version">Version ${escapeHtml(release.version)} · <a class="export-link" href="${exportUrl}">View as markdown</a></p>
    </header>
    <div class="content">
${html}
    </div>
  </article>
${rail}
</div>
${whatsNew}`
  return layout({ title: `${release.title} · Spokenote release notes`, base, body, description: release.summary })
}

export function indexPage({ index, introHtml, releases, base }) {
  const [newest, ...rest] = releases
  const hero = newest
    ? `<article class="hero-card">
  <a class="hero-card-image-link" href="${releaseUrl(base, newest)}"><img class="hero-card-image" src="${escapeHtml(withBase(base, newest.hero))}" alt=""></a>
  <div class="hero-card-body">
    <p class="eyebrow">Latest · ${escapeHtml(formatMonth(newest.date))}</p>
    <h2 class="hero-card-title"><a href="${releaseUrl(base, newest)}">${escapeHtml(newest.title)}</a></h2>
    <p class="hero-card-summary">${escapeHtml(newest.summary)}</p>
    <a class="read-more" href="${releaseUrl(base, newest)}">Read the release</a>
  </div>
</article>`
    : '<p class="empty">No releases yet.</p>'
  const grid = rest.length
    ? `<div class="card-grid">
${rest.map(r => releaseCard({ release: r, base })).join('\n')}
</div>`
    : ''
  const body = `<section class="intro">
  <h1 class="headline">${escapeHtml(index.title)}</h1>
  <div class="lead">${introHtml}</div>
</section>
${hero}
${grid}`
  return layout({ title: index.title, base, body, description: index.intro.trim().split('\n')[0] })
}
