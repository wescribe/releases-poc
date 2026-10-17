import { visit } from 'unist-util-visit'

const CALLOUT_TYPES = new Set(['note', 'tip', 'warning'])
const DIRECTIVE_TYPES = ['containerDirective', 'leafDirective', 'textDirective']

function setHtml(node, className) {
  node.data ??= {}
  node.data.hName = 'div'
  node.data.hProperties = { className }
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
