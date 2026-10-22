import type { Element, Root } from 'hast'
import { toString } from 'hast-util-to-string'
import type { VFile } from 'vfile'
import { slugifyHeading } from './slugify-heading.ts'

export type DocHeading = { id: string; text: string; depth: number }

const LINKED = new Set(['h2', 'h3', 'h4'])

function anchor(id: string, text: string): Element {
  return {
    type: 'element',
    tagName: 'a',
    properties: {
      href: `#${id}`,
      className: ['heading-anchor'],
      ariaLabel: `Link to ${text}`,
    },
    children: [{ type: 'text', value: '#' }],
  }
}

// Runs after sanitizing, so the ids are ours and need no user-content- prefix. The headings it
// finds become the page's table of contents.
export function rehypeHeadingAnchors() {
  return (tree: Root, file: VFile) => {
    const used = new Map<string, number>()
    const headings: DocHeading[] = []
    for (const node of tree.children) {
      if (node.type !== 'element' || !LINKED.has(node.tagName)) continue
      const text = toString(node).trim()
      const base = slugifyHeading(text)
      const count = used.get(base) ?? 0
      used.set(base, count + 1)
      const id = count ? `${base}-${String(count)}` : base
      node.properties.id = id
      node.children.push(anchor(id, text))
      headings.push({ id, text, depth: Number(node.tagName.slice(1)) })
    }
    file.data.headings = headings
  }
}

declare module 'vfile' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- declaration merging needs an interface
  interface DataMap {
    headings: DocHeading[]
  }
}
