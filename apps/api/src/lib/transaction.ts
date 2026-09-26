import type { Tx } from '@entitled/db'
import { enqueueJob, type JobData, type JobName } from '@entitled/jobs'
import { sql } from 'drizzle-orm'
import { fromDrizzle } from 'pg-boss'
import { db } from '#lib/db.ts'
import { getQueue } from '#lib/queue.ts'

export type TransactionScope = {
  tx: Tx
  enqueue: <TName extends JobName>(name: TName, data: JobData<TName>) => Promise<unknown>
}

// Jobs are inserted through the transaction, so they only exist if it commits.
export async function withTransaction<T>(work: (scope: TransactionScope) => Promise<T>) {
  const boss = await getQueue()
  return db.transaction(async (tx) => {
    const bossDb = fromDrizzle(tx, sql)
    return work({ tx, enqueue: (name, data) => enqueueJob(boss, bossDb, name, data) })
  })
}
