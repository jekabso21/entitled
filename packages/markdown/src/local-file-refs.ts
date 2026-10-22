// Image and link targets in Markdown, e.g. ![Pinout](img/pinout.png) or [Datasheet](ds.pdf).
const REFERENCE = /(!?\[[^\]]*\]\()(\s*<?)([^)\s>]+)(>?(?:\s+"[^"]*")?\s*\))/g

function isLocal(target: string) {
  return !/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(target)
}

// Strips ./ and query or fragment, and decodes %20 and similar.
export function normalizeLocalPath(target: string) {
  const path = target.split(/[?#]/)[0] ?? ''
  try {
    return decodeURI(path).replace(/^\.\//, '')
  } catch {
    return path.replace(/^\.\//, '')
  }
}

// Relative targets that point at files next to the Markdown document.
export function findLocalFileRefs(markdown: string): string[] {
  const found = new Set<string>()
  for (const match of markdown.matchAll(REFERENCE)) {
    const target = match[3]
    if (target && isLocal(target)) found.add(target)
  }
  return [...found]
}

export function replaceFileRefs(markdown: string, urls: ReadonlyMap<string, string>) {
  return markdown.replace(
    REFERENCE,
    (whole, open: string, before: string, target: string, close: string) => {
      const url = urls.get(target)
      return url === undefined ? whole : `${open}${before}${url}${close}`
    },
  )
}

// Turns references to files that could not be found into their plain link text, so a page
// never ships a broken link or image.
export function unlinkFileRefs(markdown: string, targets: ReadonlySet<string>) {
  return markdown.replace(REFERENCE, (whole, open: string, _before: string, target: string) => {
    if (!targets.has(target)) return whole
    return open.slice(open.startsWith('!') ? 2 : 1, -2)
  })
}
