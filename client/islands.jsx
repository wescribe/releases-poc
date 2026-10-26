// React islands: small interactive pieces mounted onto the static page.
// Bundled by esbuild into dist/assets/islands.js. Everything else on the page
// stays plain HTML driven by site/theme.js.
import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createPortal } from 'react-dom'
import { Tooltip } from '@base-ui/react/tooltip'
import { Dialog } from '@base-ui/react/dialog'
import { Menu } from '@base-ui/react/menu'

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

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function ChevronIcon({ direction }) {
  const d = direction === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

// Full-screen image viewer. One dialog serves every zoom button on the page;
// the button's sibling image is what gets shown. If that image sits in a
// carousel, the viewer takes the whole carousel's images and adds previous
// and next arrows (and the arrow keys) that wrap around. Escape, the close
// button and a click on the backdrop all close it. The last set of images
// stays mounted while the dialog fades out.
function Lightbox() {
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState([])
  const [index, setIndex] = useState(0)
  const count = images.length

  useEffect(() => {
    const triggers = Array.from(document.querySelectorAll('.zoom-trigger'))
    const describe = img => ({ src: img.currentSrc || img.src, alt: img.alt })
    const onClick = event => {
      const img = event.currentTarget.parentNode.querySelector('img')
      if (!img) return
      const carousel = img.closest('[data-carousel-list], [data-image-carousel]')
      const group = carousel ? Array.from(carousel.querySelectorAll('.zoomable img')) : [img]
      setImages(group.map(describe))
      setIndex(Math.max(0, group.indexOf(img)))
      setOpen(true)
      track('image_zoom', { alt: img.alt.slice(0, 100), in_carousel: carousel ? 'yes' : 'no' })
    }
    triggers.forEach(t => t.addEventListener('click', onClick))
    return () => triggers.forEach(t => t.removeEventListener('click', onClick))
  }, [])

  function step(direction) {
    if (count < 2) return
    setIndex(i => (i + direction + count) % count)
    track('image_zoom_nav', { direction: direction > 0 ? 'next' : 'previous' })
  }

  // Arrow keys move through the set. Focus sits inside the popup while it is
  // open, so the popup's own handler catches them; the document listener is a
  // fallback for when focus is elsewhere (for example after a backdrop click).
  function onKeyDown(event) {
    if (count < 2) return
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1) }
  }
  useEffect(() => {
    if (!open || count < 2) return undefined
    const onDocumentKey = event => {
      if (event.defaultPrevented) return
      onKeyDown(event)
    }
    document.addEventListener('keydown', onDocumentKey)
    return () => document.removeEventListener('keydown', onDocumentKey)
  }, [open, count])

  const image = images[index]
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="lightbox-backdrop" />
        <Dialog.Popup className="lightbox-popup" aria-label={image?.alt ? undefined : 'Image'} onKeyDown={onKeyDown}>
          {image?.alt && <Dialog.Title className="lightbox-title">{image.alt}</Dialog.Title>}
          {count > 1 && <span className="lightbox-count" aria-live="polite">{index + 1} of {count}</span>}
          {image && <img key={image.src} className="lightbox-image" src={image.src} alt={image.alt} />}
          {count > 1 && (
            <button type="button" className="lightbox-arrow lightbox-prev" aria-label="Previous image" onClick={() => step(-1)}><ChevronIcon direction="left" /></button>
          )}
          {count > 1 && (
            <button type="button" className="lightbox-arrow lightbox-next" aria-label="Next image" onClick={() => step(1)}><ChevronIcon direction="right" /></button>
          )}
          <Dialog.Close className="lightbox-close" aria-label="Close"><CloseIcon /></Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Rail dropdowns ("Share this page", "More actions"). The server renders a
// toggle button and a list of links; the island re-renders them as a Base UI
// menu whose popup lives in a portal and avoids the viewport edges, so an
// open menu can never widen the page. The classes are the same, so the look
// is unchanged.
function RailMenu({ toggleClass, toggleHtml, menuClass, items, onPick }) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger className={toggleClass} dangerouslySetInnerHTML={{ __html: toggleHtml }} />
      <Menu.Portal>
        <Menu.Positioner className="menu-positioner" side="bottom" align="start" sideOffset={6} collisionPadding={16}>
          <Menu.Popup className={menuClass}>
            {items.map(item => (
              <Menu.LinkItem
                key={item.key}
                className={item.className || undefined}
                href={item.href}
                target={item.target || undefined}
                rel={item.rel || undefined}
                onClick={() => onPick(item.key)}
                dangerouslySetInnerHTML={{ __html: item.html }}
              />
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

// Each network's share URL is built from the page URL plus a generated
// message, where the network accepts one. Email and SMS open in place.
function shareUrls(menu) {
  const pageUrl = location.origin + location.pathname
  const message = menu.getAttribute('data-message') || document.title
  const subject = menu.getAttribute('data-subject') || document.title
  const enc = encodeURIComponent
  return {
    facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + enc(pageUrl),
    x: 'https://x.com/intent/post?text=' + enc(message) + '&url=' + enc(pageUrl),
    linkedin: 'https://www.linkedin.com/feed/?shareActive=true&text=' + enc(message + ' ' + pageUrl),
    whatsapp: 'https://wa.me/?text=' + enc(message + ' ' + pageUrl),
    telegram: 'https://t.me/share/url?url=' + enc(pageUrl) + '&text=' + enc(message),
    email: 'mailto:?subject=' + enc(subject) + '&body=' + enc(message + '\n\n' + pageUrl),
    sms: 'sms:?&body=' + enc(message + ' ' + pageUrl),
  }
}

// Read a server-rendered rail menu, empty its container and describe it for RailMenu.
function readMenu(selector, toggleClass, menuClass, dataKey, hrefFor) {
  const container = document.querySelector(selector)
  const toggle = container && container.querySelector('.' + toggleClass)
  const menu = container && container.querySelector('.' + menuClass)
  if (!toggle || !menu) return null
  const items = Array.from(menu.querySelectorAll('a[' + dataKey + ']')).map(a => {
    const key = a.getAttribute(dataKey)
    return { key, className: a.getAttribute('class'), href: hrefFor(key, a, menu), target: a.getAttribute('target'), rel: a.getAttribute('rel'), html: a.innerHTML }
  })
  const toggleHtml = toggle.innerHTML
  container.replaceChildren()
  return { container, toggleHtml, items }
}

// Replace each server-rendered copy-link button with a host span, then render
// every island from one root so the tooltips share one provider.
const hosts = Array.from(document.querySelectorAll('button.section-link')).map(button => {
  const host = document.createElement('span')
  host.className = 'section-link-host'
  button.replaceWith(host)
  return { host, anchor: button.getAttribute('data-anchor') }
})

const hasZoom = document.querySelector('.zoom-trigger') !== null

const share = readMenu('.share', 'share-toggle', 'share-menu', 'data-share', (key, a, menu) => shareUrls(menu)[key] || a.getAttribute('href'))
if (share) share.items.forEach(item => { if (item.key === 'email' || item.key === 'sms') item.target = null })
const actions = readMenu('.actions', 'actions-toggle', 'actions-menu', 'data-action', (key, a) => a.getAttribute('href'))

if (hosts.length || hasZoom || share || actions) {
  const mount = document.createElement('div')
  mount.hidden = true
  document.body.appendChild(mount)
  createRoot(mount).render(
    <>
      <Tooltip.Provider delay={150}>
        {hosts.map(({ host, anchor }) => createPortal(<SectionLink anchor={anchor} />, host, anchor))}
      </Tooltip.Provider>
      {hasZoom && <Lightbox />}
      {share && createPortal(
        <RailMenu toggleClass="share-toggle" toggleHtml={share.toggleHtml} menuClass="share-menu" items={share.items}
          onPick={key => track('share', { method: key, content_type: 'release' })} />,
        share.container, 'share')}
      {actions && createPortal(
        <RailMenu toggleClass="actions-toggle" toggleHtml={actions.toggleHtml} menuClass="actions-menu" items={actions.items}
          onPick={key => track('open_in_ai', { assistant: key })} />,
        actions.container, 'actions')}
    </>
  )
}
