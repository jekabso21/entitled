import type { DocPageSummary } from '@entitled/contracts/docs'
import { replaceFileRefs } from '@entitled/markdown/local-file-refs'
import type { SplitPage } from '@entitled/markdown/split-markdown-pages'

export type DocImportOptions = {
  parentId: string | null
  isPublished: boolean
  shouldAttachOriginal: boolean
}

const MEDIA = /\.(png|jpe?g|gif|webp|mp4|webm)$/i

// Image syntax pointing at a PDF or archive reads better as a download link.
function linkNonMedia(markdown: string) {
  return markdown.replace(
    /!\[([^\]]*)\]\((\/api\/doc-assets\/[^)\s]+)\)/g,
    (whole, alt: string, url: string) =>
      MEDIA.test(url) ? whole : `[${alt || (url.split('/').pop() ?? 'Download')}](${url})`,
  )
}

export function useDocImport(productId: () => string) {
  const { upload } = useDocAssetUpload(productId)
  const status = ref('')

  // Uploads only the files the given text still references, and returns a function that
  // swaps their placeholders for the uploaded URLs.
  async function uploadAssets(source: DocImportSource, text: string) {
    const used = [...source.assets].filter(([ref]) => text.includes(`(${ref}`))
    const urls = new Map<string, string>()
    for (const [index, [ref, file]] of used.entries()) {
      status.value = `Uploading file ${String(index + 1)} of ${String(used.length)}…`
      urls.set(ref, await upload(file))
    }
    return (markdown: string) => linkNonMedia(replaceFileRefs(markdown, urls))
  }

  async function insertMarkdown(source: DocImportSource) {
    const apply = await uploadAssets(source, source.markdown)
    return apply(source.markdown)
  }

  async function importPages(
    source: DocImportSource,
    pages: readonly SplitPage[],
    options: DocImportOptions,
  ) {
    const apply = await uploadAssets(source, pages.map((page) => page.body).join('\n'))
    const resolved = pages.map((page) => ({ ...page, body: apply(page.body) }))
    const [first] = resolved
    if (first && options.shouldAttachOriginal && source.original) {
      status.value = 'Uploading the original file…'
      const url = await upload(source.original)
      first.body = `${first.body}\n\n[Download the original ${source.original.name}](${url})`.trim()
    }
    status.value = `Creating ${String(resolved.length)} pages…`
    return $fetch<DocPageSummary[]>(`/api/products/${productId()}/docs/import-pages`, {
      method: 'POST',
      body: {
        parentId: options.parentId,
        status: options.isPublished ? 'published' : 'draft',
        pages: resolved.map(({ title, body, depth }) => ({
          title: title.slice(0, 200),
          body,
          depth,
        })),
      },
    })
  }

  return { status, insertMarkdown, importPages }
}
