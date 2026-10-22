import { visit } from 'unist-util-visit'

const CALLOUT_TYPES = new Set(['note', 'tip', 'warning'])
const DIRECTIVE_TYPES = ['containerDirective']

function setHtml(node, className, extra = {}) {
  node.data ??= {}
  node.data.hName = 'div'
  node.data.hProperties = { className, ...extra }
}

// A synthetic node that becomes one HTML element. Its type is outside
// DIRECTIVE_TYPES so the directive visitor passes over it, but still descends
// into its children, which are ordinary markdown nodes.
function part(hName, hProperties, children = []) {
  return { type: 'carouselPart', data: { hName, hProperties }, children }
}

export function isItem(node) {
  return node.type === 'containerDirective' && node.name === 'item'
}

// The inline content of an item: its paragraphs' children joined by spaces.
// Anything that is not a paragraph is kept as-is so it stays visible.
function inlineContent(item) {
  const out = []
  for (const child of item.children ?? []) {
    if (out.length) out.push({ type: 'text', value: ' ' })
    if (child.type === 'paragraph') out.push(...child.children)
    else out.push(child)
  }
  return out
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

// carousel-list: a list of items on the left, one image on the right. The
// first item starts active; theme.js advances through the rest and swaps the
// image. Each item's text becomes a button so a click can select it.
function carouselListToHtml(node, file) {
  const children = node.children ?? []
  const items = children.filter(isItem)
  const others = children.filter(c => !isItem(c))
  if (others.length) file.message('carousel-list should contain only item children', node)
  if (items.length < 2) file.message('carousel-list needs at least two items', node)
  const triggers = items.map((item, i) => {
    if (!item.attributes?.image) file.message('carousel-list item has no image attribute', item)
    const button = part('button', { className: ['carousel-list-trigger'], type: 'button', ariaPressed: i === 0 ? 'true' : 'false', dataIndex: String(i) }, inlineContent(item))
    return part('li', { className: ['carousel-list-item'] }, [button])
  })
  const images = items.map((item, i) => part('img', {
    className: ['carousel-list-image'], dataIndex: String(i),
    src: item.attributes?.image ?? '', alt: item.attributes?.alt ?? '', hidden: i > 0,
  }))
  setHtml(node, ['carousel-list'], { dataCarouselList: true })
  node.children = [...others, part('ol', { className: ['carousel-list-items'] }, triggers), part('div', { className: ['carousel-list-visual'] }, images)]
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
      if (node.type === 'containerDirective' && name === 'carousel-list') {
        carouselListToHtml(node, file)
        return
      }
      file.message(`unknown directive "${name}" rendered as a plain block`, node)
      setHtml(node, ['directive-unknown', `directive-${name}`])
    })
  }
}
