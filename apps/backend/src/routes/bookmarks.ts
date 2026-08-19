import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { bookmarks } from '../db/schema.js'
import { fetchPageTitle } from '../lib/fetchTitle.js'

type JwtPayload = { sub: number }

const createBookmarkSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  tags: z.string().optional(),
})

const patchBookmarkSchema = z.object({
  title: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
})

const bookmarksRoute = new Hono()
  .get('/', async (c) => {
    const payload = c.get('jwtPayload') as JwtPayload
    const tag = c.req.query('tag')

    const rows = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, payload.sub))
      .all()

    const filtered = tag
      ? rows.filter((b) => b.tags?.split(',').map((t) => t.trim()).includes(tag))
      : rows

    return c.json(filtered)
  })
  .post('/', zValidator('json', createBookmarkSchema), async (c) => {
    const payload = c.get('jwtPayload') as JwtPayload
    const { url, title, tags } = c.req.valid('json')

    const resolvedTitle = title ?? (await fetchPageTitle(url))

    const [bookmark] = await db
      .insert(bookmarks)
      .values({ userId: payload.sub, url, title: resolvedTitle, tags, createdAt: new Date() })
      .returning()

    return c.json(bookmark, 201)
  })
  .patch('/:id', zValidator('json', patchBookmarkSchema), async (c) => {
    const payload = c.get('jwtPayload') as JwtPayload
    const id = Number(c.req.param('id'))
    const { title, tags } = c.req.valid('json')

    const existing = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, payload.sub)))
      .get()

    if (!existing) return c.json({ error: 'not found' }, 404)

    const [updated] = await db
      .update(bookmarks)
      .set({ title, tags })
      .where(eq(bookmarks.id, id))
      .returning()

    return c.json(updated)
  })
  .delete('/:id', async (c) => {
    const payload = c.get('jwtPayload') as JwtPayload
    const id = Number(c.req.param('id'))

    const existing = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, payload.sub)))
      .get()

    if (!existing) return c.json({ error: 'not found' }, 404)

    await db.delete(bookmarks).where(eq(bookmarks.id, id))
    return c.body(null, 204)
  })

export default bookmarksRoute
