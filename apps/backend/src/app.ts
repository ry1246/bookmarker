import { Hono } from 'hono'
import auth from './routes/auth.js'
import bookmarksRoute from './routes/bookmarks.js'
import { authMiddleWare } from './middleware/auth.js'

export const app = new Hono()
  .route('/auth', auth)
  .use('/bookmarks/*', authMiddleWare)
  .route('/bookmarks', bookmarksRoute)

export type AppType = typeof app
