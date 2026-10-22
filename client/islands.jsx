// React islands: small interactive pieces mounted onto the static page.
// Bundled by esbuild into dist/assets/islands.js. Everything else on the page
// stays plain HTML driven by site/theme.js.
import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createPortal } from 'react-dom'
import { Tooltip } from '@base-ui/react/tooltip'

const release = document.body.getAttribute('data-release') || 'index'

// Custom Google Analytics events. No-op when the tag is not loaded (dev server).
function track(name, params) {
  if (typeof window.gtag === 'function') window.gtag('event', name, { release, ...params })
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text)
  return new Promise((resolve, reject) => {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    let ok = false
    try { ok = document.execCommand('copy') } catch (e) { ok = false }
    document.body.removeChild(area)
    ok ? resolve() : reject(new Error('copy failed'))
  })
}

const LABEL = 'Copy URL to this section'

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

// The copy-link button beside a section heading. The tooltip names the action
// until a copy succeeds, then reads "Copied" for a moment.
function SectionLink({ anchor }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  function onClick() {
    copyText(`${location.origin}${location.pathname}#${anchor}`).then(() => {
      setCopied(true)
      setOpen(true)
      track('section_link_copy', { section_id: anchor })
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1500)
    }).catch(() => { /* clipboard unavailable; nothing to confirm */ })
  }

  return (
    <Tooltip.Root open={open} onOpenChange={setOpen}>
      <Tooltip.Trigger className="section-link" aria-label={LABEL} data-anchor={anchor} closeOnClick={false} onClick={onClick}>
        <LinkIcon />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner className="tooltip-positioner" side="top" sideOffset={6}>
          <Tooltip.Popup className="tooltip-popup">{copied ? 'Copied' : LABEL}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

// Replace each server-rendered copy-link button with a host span, then render
// every island from one root so the tooltips share one provider.
const hosts = Array.from(document.querySelectorAll('button.section-link')).map(button => {
  const host = document.createElement('span')
  host.className = 'section-link-host'
  button.replaceWith(host)
  return { host, anchor: button.getAttribute('data-anchor') }
})

if (hosts.length) {
  const mount = document.createElement('div')
  mount.hidden = true
  document.body.appendChild(mount)
  createRoot(mount).render(
    <Tooltip.Provider delay={150}>
      {hosts.map(({ host, anchor }) => createPortal(<SectionLink anchor={anchor} />, host, anchor))}
    </Tooltip.Provider>
  )
}
