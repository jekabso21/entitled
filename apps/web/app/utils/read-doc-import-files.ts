import { docAssetContentTypes } from '@entitled/contracts/docs'
import {
  findLocalFileRefs,
  normalizeLocalPath,
  replaceFileRefs,
  unlinkFileRefs,
} from '@entitled/markdown/local-file-refs'
import { pdfLayoutToMarkdown } from '@entitled/markdown/pdf-layout-to-markdown'

export type DocImportSource = {
  kind: 'markdown' | 'pdf'
  title: string
  markdown: string
  // Keyed by the `asset:N` placeholder used in `markdown`.
  assets: Map<string, File>
  missing: string[]
  original: File | null
}

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
  pdf: 'application/pdf',
  zip: 'application/zip',
  txt: 'text/plain',
  csv: 'text/csv',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}
const MARKDOWN = /\.(md|markdown)$/i

function extensionOf(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

function baseName(path: string) {
  return path.split('/').pop() ?? path
}

// Gives every file a content type the upload endpoint accepts.
export function withUploadType(file: File): File {
  const guessed = file.type || CONTENT_TYPES[extensionOf(file.name)] || ''
  const allowed: readonly string[] = docAssetContentTypes
  const type = allowed.includes(guessed) ? guessed : 'application/octet-stream'
  return type === file.type ? file : new File([file], file.name, { type })
}

// SVG may carry script, so it is never stored as-is; a PNG copy is uploaded instead.
async function rasterizeSvg(file: File): Promise<File | null> {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const scale = Math.min(2, 2000 / Math.max(image.naturalWidth || 1, image.naturalHeight || 1))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round((image.naturalWidth || 800) * scale))
    canvas.height = Math.max(1, Math.round((image.naturalHeight || 600) * scale))
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png')
    })
    return blob
      ? new File([blob], file.name.replace(/\.svg$/i, '.png'), { type: 'image/png' })
      : null
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function unzipToFiles(file: File): Promise<File[]> {
  const { unzip } = await import('fflate')
  const bytes = new Uint8Array(await file.arrayBuffer())
  const entries = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(bytes, (error, result) => {
      if (error) reject(error)
      else resolve(result)
    })
  })
  return Object.entries(entries)
    .filter(([path]) => !path.endsWith('/') && !path.startsWith('__MACOSX/'))
    .map(([path, data]) => new File([new Uint8Array(data)], path))
}

function resolvePath(fromFile: string, target: string) {
  const parts = fromFile.split('/').slice(0, -1)
  for (const part of normalizeLocalPath(target).split('/')) {
    if (part === '..') parts.pop()
    else if (part !== '.' && part !== '') parts.push(part)
  }
  return parts.join('/')
}

function titleOf(markdown: string, fileName: string) {
  const heading = /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim()
  return (
    heading ??
    baseName(fileName)
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' ')
  )
}

async function fromMarkdown(files: File[]): Promise<DocImportSource> {
  const documents = files
    .filter((file) => MARKDOWN.test(file.name))
    .sort((a, b) => {
      const rank = (name: string) => (/(^|\/)(readme|index)\.md$/i.test(name) ? 0 : 1)
      return rank(a.name) - rank(b.name) || a.name.localeCompare(b.name)
    })
  const first = documents[0]
  if (!first) throw new Error('Choose a .md, .pdf or .zip file')
  const byPath = new Map(files.map((file) => [file.name, file]))
  const byBase = new Map(files.map((file) => [baseName(file.name).toLowerCase(), file]))
  const assets = new Map<string, File>()
  const placeholderOf = new Map<File, string>()
  const missing: string[] = []

  const parts: string[] = []
  for (const document of documents) {
    let text = await document.text()
    const urls = new Map<string, string>()
    const notFound = new Set<string>()
    for (const ref of findLocalFileRefs(text)) {
      const path = resolvePath(document.name, ref)
      let file = byPath.get(path) ?? byBase.get(baseName(path).toLowerCase())
      if (file && MARKDOWN.test(file.name)) continue
      if (file && extensionOf(file.name) === 'svg') file = (await rasterizeSvg(file)) ?? undefined
      if (!file) {
        missing.push(normalizeLocalPath(ref))
        notFound.add(ref)
        continue
      }
      let placeholder = placeholderOf.get(file)
      if (!placeholder) {
        placeholder = `asset:${String(assets.size)}`
        assets.set(
          placeholder,
          withUploadType(new File([file], baseName(file.name), { type: file.type })),
        )
        placeholderOf.set(file, placeholder)
      }
      urls.set(ref, placeholder)
    }
    text = unlinkFileRefs(replaceFileRefs(text, urls), notFound)
    if (documents.length > 1 && !/^#\s/m.test(text))
      text = `# ${titleOf(text, document.name)}\n\n${text}`
    parts.push(text.trim())
  }
  const markdown = parts.join('\n\n')
  return {
    kind: 'markdown',
    title: titleOf(markdown, first.name),
    markdown,
    assets,
    missing: [...new Set(missing)],
    original: null,
  }
}

async function fromPdf(
  file: File,
  onProgress: (message: string) => void,
): Promise<DocImportSource> {
  const { layouts, images } = await extractPdfLayout(file, (page, total) => {
    onProgress(`Reading page ${String(page)} of ${String(total)}…`)
  })
  const markdown = pdfLayoutToMarkdown(layouts)
  if (markdown.trim() === '') {
    throw new Error(
      'This PDF has no selectable text. It is probably a scan, which cannot be converted.',
    )
  }
  return {
    kind: 'pdf',
    title: titleOf(markdown, file.name),
    markdown,
    assets: images,
    missing: [],
    original: withUploadType(file),
  }
}

export async function readDocImportFiles(
  picked: readonly File[],
  onProgress: (message: string) => void = () => undefined,
): Promise<DocImportSource> {
  const pdfs = picked.filter((file) => extensionOf(file.name) === 'pdf')
  const [pdf] = pdfs
  if (pdf && !picked.some((file) => MARKDOWN.test(file.name))) {
    if (pdfs.length > 1) throw new Error('Import one PDF at a time')
    return fromPdf(pdf, onProgress)
  }
  onProgress('Reading files…')
  const files: File[] = []
  for (const file of picked) {
    if (extensionOf(file.name) === 'zip') files.push(...(await unzipToFiles(file)))
    else files.push(file)
  }
  const zippedPdf = files.find((file) => extensionOf(file.name) === 'pdf')
  if (zippedPdf && !files.some((file) => MARKDOWN.test(file.name)))
    return fromPdf(zippedPdf, onProgress)
  return fromMarkdown(files)
}
