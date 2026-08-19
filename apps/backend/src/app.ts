import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from './routes/auth.js'
import bookmarksRoute from './routes/bookmarks.js'
import { authMiddleWare } from './middleware/auth.js'

export const app = new Hono()
  .use('*', cors({ origin: 'http://localhost:5173' }))
  .route('/auth', auth)
  .use('/bookmarks/*', authMiddleWare)
  .route('/bookmarks', bookmarksRoute)

export type AppType = typeof app
