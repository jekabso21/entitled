import type { Element, ElementContent, Root, RootContent } from 'hast'
import { toString } from 'hast-util-to-string'

// Wiki.js syntax: a heading ending in {.tabset} turns its sub-headings into tabs. Other
// Markdown tools show plain headings, so pages stay readable outside the portal.
const MARKER = /\s*\{\.tabset\}\s*$/

type Tab = { title: string; content: ElementContent[] }

function headingLevel(node: RootContent) {
  if (node.type !== 'element') return null
  const match = /^h([1-6])$/.exec(node.tagName)
  return match ? Number(match[1]) : null
}

function stripMarker(heading: Element) {
  const last = heading.children.at(-1)
  if (last?.type === 'text') last.value = last.value.replace(MARKER, '')
}

function isTabset(node: RootContent): node is Element {
  return node.type === 'element' && headingLevel(node) !== null && MARKER.test(toString(node))
}

function element(tagName: string, properties: Element['properties'], children: ElementContent[]) {
  return { type: 'element', tagName, properties, children } satisfies Element
}

function renderTabs(tabs: readonly Tab[], key: string): Element {
  const buttons = tabs.map((tab, index) =>
    element(
      'button',
      {
        type: 'button',
        role: 'tab',
        id: `${key}-tab-${String(index)}`,
        ariaControls: [`${key}-panel-${String(index)}`],
        ariaSelected: index === 0 ? 'true' : 'false',
        tabIndex: index === 0 ? 0 : -1,
      },
      [{ type: 'text', value: tab.title }],
    ),
  )
  const panels = tabs.map((tab, index) =>
    element(
      'div',
      {
        role: 'tabpanel',
        id: `${key}-panel-${String(index)}`,
        ariaLabelledBy: [`${key}-tab-${String(index)}`],
        hidden: index !== 0,
      },
      tab.content,
    ),
  )
  return element('div', { className: ['doc-tabs'] }, [
    element('div', { role: 'tablist', className: ['doc-tabs-list'] }, buttons),
    ...panels,
  ])
}

// Splits the section under a tabset heading into tabs at its next heading level.
function collectSection(children: readonly RootContent[], start: number, level: number) {
  const intro: RootContent[] = []
  const tabs: Tab[] = []
  let end = start
  for (; end < children.length; end++) {
    const node = children[end]
    if (!node) break
    const nodeLevel = headingLevel(node)
    if (nodeLevel !== null && nodeLevel <= level) break
    const current = tabs.at(-1)
    if (nodeLevel === level + 1 && node.type === 'element') {
      tabs.push({ title: toString(node).trim(), content: [] })
    } else if (current && node.type !== 'doctype') {
      current.content.push(node)
    } else {
      intro.push(node)
    }
  }
  return { intro, tabs, end }
}

export function rehypeDocTabs() {
  return (tree: Root) => {
    const output: RootContent[] = []
    let count = 0
    let index = 0
    while (index < tree.children.length) {
      const node = tree.children[index]
      index++
      if (!node) break
      if (!isTabset(node)) {
        output.push(node)
        continue
      }
      stripMarker(node)
      const section = collectSection(tree.children, index, headingLevel(node) ?? 1)
      output.push(node, ...section.intro)
      if (section.tabs.length) output.push(renderTabs(section.tabs, `tabs-${String(count++)}`))
      index = section.end
    }
    tree.children = output
  }
}
