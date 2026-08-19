import { beforeAll, beforeEach } from 'vitest'
import { sql } from 'drizzle-orm'
import { db } from '../src/db/client.js'

beforeAll(async () => {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      url TEXT NOT NULL,
      title TEXT,
      tags TEXT,
      created_at INTEGER NOT NULL
    )
  `)
})

beforeEach(async () => {
  await db.run(sql`DELETE FROM bookmarks`)
  await db.run(sql`DELETE FROM users`)
})
