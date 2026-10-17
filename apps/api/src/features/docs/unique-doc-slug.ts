import { docPages } from '@entitled/db/schema'
import { and, eq, like } from 'drizzle-orm'
import type { TransactionScope } from '#lib/transaction.ts'

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return slug.length >= 2 ? slug : 'page'
}

// Appends -2, -3, … until the slug is free within the product.
export async function uniqueDocSlug(tx: TransactionScope['tx'], productId: string, base: string) {
  const taken = new Set(
    (
      await tx
        .select({ slug: docPages.slug })
        .from(docPages)
        .where(and(eq(docPages.productId, productId), like(docPages.slug, `${base}%`)))
    ).map((row) => row.slug),
  )
  if (!taken.has(base)) return base
  for (let suffix = 2; ; suffix += 1) {
    const candidate = `${base}-${String(suffix)}`
    if (!taken.has(candidate)) return candidate
  }
}
