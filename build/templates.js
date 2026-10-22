import { formatDate, formatMonth } from './content.js'
import { withBase } from './render.js'

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const FOOTER = '<a class="footer-link" href="https://wescribe.com" target="_blank" rel="noopener">Powered by WeScribe</a>. © 2026.'
const SITE_NAME = 'Spokenote release notes'

// Open Graph, Twitter card and canonical tags. All URLs must be absolute.
function socialMeta({ title, description, url, image, type, published }) {
  const tags = [
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:image" content="${escapeHtml(image)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(image)}">`,
  ]
  if (published) tags.push(`<meta property="article:published_time" content="${escapeHtml(published)}">`)
  return tags.join('\n')
}

// Share icons. Brand marks are filled; Email and SMS are outlined to match the site's other icons.
const brand = d => `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`
const outline = d => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`
const SHARE_ICONS = {
  facebook: brand('M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'),
  x: brand('M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z'),
  linkedin: brand('M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'),
  whatsapp: brand('M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'),
  telegram: brand('M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z'),
  email: outline('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  sms: outline('<path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>'),
}

const THUMB_UP = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zm0 0 4.2-7.5a2 2 0 0 1 3.6 1.4L14.2 9H19a2 2 0 0 1 2 2.3l-1.1 7A2 2 0 0 1 18 20H7"/></svg>'
const THUMB_DOWN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 13V4h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-3zm0 0-4.2 7.5a2 2 0 0 1-3.6-1.4L9.8 15H5a2 2 0 0 1-2-2.3l1.1-7A2 2 0 0 1 6 4h11"/></svg>'

// Brand marks from Simple Icons (CC0).
const ICON_ANTHROPIC = brand('M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z')
const ICON_OPENAI = brand('M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z')
const ICON_EXTERNAL = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>'
const CHEVRON_DOWN = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'

const CHEVRON_LEFT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>'
const CHEVRON_RIGHT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'

// Spokenote wordmark. Fill comes from CSS via currentColor so it follows the theme.
const LOGO = `<svg class="logo" viewBox="0 0 158 30" width="116" height="22" fill="currentColor" aria-hidden="true" focusable="false"><path d="M0,15.6h9.8v10.2L6,29.6c-0.4,0.4-1,0.1-1-0.4v-3.3H2.3c-1.3,0-2.3-1-2.3-2.3V15.6z M52,10.1c1.2,1.3,1.8,3,1.8,4.9c0,2-0.6,3.6-1.8,4.9c-1.2,1.3-2.6,2-4.4,2c-1.4,0-2.7-0.5-3.8-1.4v5.5c0,0.4-0.1,0.6-0.4,0.9c-0.2,0.2-0.5,0.4-0.9,0.4h-1.3c-0.4,0-0.7-0.1-0.9-0.4c-0.2-0.2-0.4-0.5-0.4-0.9V9.7c0-0.4,0.1-0.6,0.4-0.9c0.2-0.2,0.5-0.4,0.9-0.4h1.3c0.3,0,0.6,0.1,0.8,0.3c0.2,0.2,0.4,0.5,0.4,0.8c1.1-0.9,2.3-1.4,3.8-1.4C49.4,8.2,50.8,8.8,52,10.1z M49.8,15.1c0-0.9-0.3-1.7-0.9-2.3c-0.6-0.6-1.3-0.9-2.1-0.9c-0.8,0-1.5,0.3-2.1,0.9c-0.6,0.6-0.9,1.4-0.9,2.3c0,0.9,0.3,1.6,0.9,2.2c0.6,0.6,1.3,0.9,2.1,0.9c0.8,0,1.5-0.3,2.1-0.9C49.5,16.7,49.8,16,49.8,15.1z M66.7,10.1c1.4,1.3,2,3,2,4.9c0,2-0.7,3.6-2,4.9c-1.3,1.3-3,2-5.1,2c-2,0-3.7-0.7-5.1-2c-1.4-1.3-2-3-2-4.9c0-2,0.7-3.6,2-4.9c1.4-1.3,3-2,5.1-2C63.7,8.2,65.4,8.8,66.7,10.1z M64.8,15.1c0-0.9-0.3-1.6-0.9-2.2c-0.6-0.6-1.3-0.9-2.2-0.9c-0.9,0-1.6,0.3-2.2,0.9c-0.6,0.6-0.9,1.4-0.9,2.2c0,0.9,0.3,1.6,0.9,2.2c0.6,0.6,1.3,0.9,2.2,0.9c0.9,0,1.6-0.3,2.2-0.9C64.5,16.7,64.8,15.9,64.8,15.1z M18.7,4h-7.5v10.3H21v-8C21,5,19.9,4,18.7,4z M11.2,25.8h7.5c1.3,0,2.3-1,2.3-2.3v-7.9h-9.8V25.8z M0,6.3v8h9.8V4H2.3C1,4,0,5,0,6.3z M35.1,13.7l-2.4-0.8c-0.7-0.3-1-0.5-1-0.9c0-0.6,0.5-0.9,1.5-0.9c0.7,0,1.3,0.2,1.7,0.6c0.3,0.3,0.7,0.4,1,0.4v0l1.6-0.3c0.4-0.1,0.6-0.2,0.8-0.5c0.2-0.3,0.2-0.6,0.1-0.9c-0.8-1.6-2.4-2.4-4.9-2.4c-1.6,0-2.9,0.3-3.9,1c-1,0.7-1.5,1.7-1.5,3.2c0,1,0.3,1.8,0.8,2.4c0.5,0.6,1.4,1.1,2.7,1.4l2.4,0.7c0.9,0.3,1.3,0.6,1.3,1c0,0.3-0.2,0.5-0.5,0.7c-0.3,0.2-0.7,0.3-1.2,0.3c-1,0-1.6-0.3-2-0.8c-0.3-0.3-0.6-0.5-0.9-0.5h-0.1L29,17.8c-0.4,0.1-0.7,0.2-0.8,0.5c-0.2,0.3-0.2,0.6-0.1,0.9c0.8,1.8,2.6,2.7,5.4,2.7c1.6,0,3-0.4,4-1.1c1-0.7,1.5-1.8,1.5-3.1c0-1-0.3-1.8-0.9-2.4C37.4,14.6,36.4,14.1,35.1,13.7z M148.5,10.2c1.3,1.3,1.9,2.9,1.9,4.8c0,0.2-0.1,0.3-0.2,0.4c-0.1,0.1-0.2,0.2-0.4,0.2h-11.3c0.1,1.4,0.7,2.6,1.7,3.5c1,0.9,2.2,1.4,3.7,1.4c1.8,0,3.2-0.6,4.2-1.9c0.1-0.1,0.3-0.2,0.4-0.2c0.1,0,0.1,0,0.2,0l0.7,0.2c0.1,0.1,0.2,0.1,0.3,0.3c0,0.1,0,0.2-0.1,0.3c-0.6,0.9-1.4,1.6-2.4,2c-1,0.5-2.1,0.7-3.2,0.7c-2,0-3.7-0.6-5-1.9c-1.3-1.3-2-2.9-2-4.8c0-1.9,0.6-3.5,1.9-4.8c1.3-1.3,2.9-1.9,4.8-1.9C145.6,8.3,147.2,8.9,148.5,10.2z M148.8,14.2c-0.2-1.3-0.8-2.4-1.7-3.2c-1-0.8-2.1-1.3-3.4-1.3c-1.3,0-2.5,0.4-3.4,1.3c-0.9,0.8-1.5,1.9-1.7,3.2H148.8z M136,8.5h-4.6V6.4c0-0.2-0.1-0.3-0.2-0.4c-0.1-0.1-0.2-0.2-0.4-0.2h-0.5c-0.2,0-0.3,0.1-0.4,0.2c-0.1,0.1-0.2,0.2-0.2,0.4v2.1H128c-0.3,0-0.5,0.2-0.5,0.5v0.5l0,0c0,0.3,0.2,0.5,0.5,0.5h1.8v8c0,1,0.3,1.9,1,2.6c0.7,0.7,1.5,1.1,2.5,1.1h1.5c0.1,0,0.2,0,0.3-0.1c0.1-0.1,0.1-0.2,0.1-0.3v-0.6c0-0.1,0-0.2-0.1-0.3c-0.1-0.1-0.2-0.1-0.3-0.1h-1.4c-0.6,0-1.1-0.2-1.5-0.7c-0.4-0.4-0.6-1-0.6-1.7V9.9h4.6c0.3,0,0.5-0.2,0.5-0.5V9C136.5,8.7,136.4,8.5,136,8.5z M124.5,10.2c1.3,1.3,2,2.9,2,4.8s-0.7,3.5-2,4.8c-1.3,1.3-2.9,1.9-4.9,1.9c-2,0-3.6-0.6-4.9-1.9c-1.3-1.3-2-2.9-2-4.8s0.7-3.6,2-4.9c1.3-1.3,2.9-1.9,4.9-1.9C121.6,8.3,123.2,8.9,124.5,10.2z M124.9,15.1c0-1.5-0.5-2.7-1.5-3.7c-1-1-2.2-1.5-3.7-1.5c-1.5,0-2.7,0.5-3.7,1.5c-1,1-1.5,2.2-1.5,3.7c0,1.5,0.5,2.7,1.5,3.7c1,1,2.2,1.5,3.7,1.5c1.5,0,2.7-0.5,3.7-1.5C124.4,17.8,124.9,16.6,124.9,15.1z M93.9,10.2c1.3,1.4,2,3,2,5c0,0.3-0.1,0.6-0.4,0.9c-0.3,0.2-0.6,0.4-1,0.4h-8.6c0.2,0.7,0.6,1.2,1.2,1.7c0.6,0.4,1.3,0.6,2,0.6c0.8,0,1.6-0.2,2.2-0.7c0.3-0.2,0.6-0.3,0.9-0.3c0.1,0,0.2,0,0.2,0l1.9,0.4c0.4,0.1,0.6,0.3,0.7,0.5c0.1,0.3,0,0.5-0.2,0.8c-1.4,1.7-3.3,2.5-5.6,2.5c-2.1,0-3.8-0.7-5.2-2c-1.4-1.3-2.1-3-2.1-4.9s0.7-3.6,2-4.9c1.3-1.3,3-2,5-2C90.9,8.2,92.6,8.8,93.9,10.2z M92,13.6c-0.2-0.7-0.6-1.2-1.2-1.6c-0.6-0.4-1.2-0.6-1.9-0.6c-0.7,0-1.3,0.2-1.8,0.6c-0.5,0.4-0.9,0.9-1.1,1.6H92z M104.6,8.3c-2.3,0-4,0.9-5.1,2.8V9c0-0.2-0.1-0.3-0.2-0.4c-0.1-0.1-0.2-0.2-0.4-0.2h-0.5c-0.2,0-0.3,0.1-0.4,0.2C98,8.7,97.9,8.9,97.9,9h0v12.1c0,0.2,0.1,0.3,0.2,0.4c0.1,0.1,0.2,0.2,0.4,0.2H99c0.2,0,0.3-0.1,0.4-0.2c0.1-0.1,0.2-0.2,0.2-0.4V14c0-1.2,0.5-2.2,1.4-3c0.9-0.8,2-1.2,3.4-1.2c1.2,0,2.2,0.4,3,1.2c0.8,0.8,1.2,1.8,1.2,3v7.2c0,0.4,0.2,0.5,0.5,0.5h0.5c0.2,0,0.3,0,0.4-0.2c0.1-0.1,0.2-0.2,0.2-0.4v-7.5c0-1.5-0.5-2.8-1.5-3.8C107.4,8.8,106.2,8.3,104.6,8.3z M77.5,14.8l3.9-5.3c0.2-0.3,0.3-0.5,0.2-0.7c-0.1-0.2-0.3-0.3-0.7-0.3h-2c-0.4,0-0.7,0.1-1.1,0.3C77.3,9,77,9.2,76.8,9.5l-3,4.1V3.9c0-0.4-0.1-0.6-0.4-0.9c-0.2-0.2-0.5-0.4-0.9-0.4h-1.3c-0.4,0-0.7,0.1-0.9,0.4C70.1,3.3,70,3.6,70,3.9v16.5c0,0.3,0.1,0.6,0.4,0.9c0.2,0.2,0.5,0.4,0.9,0.4h1.3c0.4,0,0.7-0.1,0.9-0.4c0.2-0.2,0.4-0.5,0.4-0.9V16l3.4,4.6c0.2,0.3,0.5,0.5,0.9,0.7c0.4,0.2,0.8,0.3,1.1,0.3h2.1c0.4,0,0.6-0.1,0.7-0.3c0.1-0.2,0-0.4-0.2-0.7L77.5,14.8z M154.9,5.8c-0.9,0-1.6,0.3-2.2,0.9c-0.6,0.6-0.9,1.3-0.9,2.2s0.3,1.6,0.9,2.2c0.6,0.6,1.3,0.9,2.2,0.9s1.6-0.3,2.2-0.9c0.6-0.6,0.9-1.3,0.9-2.2s-0.3-1.6-0.9-2.2C156.5,6.2,155.7,5.8,154.9,5.8z M154.9,11.8c-0.8,0-1.4-0.3-2-0.8c-0.5-0.5-0.8-1.2-0.8-2c0-0.8,0.3-1.4,0.8-2c0.5-0.5,1.2-0.8,2-0.8c0.8,0,1.4,0.3,2,0.8c0.5,0.5,0.8,1.2,0.8,2c0,0.8-0.3,1.4-0.8,2C156.3,11.5,155.6,11.8,154.9,11.8z M153.7,10.4c0,0,0,0.1,0,0.1c0,0,0.1,0.1,0.1,0.1h0.2c0.1,0,0.1,0,0.1-0.1c0,0,0-0.1,0-0.1v-1h0.9l0.6,1c0.1,0.1,0.1,0.1,0.3,0.1h0.2c0,0,0.1,0,0.1,0c0,0,0-0.1,0-0.1l-0.7-1.1c0.2-0.1,0.3-0.2,0.5-0.4c0.1-0.2,0.2-0.4,0.2-0.6c0-0.3-0.1-0.5-0.3-0.7c-0.2-0.2-0.5-0.3-0.8-0.3h-1.3c-0.1,0-0.2,0.1-0.2,0.2V10.4z M154.2,9V7.8h1c0.2,0,0.3,0.1,0.4,0.2s0.2,0.2,0.2,0.4c0,0.2-0.1,0.3-0.2,0.4c-0.1,0.1-0.2,0.2-0.4,0.2H154.2z"/></svg>`

// Google Analytics (gtag.js). Rendered only when a measurement id is configured,
// so local development does not send hits.
function analyticsTag(gaId) {
  if (!gaId) return ''
  const id = escapeHtml(gaId)
  return `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${id}');
</script>
`
}

export function layout({ title, base, body, description = '', social = null, gaId = null, pageId = 'index' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${analyticsTag(gaId)}<title>${escapeHtml(title)}</title>
<link rel="icon" href="${base}favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="${base}apple-touch-icon.png">
<meta name="theme-color" content="#005677">
${description ? `<meta name="description" content="${escapeHtml(description)}">\n` : ''}${social ? socialMeta(social) + '\n' : ''}<link rel="stylesheet" href="${base}assets/styles.css">
<script>try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}</script>
</head>
<body data-release="${escapeHtml(pageId)}">
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
<script src="${base}assets/islands.js" defer></script>
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

export function releasePage({ release, html, headings, related, base, siteUrl = '', gaId = null }) {
  const absolute = p => siteUrl.replace(/\/$/, '') + p
  const exportUrl = `${releaseUrl(base, release)}${encodeURIComponent(release.slug)}.md`
  const toc = headings.length
    ? `  <nav aria-label="On this page">
    <p class="rail-title">On this page</p>
    <ul>
${headings.map(h => `      <li><a href="#${escapeHtml(h.id)}">${escapeHtml(h.text)}</a></li>`).join('\n')}
    </ul>
  </nav>
`
    : ''
  const shareMessage = `${release.title}: ${release.summary}`
  const aiPrompt = encodeURIComponent(`Read ${absolute(exportUrl)} so I can ask questions about it.`)
  const aiActions = [
    { key: 'claude', title: 'Open in Claude', icon: ICON_ANTHROPIC, href: `https://claude.ai/new?q=${aiPrompt}` },
    { key: 'chatgpt', title: 'Open in ChatGPT', icon: ICON_OPENAI, href: escapeHtml(`https://chatgpt.com/?hint=search&q=${aiPrompt}`) },
  ]
  const shareOptions = [
    ['facebook', 'Facebook'], ['x', 'X'], ['linkedin', 'LinkedIn'], ['whatsapp', 'WhatsApp'],
    ['telegram', 'Telegram'], ['email', 'Email'], ['sms', 'SMS'],
  ].map(([key, label]) => [key, label, SHARE_ICONS[key]])
  const rail = `<aside class="rail">
${toc}  <div class="rail-actions">
    <div class="share">
      <button class="share-toggle" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="share-menu">Share this page ${CHEVRON_DOWN}</button>
      <ul class="share-menu" id="share-menu" role="menu" hidden data-message="${escapeHtml(shareMessage)}" data-subject="${escapeHtml(release.title)}">
${shareOptions.map(([key, label, icon]) => `        <li role="none"><a role="menuitem" data-share="${key}" href="#" target="_blank" rel="noopener noreferrer"><span class="share-icon">${icon}</span>${label}</a></li>`).join('\n')}
      </ul>
    </div>
    <a class="export-link" href="${exportUrl}" target="_blank" rel="noopener">View as markdown</a>
    <div class="actions">
      <button class="actions-toggle" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="actions-menu">More actions ${CHEVRON_DOWN}</button>
      <ul class="actions-menu" id="actions-menu" role="menu" hidden>
${aiActions.map(a => `        <li role="none"><a class="actions-item" href="${a.href}" role="menuitem" data-action="${a.key}" target="_blank" rel="noopener noreferrer"><span class="actions-icon">${a.icon}</span><span class="actions-text"><span class="actions-title">${a.title}</span><span class="actions-sub">Ask questions about this page</span></span><span class="actions-ext">${ICON_EXTERNAL}</span></a></li>`).join('\n')}
      </ul>
    </div>
  </div>
</aside>`
  const whatsNew = related.length
    ? `<section class="whats-new" aria-labelledby="whats-new-title">
  <div class="whats-new-head">
    <h2 id="whats-new-title" class="whats-new-title">What's new</h2>
    <a class="all-releases" href="${base}">All releases</a>
  </div>
  <div class="carousel">
    <button class="carousel-btn carousel-prev" type="button" aria-label="Previous releases" hidden>${CHEVRON_LEFT}</button>
    <div class="carousel-viewport">
      <div class="carousel-track">
${related.map(r => releaseCard({ release: r, base })).join('\n')}
      </div>
    </div>
    <button class="carousel-btn carousel-next" type="button" aria-label="Next releases" hidden>${CHEVRON_RIGHT}</button>
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
${release.version ? `      <p class="version"><span class="version-pill">Version ${escapeHtml(release.version)}</span></p>\n` : ''}
    </header>
    <div class="content">
${html}
    </div>
    <div class="feedback" data-feedback>
      <p class="feedback-question">Did this page help you?</p>
      <div class="feedback-actions">
        <button class="feedback-btn" type="button" data-vote="yes" aria-pressed="false">${THUMB_UP}<span>Yes</span></button>
        <button class="feedback-btn" type="button" data-vote="no" aria-pressed="false">${THUMB_DOWN}<span>No</span></button>
      </div>
      <p class="feedback-thanks" hidden>Thanks for your feedback.</p>
    </div>
  </article>
${rail}
</div>
${whatsNew}`
  return layout({
    title: `${release.title} · ${SITE_NAME}`,
    base,
    body,
    description: release.summary,
    gaId,
    pageId: release.slug,
    social: {
      title: release.title,
      description: release.summary,
      url: absolute(releaseUrl(base, release)),
      image: absolute(withBase(base, release.hero)),
      type: 'article',
      published: release.date,
    },
  })
}

export function indexPage({ index, releases, base, siteUrl = '', gaId = null }) {
  const absolute = p => siteUrl.replace(/\/$/, '') + p
  const [newest, ...rest] = releases
  const description = index.intro.trim().split('\n')[0]
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
  return layout({
    title: index.title,
    base,
    body,
    description,
    gaId,
    social: {
      title: index.title,
      description,
      url: absolute(base),
      image: newest ? absolute(withBase(base, newest.hero)) : '',
      type: 'website',
    },
  })
}
