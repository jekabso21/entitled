// GitHub-style anchors: lower case, punctuation dropped, spaces become dashes.
export function slugifyHeading(text: string) {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
  return slug || 'section'
}
