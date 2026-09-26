import type { Db as BossDb, PgBoss } from 'pg-boss'
import { type JobData, type JobName, jobs } from './job-registry.ts'

// Passing `db` makes pg-boss insert the job on the caller's connection, so the job
// commits or rolls back together with the surrounding transaction.
export async function enqueueJob<TName extends JobName>(
  boss: PgBoss,
  db: BossDb,
  name: TName,
  data: JobData<TName>,
) {
  const payload = jobs[name].schema.parse(data)
  return boss.send(name, payload, { db })
}
