import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkStringify from 'remark-stringify'
import { formatDate } from './content.js'

// Replace every directive with its children so only plain markdown remains.
function unwrap(nodes) {
  const out = []
  for (const node of nodes) {
    if (node.type === 'containerDirective' || node.type === 'textDirective') {
      out.push(...unwrap(node.children ?? []))
    } else if (node.type === 'leafDirective') {
      continue
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
  const body = unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkStripDirectives)
    .use(remarkStringify, { bullet: '-', emphasis: '_', strong: '*', rule: '-' })
    .processSync(release.body)
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
