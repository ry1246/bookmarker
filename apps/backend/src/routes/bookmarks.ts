import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { bookmarks } from '../db/schema.js'

type JwtPayload = { sub: number }

const bookmarksRoute = new Hono()

bookmarksRoute.get('/', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload

  const rows = await db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, payload.sub))
    .all()

    return c.json(rows)
})

bookmarksRoute.post('/', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload
  const { url, title, tags } = await c.req.json()

  if (!url) return c.json({ error: 'url is required' }, 400)

  const [bookmark] = await db
    .insert(bookmarks)
    .values({ userId: payload.sub, url, title, tags, createdAt: new Date() })
    .returning()

    return c.json(bookmark, 201)
})

bookmarksRoute.delete('/:id', async (c) => {
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
