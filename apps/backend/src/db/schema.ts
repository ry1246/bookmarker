import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const bookmarks = sqliteTable('bookmarks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  url: text('url').notNull(),
  title: text('title'),
  tags: text('tags'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
