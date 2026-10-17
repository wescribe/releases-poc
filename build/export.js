import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkStringify from 'remark-stringify'
import { formatDate } from './content.js'
import { remarkInlineDirectivesAsText } from './directives.js'

// Replace every directive with its children so only plain markdown remains.
function unwrap(nodes) {
  const out = []
  for (const node of nodes) {
    if (node.type === 'containerDirective') {
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
  const parser = unified().use(remarkParse).use(remarkDirective).use(remarkInlineDirectivesAsText).use(remarkStripDirectives)
  const tree = parser.runSync(parser.parse(release.body), release.body)
  const body = unified()
    .use(remarkStringify, { bullet: '-', emphasis: '_', strong: '*', rule: '-' })
    .stringify(tree)
  const header = [
    `# ${release.title}`,
    '',
    release.summary,
    '',
    `Released ${formatDate(release.date)} · Version ${release.version}`,
    '',
  ].join('\n')
  return `${header}\n${String(body).trim()}\n`
}
