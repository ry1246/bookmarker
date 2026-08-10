import { jwt } from 'hono/jwt'

export const authMiddleWare = jwt({
  secret: process.env.JWT_SECRET!,
  alg: 'HS256',
})
