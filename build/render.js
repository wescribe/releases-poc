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
    .use(rehypeStringify)
    .processSync(markdown)
  return { html: String(file), headings, warnings: file.messages.map(m => m.reason) }
}
