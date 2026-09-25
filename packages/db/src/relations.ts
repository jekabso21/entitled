import { defineRelations } from 'drizzle-orm'
import { authRelations } from './schema/auth.ts'
import * as schema from './schema/index.ts'

const domainRelations = defineRelations(schema, (r) => ({
  products: {
    revisions: r.many.hardwareRevisions(),
    releases: r.many.releases(),
    entitlements: r.many.entitlements(),
  },
  hardwareRevisions: {
    product: r.one.products({ from: r.hardwareRevisions.productId, to: r.products.id }),
  },
  releases: {
    product: r.one.products({ from: r.releases.productId, to: r.products.id }),
    artifacts: r.many.artifacts(),
  },
  artifacts: {
    release: r.one.releases({ from: r.artifacts.releaseId, to: r.releases.id }),
  },
  entitlements: {
    clientAccount: r.one.organizations({
      from: r.entitlements.clientAccountId,
      to: r.organizations.id,
    }),
    product: r.one.products({ from: r.entitlements.productId, to: r.products.id }),
    revisions: r.many.hardwareRevisions({
      from: r.entitlements.id.through(r.entitlementRevisions.entitlementId),
      to: r.hardwareRevisions.id.through(r.entitlementRevisions.revisionId),
    }),
  },
}))

export const relations = { ...domainRelations, ...authRelations }
