import { runMigrations } from '@entitled/db/migrate'
import pg from 'pg'
import { testDatabaseUrl } from './test-database-url.ts'

export async function setup() {
  const url = new URL(testDatabaseUrl)
  const name = url.pathname.slice(1)
  const admin = new URL(testDatabaseUrl)
  admin.pathname = '/postgres'

  const client = new pg.Client({ connectionString: admin.toString() })
  await client.connect()
  await client.query(`drop database if exists "${name}" with (force)`)
  await client.query(`create database "${name}"`)
  await client.end()

  await runMigrations(testDatabaseUrl)
}
