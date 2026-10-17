import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import { remarkDirectivesToHtml, remarkInlineDirectivesAsText } from './directives.js'

export function withBase(base, url) {
  if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) return base + url.slice(1)
  return url
}

// Raw HTML in content is shown as text: authors never write markup, so a
// literal tag is a mistake to show, not a thing to execute or silently drop.
function remarkHtmlAsText() {
  return tree => {
    visit(tree, 'html', node => {
      node.type = 'text'
    })
  }
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

export function renderMarkdown(markdown, { base = '/' } = {}) {
  const headings = []
  const file = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkInlineDirectivesAsText)
    .use(remarkDirectivesToHtml)
    .use(remarkHtmlAsText)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeCollectAndRebase, { base, headings })
    .use(rehypeStringify)
    .processSync(markdown)
  return { html: String(file), headings, warnings: file.messages.map(m => m.reason) }
}
