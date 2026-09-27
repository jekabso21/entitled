const base = process.env.DATABASE_URL ?? 'postgres://entitled:entitled@localhost:5432/entitled'
const url = new URL(base)
url.pathname = '/entitled_test'

export const testDatabaseUrl = url.toString()
