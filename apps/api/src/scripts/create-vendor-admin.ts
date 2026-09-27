import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { parseArgs } from 'node:util'
import { passwordSchema } from '@entitled/contracts/accounts'
import { users } from '@entitled/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { createCredentialUser } from '#lib/create-credential-user.ts'
import { db, pool } from '#lib/db.ts'

const { values } = parseArgs({ options: { email: { type: 'string' }, name: { type: 'string' } } })
const email = z.email().parse(values.email)
const name = z.string().min(1).parse(values.name)

async function readPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD
  const rl = createInterface({ input: stdin, output: stdout })
  const answer = await rl.question('Password (min 12 chars): ')
  rl.close()
  return answer
}

const password = passwordSchema.parse(await readPassword())

const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
if (existing) {
  await db.update(users).set({ vendorRole: 'admin' }).where(eq(users.id, existing.id))
  console.warn(`${email} already existed and is now a vendor admin`)
} else {
  await db.transaction((tx) =>
    createCredentialUser(tx, { name, email, password, vendorRole: 'admin' }),
  )
  console.warn(`created vendor admin ${email}`)
}
await pool.end()
