import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import 'dotenv/config'
import auth from './routes/auth.js'
import bookmarksRoute from './routes/bookmarks.js'
import { authMiddleWare } from './middleware/auth.js'

const app = new Hono()
  .route('/auth', auth)
  .use('/bookmarks/*', authMiddleWare)
  .route('/bookmarks', bookmarksRoute)

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)

export type AppType = typeof app
