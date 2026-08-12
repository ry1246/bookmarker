import { useEffect, useState } from 'react'
import { client } from './lib/api'
import { clearToken, getToken, setToken } from './lib/auth'

type Bookmark = {
  id: number
  url: string
  title: string | null
  tags: string | null
}

function AuthForm({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'signup') {
      const res = await client.auth.signup.$post({ json: { email, password } })
      if (!res.ok) {
        setError('signup failed')
        return
      }
      setMode('login')
      return
    }

    const res = await client.auth.login.$post({ json: { email, password } })
    if (!res.ok) {
      setError('invalid credentials')
      return
    }
    const { token } = await res.json()
    setToken(token)
    onAuthed()
  }

  return (
    <form onSubmit={submit}>
      <h2>{mode === 'login' ? 'Log in' : 'Sign up'}</h2>
      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">{mode === 'login' ? 'Log in' : 'Sign up'}</button>
      <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        {mode === 'login' ? 'Need an account?' : 'Have an account?'}
      </button>
      {error && <p>{error}</p>}
    </form>
  )
}

function BookmarkList() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [url, setUrl] = useState('')
  const [tags, setTags] = useState('')
  const [filterTag, setFilterTag] = useState('')

  const load = async (tag?: string) => {
    const token = getToken()
    const res = await client.bookmarks.$get(
      { query: tag ? { tag } : {} },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (res.ok) setBookmarks(await res.json())
  }
  
  useEffect(() => {
    // load() sets state after an await, not synchronously — this is the
    // standard "fetch on mount / on dependency change" pattern from the
    // React docs. react-hooks/set-state-in-effect can't see across the
    // async boundary and flags it anyway.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(filterTag || undefined)
  }, [filterTag])

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = getToken()
    const res = await client.bookmarks.$post(
      { json: { url, tags: tags || undefined } },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (res.ok) {
      setUrl('')
      load(filterTag || undefined)
    }
  }

  const removeBookmark = async (id: number) => {
    const token = getToken()
    await client.bookmarks[':id'].$delete(
      { param: { id: String(id) } },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    load(filterTag || undefined)
  }

  return (
    <div>
      <form onSubmit={addBookmark}>
        <input
          type="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          type="text"
          placeholder="tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      <input
        type="text"
        placeholder="filter by tag"
        value={filterTag}
        onChange={(e) => setFilterTag(e.target.value)}
      />
      <ul>
        {bookmarks.map((b) => (
          <li key={b.id}>
            <a href={b.url}>{b.title ?? b.url}</a>
            {b.tags && (
              <span>
                {b.tags.split(',').map((t) => t.trim()).map((t) => (
                  <span key={t} onClick={() => setFilterTag(t)}> #{t}</span>
                ))}
              </span>
            )}
            <button onClick={() => removeBookmark(b.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function App() {
  const [authed, setAuthed] = useState(!!getToken())

  if (!authed) return <AuthForm onAuthed={() => setAuthed(true)} />

  return (
    <div>
      <button
        onClick={() => {
          clearToken()
          setAuthed(false)
        }}
      >
        Log out
      </button>
      <BookmarkList />
    </div>
  )
}

export default App
