import { visit } from 'unist-util-visit'

const CALLOUT_TYPES = new Set(['note', 'tip', 'warning'])
const DIRECTIVE_TYPES = ['containerDirective']

function setHtml(node, className) {
  node.data ??= {}
  node.data.hName = 'div'
  node.data.hProperties = { className }
}

// Only container directives (:::name) are part of the format. Inline ":name"
// and leaf "::name" forms are restored to the literal text the author wrote,
// so times like "12:24 PM" or a stray colon never turn into a directive.
export function remarkInlineDirectivesAsText() {
  return (tree, file) => {
    const source = String(file.value ?? file)
    visit(tree, ['textDirective', 'leafDirective'], (node, index, parent) => {
      const { start, end } = node.position ?? {}
      const literal = start && end ? source.slice(start.offset, end.offset) : `:${node.name}`
      const text = { type: 'text', value: literal }
      parent.children[index] = node.type === 'leafDirective' ? { type: 'paragraph', children: [text] } : text
    })
  }
}

// Raw HTML in content is shown as text: authors never write markup, so a
// literal tag is a mistake to show, not a thing to execute or silently drop.
// Used by both the HTML render and the markdown export so they agree.
export function remarkHtmlAsText() {
  return tree => {
    visit(tree, 'html', node => {
      node.type = 'text'
    })
  }
}

export function remarkDirectivesToHtml() {
  return (tree, file) => {
    visit(tree, node => {
      if (!DIRECTIVE_TYPES.includes(node.type)) return
      const { name } = node
      if (node.type === 'containerDirective' && name === 'columns') {
        const children = node.children ?? []
        const count = children.filter(c => c.type === 'containerDirective' && c.name === 'column').length
        const onlyColumns = children.every(c => c.type === 'containerDirective' && c.name === 'column')
        if (!onlyColumns || count < 2 || count > 3) {
          file.message(`columns should contain two or three column children and nothing else (found ${count} column${count === 1 ? '' : 's'}${onlyColumns ? '' : ' plus other content'})`, node)
        }
        setHtml(node, ['columns', `columns-${count}`])
        return
      }
      if (node.type === 'containerDirective' && name === 'column') {
        setHtml(node, ['column'])
        return
      }
      if (node.type === 'containerDirective' && name === 'callout') {
        const requested = node.attributes?.type
        const type = CALLOUT_TYPES.has(requested) ? requested : 'note'
        setHtml(node, ['callout', `callout-${type}`])
        return
      }
      file.message(`unknown directive "${name}" rendered as a plain block`, node)
      setHtml(node, ['directive-unknown', `directive-${name}`])
    })
  }
}
