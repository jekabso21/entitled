// Links between docs pages use the client URL, /products/{productId}/docs/{pageId}, which
// keeps working when a page is renamed or moved.
const PAGE_LINK = /\[([^\]]*)\]\(\/products\/([0-9a-f-]{36})\/docs\/([0-9a-f-]{36})(?:#[^)\s]*)?\)/g

export type DocPageLink = { text: string; productId: string; pageId: string }

export function docPageLinkUrl(productId: string, pageId: string) {
  return `/products/${productId}/docs/${pageId}`
}

export function findDocPageLinks(markdown: string): DocPageLink[] {
  return [...markdown.matchAll(PAGE_LINK)].map((match) => ({
    text: match[1] ?? '',
    productId: match[2] ?? '',
    pageId: match[3] ?? '',
  }))
}
