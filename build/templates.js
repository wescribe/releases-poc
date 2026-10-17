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

// Spokenote wordmark. Fill comes from CSS via currentColor so it follows the theme.
const LOGO = `<svg class="logo" viewBox="0 0 158 30" width="116" height="22" fill="currentColor" aria-hidden="true" focusable="false"><path d="M0,15.6h9.8v10.2L6,29.6c-0.4,0.4-1,0.1-1-0.4v-3.3H2.3c-1.3,0-2.3-1-2.3-2.3V15.6z M52,10.1c1.2,1.3,1.8,3,1.8,4.9c0,2-0.6,3.6-1.8,4.9c-1.2,1.3-2.6,2-4.4,2c-1.4,0-2.7-0.5-3.8-1.4v5.5c0,0.4-0.1,0.6-0.4,0.9c-0.2,0.2-0.5,0.4-0.9,0.4h-1.3c-0.4,0-0.7-0.1-0.9-0.4c-0.2-0.2-0.4-0.5-0.4-0.9V9.7c0-0.4,0.1-0.6,0.4-0.9c0.2-0.2,0.5-0.4,0.9-0.4h1.3c0.3,0,0.6,0.1,0.8,0.3c0.2,0.2,0.4,0.5,0.4,0.8c1.1-0.9,2.3-1.4,3.8-1.4C49.4,8.2,50.8,8.8,52,10.1z M49.8,15.1c0-0.9-0.3-1.7-0.9-2.3c-0.6-0.6-1.3-0.9-2.1-0.9c-0.8,0-1.5,0.3-2.1,0.9c-0.6,0.6-0.9,1.4-0.9,2.3c0,0.9,0.3,1.6,0.9,2.2c0.6,0.6,1.3,0.9,2.1,0.9c0.8,0,1.5-0.3,2.1-0.9C49.5,16.7,49.8,16,49.8,15.1z M66.7,10.1c1.4,1.3,2,3,2,4.9c0,2-0.7,3.6-2,4.9c-1.3,1.3-3,2-5.1,2c-2,0-3.7-0.7-5.1-2c-1.4-1.3-2-3-2-4.9c0-2,0.7-3.6,2-4.9c1.4-1.3,3-2,5.1-2C63.7,8.2,65.4,8.8,66.7,10.1z M64.8,15.1c0-0.9-0.3-1.6-0.9-2.2c-0.6-0.6-1.3-0.9-2.2-0.9c-0.9,0-1.6,0.3-2.2,0.9c-0.6,0.6-0.9,1.4-0.9,2.2c0,0.9,0.3,1.6,0.9,2.2c0.6,0.6,1.3,0.9,2.2,0.9c0.9,0,1.6-0.3,2.2-0.9C64.5,16.7,64.8,15.9,64.8,15.1z M18.7,4h-7.5v10.3H21v-8C21,5,19.9,4,18.7,4z M11.2,25.8h7.5c1.3,0,2.3-1,2.3-2.3v-7.9h-9.8V25.8z M0,6.3v8h9.8V4H2.3C1,4,0,5,0,6.3z M35.1,13.7l-2.4-0.8c-0.7-0.3-1-0.5-1-0.9c0-0.6,0.5-0.9,1.5-0.9c0.7,0,1.3,0.2,1.7,0.6c0.3,0.3,0.7,0.4,1,0.4v0l1.6-0.3c0.4-0.1,0.6-0.2,0.8-0.5c0.2-0.3,0.2-0.6,0.1-0.9c-0.8-1.6-2.4-2.4-4.9-2.4c-1.6,0-2.9,0.3-3.9,1c-1,0.7-1.5,1.7-1.5,3.2c0,1,0.3,1.8,0.8,2.4c0.5,0.6,1.4,1.1,2.7,1.4l2.4,0.7c0.9,0.3,1.3,0.6,1.3,1c0,0.3-0.2,0.5-0.5,0.7c-0.3,0.2-0.7,0.3-1.2,0.3c-1,0-1.6-0.3-2-0.8c-0.3-0.3-0.6-0.5-0.9-0.5h-0.1L29,17.8c-0.4,0.1-0.7,0.2-0.8,0.5c-0.2,0.3-0.2,0.6-0.1,0.9c0.8,1.8,2.6,2.7,5.4,2.7c1.6,0,3-0.4,4-1.1c1-0.7,1.5-1.8,1.5-3.1c0-1-0.3-1.8-0.9-2.4C37.4,14.6,36.4,14.1,35.1,13.7z M148.5,10.2c1.3,1.3,1.9,2.9,1.9,4.8c0,0.2-0.1,0.3-0.2,0.4c-0.1,0.1-0.2,0.2-0.4,0.2h-11.3c0.1,1.4,0.7,2.6,1.7,3.5c1,0.9,2.2,1.4,3.7,1.4c1.8,0,3.2-0.6,4.2-1.9c0.1-0.1,0.3-0.2,0.4-0.2c0.1,0,0.1,0,0.2,0l0.7,0.2c0.1,0.1,0.2,0.1,0.3,0.3c0,0.1,0,0.2-0.1,0.3c-0.6,0.9-1.4,1.6-2.4,2c-1,0.5-2.1,0.7-3.2,0.7c-2,0-3.7-0.6-5-1.9c-1.3-1.3-2-2.9-2-4.8c0-1.9,0.6-3.5,1.9-4.8c1.3-1.3,2.9-1.9,4.8-1.9C145.6,8.3,147.2,8.9,148.5,10.2z M148.8,14.2c-0.2-1.3-0.8-2.4-1.7-3.2c-1-0.8-2.1-1.3-3.4-1.3c-1.3,0-2.5,0.4-3.4,1.3c-0.9,0.8-1.5,1.9-1.7,3.2H148.8z M136,8.5h-4.6V6.4c0-0.2-0.1-0.3-0.2-0.4c-0.1-0.1-0.2-0.2-0.4-0.2h-0.5c-0.2,0-0.3,0.1-0.4,0.2c-0.1,0.1-0.2,0.2-0.2,0.4v2.1H128c-0.3,0-0.5,0.2-0.5,0.5v0.5l0,0c0,0.3,0.2,0.5,0.5,0.5h1.8v8c0,1,0.3,1.9,1,2.6c0.7,0.7,1.5,1.1,2.5,1.1h1.5c0.1,0,0.2,0,0.3-0.1c0.1-0.1,0.1-0.2,0.1-0.3v-0.6c0-0.1,0-0.2-0.1-0.3c-0.1-0.1-0.2-0.1-0.3-0.1h-1.4c-0.6,0-1.1-0.2-1.5-0.7c-0.4-0.4-0.6-1-0.6-1.7V9.9h4.6c0.3,0,0.5-0.2,0.5-0.5V9C136.5,8.7,136.4,8.5,136,8.5z M124.5,10.2c1.3,1.3,2,2.9,2,4.8s-0.7,3.5-2,4.8c-1.3,1.3-2.9,1.9-4.9,1.9c-2,0-3.6-0.6-4.9-1.9c-1.3-1.3-2-2.9-2-4.8s0.7-3.6,2-4.9c1.3-1.3,2.9-1.9,4.9-1.9C121.6,8.3,123.2,8.9,124.5,10.2z M124.9,15.1c0-1.5-0.5-2.7-1.5-3.7c-1-1-2.2-1.5-3.7-1.5c-1.5,0-2.7,0.5-3.7,1.5c-1,1-1.5,2.2-1.5,3.7c0,1.5,0.5,2.7,1.5,3.7c1,1,2.2,1.5,3.7,1.5c1.5,0,2.7-0.5,3.7-1.5C124.4,17.8,124.9,16.6,124.9,15.1z M93.9,10.2c1.3,1.4,2,3,2,5c0,0.3-0.1,0.6-0.4,0.9c-0.3,0.2-0.6,0.4-1,0.4h-8.6c0.2,0.7,0.6,1.2,1.2,1.7c0.6,0.4,1.3,0.6,2,0.6c0.8,0,1.6-0.2,2.2-0.7c0.3-0.2,0.6-0.3,0.9-0.3c0.1,0,0.2,0,0.2,0l1.9,0.4c0.4,0.1,0.6,0.3,0.7,0.5c0.1,0.3,0,0.5-0.2,0.8c-1.4,1.7-3.3,2.5-5.6,2.5c-2.1,0-3.8-0.7-5.2-2c-1.4-1.3-2.1-3-2.1-4.9s0.7-3.6,2-4.9c1.3-1.3,3-2,5-2C90.9,8.2,92.6,8.8,93.9,10.2z M92,13.6c-0.2-0.7-0.6-1.2-1.2-1.6c-0.6-0.4-1.2-0.6-1.9-0.6c-0.7,0-1.3,0.2-1.8,0.6c-0.5,0.4-0.9,0.9-1.1,1.6H92z M104.6,8.3c-2.3,0-4,0.9-5.1,2.8V9c0-0.2-0.1-0.3-0.2-0.4c-0.1-0.1-0.2-0.2-0.4-0.2h-0.5c-0.2,0-0.3,0.1-0.4,0.2C98,8.7,97.9,8.9,97.9,9h0v12.1c0,0.2,0.1,0.3,0.2,0.4c0.1,0.1,0.2,0.2,0.4,0.2H99c0.2,0,0.3-0.1,0.4-0.2c0.1-0.1,0.2-0.2,0.2-0.4V14c0-1.2,0.5-2.2,1.4-3c0.9-0.8,2-1.2,3.4-1.2c1.2,0,2.2,0.4,3,1.2c0.8,0.8,1.2,1.8,1.2,3v7.2c0,0.4,0.2,0.5,0.5,0.5h0.5c0.2,0,0.3,0,0.4-0.2c0.1-0.1,0.2-0.2,0.2-0.4v-7.5c0-1.5-0.5-2.8-1.5-3.8C107.4,8.8,106.2,8.3,104.6,8.3z M77.5,14.8l3.9-5.3c0.2-0.3,0.3-0.5,0.2-0.7c-0.1-0.2-0.3-0.3-0.7-0.3h-2c-0.4,0-0.7,0.1-1.1,0.3C77.3,9,77,9.2,76.8,9.5l-3,4.1V3.9c0-0.4-0.1-0.6-0.4-0.9c-0.2-0.2-0.5-0.4-0.9-0.4h-1.3c-0.4,0-0.7,0.1-0.9,0.4C70.1,3.3,70,3.6,70,3.9v16.5c0,0.3,0.1,0.6,0.4,0.9c0.2,0.2,0.5,0.4,0.9,0.4h1.3c0.4,0,0.7-0.1,0.9-0.4c0.2-0.2,0.4-0.5,0.4-0.9V16l3.4,4.6c0.2,0.3,0.5,0.5,0.9,0.7c0.4,0.2,0.8,0.3,1.1,0.3h2.1c0.4,0,0.6-0.1,0.7-0.3c0.1-0.2,0-0.4-0.2-0.7L77.5,14.8z M154.9,5.8c-0.9,0-1.6,0.3-2.2,0.9c-0.6,0.6-0.9,1.3-0.9,2.2s0.3,1.6,0.9,2.2c0.6,0.6,1.3,0.9,2.2,0.9s1.6-0.3,2.2-0.9c0.6-0.6,0.9-1.3,0.9-2.2s-0.3-1.6-0.9-2.2C156.5,6.2,155.7,5.8,154.9,5.8z M154.9,11.8c-0.8,0-1.4-0.3-2-0.8c-0.5-0.5-0.8-1.2-0.8-2c0-0.8,0.3-1.4,0.8-2c0.5-0.5,1.2-0.8,2-0.8c0.8,0,1.4,0.3,2,0.8c0.5,0.5,0.8,1.2,0.8,2c0,0.8-0.3,1.4-0.8,2C156.3,11.5,155.6,11.8,154.9,11.8z M153.7,10.4c0,0,0,0.1,0,0.1c0,0,0.1,0.1,0.1,0.1h0.2c0.1,0,0.1,0,0.1-0.1c0,0,0-0.1,0-0.1v-1h0.9l0.6,1c0.1,0.1,0.1,0.1,0.3,0.1h0.2c0,0,0.1,0,0.1,0c0,0,0-0.1,0-0.1l-0.7-1.1c0.2-0.1,0.3-0.2,0.5-0.4c0.1-0.2,0.2-0.4,0.2-0.6c0-0.3-0.1-0.5-0.3-0.7c-0.2-0.2-0.5-0.3-0.8-0.3h-1.3c-0.1,0-0.2,0.1-0.2,0.2V10.4z M154.2,9V7.8h1c0.2,0,0.3,0.1,0.4,0.2s0.2,0.2,0.2,0.4c0,0.2-0.1,0.3-0.2,0.4c-0.1,0.1-0.2,0.2-0.4,0.2H154.2z"/></svg>`

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
  <a class="wordmark" href="${base}" aria-label="Spokenote release notes">
    ${LOGO}
    <span class="wordmark-sub">Release notes</span>
  </a>
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
    <a class="card-link" href="${url}">Read the release</a>
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
      <p class="version"><span>Version ${escapeHtml(release.version)}</span><a class="export-link" href="${exportUrl}">View as markdown</a></p>
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

export function indexPage({ index, releases, base }) {
  const [newest, ...rest] = releases
  const hero = newest
    ? `<article class="hero-card">
  <a class="hero-card-image-link" href="${releaseUrl(base, newest)}" tabindex="-1" aria-hidden="true"><img class="hero-card-image" src="${escapeHtml(withBase(base, newest.hero))}" alt=""><span class="hero-card-badge">Latest release</span></a>
  <div class="hero-card-body">
    <p class="eyebrow">${escapeHtml(formatMonth(newest.date))}</p>
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
  const body = `${hero}
${grid}`
  return layout({ title: index.title, base, body, description: index.intro.trim().split('\n')[0] })
}
