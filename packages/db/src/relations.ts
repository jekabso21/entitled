import { defineRelations } from 'drizzle-orm'
import { authRelations } from './schema/auth.ts'
import * as schema from './schema/index.ts'

const domainRelations = defineRelations(schema, (r) => ({
  products: {
    revisions: r.many.hardwareRevisions(),
    releases: r.many.releases(),
    entitlements: r.many.entitlements(),
    docPages: r.many.docPages(),
  },
  docPages: {
    product: r.one.products({ from: r.docPages.productId, to: r.products.id }),
  },
  docAssets: {
    product: r.one.products({ from: r.docAssets.productId, to: r.products.id }),
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
  accountInvitations: {
    clientAccount: r.one.organizations({
      from: r.accountInvitations.clientAccountId,
      to: r.organizations.id,
    }),
  },
  supportThreads: {
    clientAccount: r.one.organizations({
      from: r.supportThreads.clientAccountId,
      to: r.organizations.id,
    }),
    product: r.one.products({ from: r.supportThreads.productId, to: r.products.id }),
    release: r.one.releases({ from: r.supportThreads.releaseId, to: r.releases.id }),
    createdBy: r.one.users({ from: r.supportThreads.createdByUserId, to: r.users.id }),
    messages: r.many.supportMessages(),
  },
  supportMessages: {
    thread: r.one.supportThreads({ from: r.supportMessages.threadId, to: r.supportThreads.id }),
    author: r.one.users({ from: r.supportMessages.authorUserId, to: r.users.id }),
    attachments: r.many.supportAttachments(),
  },
  supportAttachments: {
    message: r.one.supportMessages({
      from: r.supportAttachments.messageId,
      to: r.supportMessages.id,
    }),
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
