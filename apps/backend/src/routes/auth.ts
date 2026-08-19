import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'

const credentialSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const auth = new Hono()
  .post('/signup', zValidator('json', credentialSchema), async (c) => {
    const { email, password } = c.req.valid('json')

    const existing = await db.select().from(users).where(eq(users.email, email)).get()
    if (existing) return c.json({ error: 'email already registered' }, 409)

    const passwordHash = await bcrypt.hash(password, 10)
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, createAt: new Date() })
      .returning()

    return c.json({ id: user.id, email: user.email }, 201)
  })
  .post('/login', zValidator('json', credentialSchema), async (c) => {
    const { email, password } = c.req.valid('json')

    const user = await db.select().from(users).where(eq(users.email, email)).get()
    if (!user) return c.json({ error: 'invalid credentials' }, 401)

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return c.json({ error: 'invalid credentials' }, 401)

    const token = await sign(
      { sub: user.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
      process.env.JWT_SECRET!
    )

    return c.json({ token })
  })

export default auth
