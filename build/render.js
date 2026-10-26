import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import { remarkDirectivesToHtml, remarkInlineDirectivesAsText, remarkHtmlAsText } from './directives.js'

export function withBase(base, url) {
  if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) return base + url.slice(1)
  return url
}

function rehypeCollectAndRebase({ base, headings }) {
  return tree => {
    visit(tree, 'element', node => {
      if (node.tagName === 'h2' && node.properties?.id) {
        headings.push({ id: String(node.properties.id), text: toString(node) })
      }
      for (const attr of ['src', 'href']) {
        if (node.properties?.[attr] !== undefined) node.properties[attr] = withBase(base, node.properties[attr])
      }
    })
  }
}

const LINK_ICON = {
  type: 'element', tagName: 'svg',
  properties: { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', ariaHidden: 'true' },
  children: [
    { type: 'element', tagName: 'path', properties: { d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' }, children: [] },
    { type: 'element', tagName: 'path', properties: { d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' }, children: [] },
  ],
}

function hasHeading(node) {
  if (node.type !== 'element') return false
  if (node.tagName === 'h2') return true
  return (node.children ?? []).some(hasHeading)
}

// Every level-two heading gets a button that copies a URL to it, and each
// heading's content, from the heading (or the columns block holding it) up to
// the next, is wrapped in a section so the whole thing can be highlighted.
function rehypeSections() {
  return tree => {
    visit(tree, 'element', node => {
      if (node.tagName !== 'h2' || !node.properties?.id) return
      const label = 'Copy URL to this section'
      node.children.push({
        type: 'element', tagName: 'button',
        properties: { className: ['section-link'], type: 'button', title: label, ariaLabel: label, dataAnchor: String(node.properties.id) },
        children: [LINK_ICON],
      })
    })
    const out = []
    let section = null
    for (const child of tree.children) {
      if (hasHeading(child)) {
        section = { type: 'element', tagName: 'section', properties: { className: ['section'] }, children: [] }
        out.push(section)
      }
      ;(section ? section.children : out).push(child)
    }
    tree.children = out
  }
}

const ZOOM_ICON = {
  type: 'element', tagName: 'svg',
  properties: { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', ariaHidden: 'true' },
  children: [
    { type: 'element', tagName: 'polyline', properties: { points: '15 3 21 3 21 9' }, children: [] },
    { type: 'element', tagName: 'polyline', properties: { points: '9 21 3 21 3 15' }, children: [] },
    { type: 'element', tagName: 'line', properties: { x1: 21, y1: 3, x2: 14, y2: 10 }, children: [] },
    { type: 'element', tagName: 'line', properties: { x1: 3, y1: 21, x2: 10, y2: 14 }, children: [] },
  ],
}

// Every image in the content is wrapped with a button that opens it full
// screen (client/islands.jsx). A carousel image's hidden flag moves to the
// wrapper, which is what the carousel shows and hides.
function rehypeZoomableImages() {
  return tree => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'img' || !parent) return
      const hidden = node.properties?.hidden === true
      if (hidden) delete node.properties.hidden
      const button = {
        type: 'element', tagName: 'button',
        properties: { className: ['zoom-trigger'], type: 'button', ariaLabel: 'View full screen' },
        children: [ZOOM_ICON],
      }
      parent.children[index] = { type: 'element', tagName: 'span', properties: { className: ['zoomable'], hidden }, children: [node, button] }
    })
  }
}

export function renderMarkdown(markdown, { base = '/' } = {}) {
  const headings = []
  const file = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkInlineDirectivesAsText)
    .use(remarkDirectivesToHtml)
    .use(remarkHtmlAsText)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeCollectAndRebase, { base, headings })
    .use(rehypeSections)
    .use(rehypeZoomableImages)
    .use(rehypeStringify)
    .processSync(markdown)
  return { html: String(file), headings, warnings: file.messages.map(m => m.reason) }
}
