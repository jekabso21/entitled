// Uses the first `# ` heading, falling back to the file name without its extension.
export function titleFromMarkdown(markdown: string, fileName: string) {
  const heading = /^#\s+(.+?)\s*#*\s*$/m.exec(markdown)?.[1]
  return (heading ?? fileName.replace(/\.(md|markdown)$/i, '')).slice(0, 200)
}
