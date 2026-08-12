import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { bookmarks } from '../db/schema.js'

type JwtPayload = { sub: number }

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
  .post('/', async (c) => {
    const payload = c.get('jwtPayload') as JwtPayload
    const { url, title, tags } = await c.req.json()

    if (!url) return c.json({ error: 'url is required' }, 400)

    const [bookmark] = await db
      .insert(bookmarks)
      .values({ userId: payload.sub, url, title, tags, createdAt: new Date() })
      .returning()

    return c.json(bookmark, 201)
  })
  .patch('/:id', async (c) => {
    const payload = c.get('jwtPayload') as JwtPayload
    const id = Number(c.req.param('id'))
    const { title, tags } = await c.req.json()

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
