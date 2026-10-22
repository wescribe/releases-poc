import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import { formatDate } from './content.js'
import { remarkInlineDirectivesAsText, remarkHtmlAsText, isItem } from './directives.js'

// Replace every directive with its children so only plain markdown remains.
// A carousel-list becomes a bulleted list of its items; the images are layout.
function unwrap(nodes) {
  const out = []
  for (const node of nodes) {
    if (node.type === 'containerDirective' && node.name === 'carousel-list') {
      const children = node.children ?? []
      out.push(...unwrap(children.filter(c => !isItem(c))))
      const items = children.filter(isItem).map(item => ({ type: 'listItem', spread: false, children: unwrap(item.children ?? []) }))
      if (items.length) out.push({ type: 'list', ordered: false, spread: false, children: items })
    } else if (node.type === 'containerDirective') {
      out.push(...unwrap(node.children ?? []))
    } else {
      if (Array.isArray(node.children)) node.children = unwrap(node.children)
      out.push(node)
    }
  }
  return out
}

function remarkStripDirectives() {
  return tree => {
    tree.children = unwrap(tree.children)
  }
}

export function exportMarkdown(release) {
  // Parse with the directive extension, then stringify WITHOUT it: the
  // directive stringifier would otherwise escape every ":" in plain prose.
  // GFM is on both sides so tables and strikethrough survive unescaped.
  const parser = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkInlineDirectivesAsText)
    .use(remarkHtmlAsText)
    .use(remarkStripDirectives)
  const tree = parser.runSync(parser.parse(release.body), release.body)
  const body = unified()
    .use(remarkGfm)
    .use(remarkStringify, { bullet: '-', emphasis: '_', strong: '*', rule: '-' })
    .stringify(tree)
  const header = [
    `# ${release.title}`,
    '',
    release.summary,
    '',
    release.version ? `Released ${formatDate(release.date)} · Version ${release.version}` : `Released ${formatDate(release.date)}`,
    '',
  ].join('\n')
  return `${header}\n${String(body).trim()}\n`
}
