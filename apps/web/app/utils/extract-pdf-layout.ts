import type {
  PdfImage,
  PdfPageLayout,
  PdfTextItem,
} from '@entitled/markdown/pdf-layout-to-markdown'

type Matrix = [number, number, number, number, number, number]
type PdfJs = typeof import('pdfjs-dist')
type PdfPage = Awaited<ReturnType<Awaited<ReturnType<PdfJs['getDocument']>['promise']>['getPage']>>

export type ExtractedPdf = { layouts: PdfPageLayout[]; images: Map<string, File> }

// Images smaller than this are rules, bullets or icons, not content.
const MIN_IMAGE_SIDE = 48
const MAX_IMAGES = 300

function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ]
}

function asMatrix(value: unknown): Matrix | null {
  if (!Array.isArray(value) || value.length < 6) return null
  const numbers = value.slice(0, 6).map(Number)
  if (numbers.some((n) => !Number.isFinite(n))) return null
  const [a = 1, b = 0, c = 0, d = 1, e = 0, f = 0] = numbers
  return [a, b, c, d, e, f]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function fontNameOf(page: PdfPage, fontId: string): string {
  if (!page.commonObjs.has(fontId)) return ''
  const font: unknown = page.commonObjs.get(fontId)
  return isRecord(font) && typeof font.name === 'string' ? font.name : ''
}

function textItems(page: PdfPage, content: Awaited<ReturnType<PdfPage['getTextContent']>>) {
  const items: PdfTextItem[] = []
  for (const item of content.items) {
    if (!('str' in item)) continue
    const transform = asMatrix(item.transform)
    if (!transform) continue
    const fontName = fontNameOf(page, item.fontName)
    const family = String(content.styles[item.fontName]?.fontFamily ?? '')
    items.push({
      text: item.str,
      x: transform[4],
      y: transform[5],
      width: item.width,
      fontSize: Math.hypot(transform[2], transform[3]),
      isBold: /bold|black|heavy|semibold/i.test(fontName),
      isMono: family === 'monospace' || /mono|courier|consol/i.test(fontName),
    })
  }
  return items
}

async function imageObject(page: PdfPage, id: string): Promise<unknown> {
  const store = id.startsWith('g_') ? page.commonObjs : page.objs
  return new Promise((resolve) => {
    store.get(id, resolve)
  })
}

// pdf.js hands images over as raw pixels in one of three packings (ImageKind).
function toRgba(src: Uint8Array | Uint8ClampedArray, kind: unknown, width: number, height: number) {
  const pixels = width * height
  if (kind === 3) return new Uint8ClampedArray(src.subarray(0, pixels * 4))
  const rgba = new Uint8ClampedArray(pixels * 4)
  if (kind === 2) {
    for (let i = 0; i < pixels; i += 1) {
      rgba.set([src[i * 3] ?? 0, src[i * 3 + 1] ?? 0, src[i * 3 + 2] ?? 0, 255], i * 4)
    }
    return rgba
  }
  if (kind !== 1) return null
  const rowBytes = Math.ceil(width / 8)
  for (let i = 0; i < pixels; i += 1) {
    const x = i % width
    const byte = src[Math.floor(i / width) * rowBytes + (x >> 3)] ?? 0
    const value = ((byte >> (7 - (x & 7))) & 1) * 255
    rgba.set([value, value, value, 255], i * 4)
  }
  return rgba
}

async function imageToFile(data: unknown, name: string): Promise<File | null> {
  if (!isRecord(data)) return null
  const width = Number(data.width)
  const height = Number(data.height)
  if (!(width >= MIN_IMAGE_SIDE && height >= MIN_IMAGE_SIDE)) return null
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  if (data.bitmap instanceof ImageBitmap) {
    ctx.drawImage(data.bitmap, 0, 0)
  } else {
    const src = data.data
    if (!(src instanceof Uint8Array || src instanceof Uint8ClampedArray)) return null
    const rgba = toRgba(src, data.kind, width, height)
    if (!rgba) return null
    ctx.putImageData(new ImageData(rgba, width, height), 0, 0)
  }
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png')
  })
  return blob ? new File([blob], name, { type: 'image/png' }) : null
}

function bounds(ctm: Matrix, ref: string): PdfImage {
  const xs = [ctm[4], ctm[4] + ctm[0], ctm[4] + ctm[2], ctm[4] + ctm[0] + ctm[2]]
  const ys = [ctm[5], ctm[5] + ctm[1], ctm[5] + ctm[3], ctm[5] + ctm[1] + ctm[3]]
  return {
    ref,
    x: Math.min(...xs),
    y: Math.max(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  }
}

type ImageCollector = { files: Map<string, File>; seen: Map<string, string>; pageNumber: number }

// Returns the placeholder for an image, extracting it the first time it is drawn so a logo
// repeated on every page is stored once.
async function collectImage(
  page: PdfPage,
  id: string | null,
  inline: unknown,
  into: ImageCollector,
) {
  const known = id ? into.seen.get(id) : undefined
  if (known) return known
  if (into.files.size >= MAX_IMAGES) return null
  const data = id ? await imageObject(page, id) : inline
  const name = `page-${String(into.pageNumber)}-image-${String(into.files.size + 1)}.png`
  const file = await imageToFile(data, name)
  if (!file) return null
  const ref = `asset:${String(into.files.size)}`
  into.files.set(ref, file)
  if (id) into.seen.set(id, ref)
  return ref
}

// Walks the drawing operators to find where each image lands on the page.
async function pageImages(pdfjs: PdfJs, page: PdfPage, into: ImageCollector): Promise<PdfImage[]> {
  const { fnArray, argsArray } = await page.getOperatorList()
  const { OPS } = pdfjs
  const images: PdfImage[] = []
  const stack: Matrix[] = []
  let ctm: Matrix = [1, 0, 0, 1, 0, 0]
  for (let i = 0; i < fnArray.length; i += 1) {
    const fn = fnArray[i]
    const args: unknown = argsArray[i]
    const first: unknown = Array.isArray(args) ? args[0] : null
    if (fn === OPS.save) stack.push(ctm)
    else if (fn === OPS.restore || fn === OPS.paintFormXObjectEnd) ctm = stack.pop() ?? ctm
    else if (fn === OPS.transform) ctm = multiply(ctm, asMatrix(args) ?? [1, 0, 0, 1, 0, 0])
    else if (fn === OPS.paintFormXObjectBegin) {
      stack.push(ctm)
      ctm = multiply(ctm, asMatrix(first) ?? [1, 0, 0, 1, 0, 0])
    } else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
      const id = fn === OPS.paintImageXObject ? String(first) : null
      const ref = await collectImage(page, id, first, into)
      if (ref) images.push(bounds(ctm, ref))
    }
  }
  return images
}

export async function extractPdfLayout(
  file: File,
  onProgress: (page: number, total: number) => void = () => undefined,
): Promise<ExtractedPdf> {
  const pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const task = pdfjs.getDocument({ data: await file.arrayBuffer(), fontExtraProperties: true })
  const pdf = await task.promise
  const layouts: PdfPageLayout[] = []
  const files = new Map<string, File>()
  const seen = new Map<string, string>()
  try {
    for (let number = 1; number <= pdf.numPages; number += 1) {
      onProgress(number, pdf.numPages)
      const page = await pdf.getPage(number)
      // The operator list loads the fonts, which the text pass reads for bold and monospace.
      const images = await pageImages(pdfjs, page, { files, seen, pageNumber: number })
      const content = await page.getTextContent()
      const [, , width = 0, height = 0] = page.view
      layouts.push({ width, height, items: textItems(page, content), images })
      page.cleanup()
    }
  } finally {
    await task.destroy()
  }
  return { layouts, images: files }
}
