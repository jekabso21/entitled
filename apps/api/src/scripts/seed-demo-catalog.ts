import { createHash } from 'node:crypto'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import type { Db } from '@entitled/db'
import { artifacts, entitlements, hardwareRevisions, products, releases } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import { env } from '#config/env.ts'
import { artifactStorageKey } from '#lib/object-storage.ts'
import { s3 } from '#lib/s3-client.ts'

const changelog = `## Highlights

- Boot time down from 2.1 s to 0.8 s
- New \`diag\` CLI command for field technicians

> [!WARNING]
> Units on revision A need bootloader 1.4 or newer before flashing.

| Area | Change |
| --- | --- |
| CAN bus | Fixed frame drops above 500 kbit/s |
| Power | Deep sleep draws 40 % less |

\`\`\`mermaid
graph LR
  A[Download] --> B[Verify SHA-256] --> C[Flash over USB]
\`\`\`
`

const installInstructions = `1. Connect the controller over USB-C.
2. Verify the checksum:

\`\`\`sh
sha256sum controller-2.0.0.bin
\`\`\`

3. Flash it:

\`\`\`sh
dfu-util -a 0 -D controller-2.0.0.bin
\`\`\`
`

// A product, its revisions, an entitlement for the demo account and one published release.
export async function seedDemoCatalog(db: Db, clientAccountId: string) {
  const [existing] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, 'acme-motion-controller'))
  if (existing) return

  const [product] = await db
    .insert(products)
    .values({
      slug: 'acme-motion-controller',
      name: 'Motion Controller MC-200',
      description: 'Four-axis motion controller for pick-and-place cells.',
    })
    .returning({ id: products.id })
  if (!product) throw new Error('Product insert returned no row')

  await db.insert(hardwareRevisions).values([
    { productId: product.id, code: 'A', name: 'First production run', position: 1 },
    { productId: product.id, code: 'B', name: 'Revised power stage', position: 2 },
  ])
  await db.insert(entitlements).values({ clientAccountId, productId: product.id })

  const [release] = await db
    .insert(releases)
    .values({
      productId: product.id,
      version: '2.0.0',
      title: 'Faster boot and CAN fixes',
      status: 'published',
      publishedAt: new Date(),
      changelog,
      installInstructions,
    })
    .returning({ id: releases.id })
  if (!release) throw new Error('Release insert returned no row')

  const body = Buffer.from('MC-200 firmware 2.0.0 (demo image)\n'.repeat(512))
  const artifactId = crypto.randomUUID()
  const fileName = 'controller-2.0.0.bin'
  const storageKey = artifactStorageKey(release.id, artifactId, fileName)
  await s3.send(new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey, Body: body }))
  await db.insert(artifacts).values({
    id: artifactId,
    releaseId: release.id,
    fileName,
    contentType: 'application/octet-stream',
    sizeBytes: body.byteLength,
    status: 'ready',
    sha256: createHash('sha256').update(body).digest('hex'),
    storageKey,
  })
}
