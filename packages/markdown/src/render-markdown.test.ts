import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './render-markdown.ts'

describe('renderMarkdown', () => {
  it('renders GitHub-flavored tables and task lists', async () => {
    const html = await renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] done')
    expect(html).toContain('<table>')
    expect(html).toContain('type="checkbox"')
  })

  it('strips scripts and event handlers from authored HTML', async () => {
    const html = await renderMarkdown('<img src="x" onerror="alert(1)"><script>alert(1)</script>')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('<script')
  })

  it('highlights fenced code with both themes', async () => {
    const html = await renderMarkdown('```ts\nconst a = 1\n```')
    expect(html).toContain('shiki')
    expect(html).toContain('--shiki-dark')
  })

  it('leaves mermaid fences as plain blocks for the browser to draw', async () => {
    const html = await renderMarkdown('```mermaid\ngraph TD; A-->B\n```')
    expect(html).toContain('<pre class="mermaid">graph TD; A-->B')
  })

  it('renders GitHub alerts as callouts', async () => {
    const html = await renderMarkdown('> [!WARNING]\n> Do not unplug during flashing.')
    expect(html).toContain('markdown-alert-warning')
  })
})
