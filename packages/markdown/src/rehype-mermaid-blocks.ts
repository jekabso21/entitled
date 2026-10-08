import type { Element, Root } from 'hast'
import { toString } from 'hast-util-to-string'

function isMermaidCode(node: Element) {
  const classes = node.properties.className
  return Array.isArray(classes) && classes.includes('language-mermaid')
}

// Turns ```mermaid fences into <pre class="mermaid"> so the browser can draw them,
// and keeps them away from the syntax highlighter.
export function rehypeMermaidBlocks() {
  return (tree: Root) => {
    const visit = (parent: Root | Element) => {
      for (const [index, child] of parent.children.entries()) {
        if (child.type !== 'element') continue
        const [code] = child.children
        if (child.tagName === 'pre' && code?.type === 'element' && isMermaidCode(code)) {
          parent.children[index] = {
            type: 'element',
            tagName: 'pre',
            properties: { className: ['mermaid'] },
            children: [{ type: 'text', value: toString(code) }],
          }
        } else {
          visit(child)
        }
      }
    }
    visit(tree)
  }
}
