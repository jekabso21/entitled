// Collects Markdown blocks while lines of a converted PDF are read top to bottom.
export type PdfLine = {
  text: string
  plain: string
  x: number
  y: number
  fontSize: number
  isBold: boolean
  isMono: boolean
  page: number
}

export type ListItem = { marker: '-' | '1.'; text: string; x: number }

export class BlockWriter {
  readonly blocks: string[] = []
  #paragraph: PdfLine[] = []
  #items: ListItem[] = []
  #code: PdfLine[] = []

  get hasOpenParagraph() {
    return this.#paragraph.length > 0
  }

  get lastParagraphLine() {
    return this.#paragraph.at(-1)
  }

  get currentItem() {
    return this.#items.at(-1)
  }

  paragraphLine(line: PdfLine, startsNew: boolean) {
    this.#flushList()
    this.#flushCode()
    if (startsNew) this.#flushParagraph()
    this.#paragraph.push(line)
  }

  listItem(item: ListItem) {
    this.#flushParagraph()
    this.#flushCode()
    if (this.currentItem && this.currentItem.marker !== item.marker) this.#flushList()
    this.#items.push(item)
  }

  continueItem(text: string) {
    const item = this.currentItem
    if (item) item.text += ` ${text}`
  }

  codeLine(line: PdfLine) {
    this.#flushParagraph()
    this.#flushList()
    this.#code.push(line)
  }

  heading(level: number, text: string, continuesPrevious: boolean) {
    this.flush()
    const prefix = '#'.repeat(level)
    const last = this.blocks.at(-1)
    if (continuesPrevious && last?.startsWith(`${prefix} `)) {
      this.blocks[this.blocks.length - 1] = `${last} ${text}`
    } else {
      this.blocks.push(`${prefix} ${text}`)
    }
  }

  image(ref: string) {
    this.flush()
    this.blocks.push(`![](${ref})`)
  }

  // Ends lists and code at a page break but lets an unfinished sentence run on.
  pageBreak() {
    const last = this.lastParagraphLine
    if (!last || /[.!?:]$/.test(last.plain)) this.flush()
    else {
      this.#flushList()
      this.#flushCode()
    }
  }

  flush() {
    this.#flushParagraph()
    this.#flushList()
    this.#flushCode()
  }

  #flushParagraph() {
    if (this.#paragraph.length === 0) return
    let text = ''
    for (const line of this.#paragraph) {
      const isHyphenated = /[a-z]-$/i.test(text) && /^[a-z]/.test(line.text)
      text = isHyphenated ? text.slice(0, -1) + line.text : text + (text ? ' ' : '') + line.text
    }
    this.blocks.push(text.replace(/^(#|>|[-+]\s|\d+\.\s)/, '\\$1'))
    this.#paragraph = []
  }

  #flushList() {
    if (this.#items.length === 0) return
    this.blocks.push(this.#items.map((item) => `${item.marker} ${item.text}`).join('\n'))
    this.#items = []
  }

  #flushCode() {
    if (this.#code.length === 0) return
    const minX = Math.min(...this.#code.map((line) => line.x))
    const indent = (line: PdfLine) =>
      ' '.repeat(Math.max(0, Math.round((line.x - minX) / (line.fontSize * 0.6))))
    const body = this.#code.map((line) => indent(line) + line.plain).join('\n')
    this.blocks.push(`\`\`\`\n${body}\n\`\`\``)
    this.#code = []
  }
}
