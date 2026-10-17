import type { Element, Root } from 'hast'

const VIDEO_SOURCE = /\.(mp4|webm)(?:[?#].*)?$/i

// `![Demo](clip.mp4)` stays portable Markdown but renders as a playable video.
// Runs after sanitizing, so the src it copies has already passed the URL rules.
export function rehypeVideoEmbeds() {
  return (tree: Root) => {
    const visit = (parent: Root | Element) => {
      for (const [index, child] of parent.children.entries()) {
        if (child.type !== 'element') continue
        const src = child.properties.src
        if (child.tagName === 'img' && typeof src === 'string' && VIDEO_SOURCE.test(src)) {
          parent.children[index] = {
            type: 'element',
            tagName: 'video',
            properties: {
              src,
              controls: true,
              preload: 'metadata',
              ariaLabel:
                typeof child.properties.alt === 'string' ? child.properties.alt : undefined,
            },
            children: [],
          }
        } else {
          visit(child)
        }
      }
    }
    visit(tree)
  }
}
