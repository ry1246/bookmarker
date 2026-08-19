import { describe, it, expect, beforeEach } from 'vitest'
import { app } from '../src/app.js'

let token: string

beforeEach(async () => {
  await app.request('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bm@example.com', password: 'password123' }),
  })
  const res = await app.request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bm@example.com', password: 'password123' }),
  })
  ;({ token } = await res.json())
})

const authed = (init: RequestInit = {}) => ({
  ...init,
  headers: { ...init.headers, Authorization: `Bearer ${token}` },
})

describe('bookmarks CRUD', () => {
  it('rejects requests without a token', async () => {
    const res = await app.request('/bookmarks')
    expect(res.status).toBe(401)
  })

  it('creates and lists a bookmark', async () => {
    const create = await app.request(
      '/bookmarks',
      authed({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com', title: 'Example', tags: 'a,b' }),
      })
    )
    expect(create.status).toBe(201)

    const list = await app.request('/bookmarks', authed())
    const body = await list.json()
    expect(body).toHaveLength(1)
    expect(body[0]).toMatchObject({ url: 'https://example.com', title: 'Example' })
  })

  it('filters by tag', async () => {
    await app.request(
      '/bookmarks',
      authed({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://a.com', title: 'A', tags: 'x' }),
      })
    )
    await app.request(
      '/bookmarks',
      authed({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://b.com', title: 'B', tags: 'y' }),
      })
    )

    const res = await app.request('/bookmarks?tag=x', authed())
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0]).toMatchObject({ url: 'https://a.com' })
  })

  it('updates a bookmark it owns', async () => {
    const create = await app.request(
      '/bookmarks',
      authed({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://c.com', title: 'C' }),
      })
    )
    const { id } = await create.json()

    const patch = await app.request(
      `/bookmarks/${id}`,
      authed({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      })
    )
    expect(patch.status).toBe(200)
    expect((await patch.json()).title).toBe('Updated')
  })

  it('returns 404 when patching a bookmark that does not exist', async () => {
    const res = await app.request(
      '/bookmarks/999999',
      authed({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'x' }),
      })
    )
    expect(res.status).toBe(404)
  })

  it('deletes a bookmark it owns', async () => {
    const create = await app.request(
      '/bookmarks',
      authed({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://d.com', title: 'D' }),
      })
    )
    const { id } = await create.json()

    const del = await app.request(`/bookmarks/${id}`, authed({ method: 'DELETE' }))
    expect(del.status).toBe(204)
    expect(await (await app.request('/bookmarks', authed())).json()).toHaveLength(0)
  })

  it("does not allow acting on another user's bookmark", async () => {
    const create = await app.request(
      '/bookmarks',
      authed({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://e.com', title: 'E' }),
      })
    )
    const { id } = await create.json()

    await app.request('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'other@example.com', password: 'password123' }),
    })
    const otherLogin = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'other@example.com', password: 'password123' }),
    })
    const { token: otherToken } = await otherLogin.json()

    const del = await app.request(`/bookmarks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${otherToken}` },
    })
    expect(del.status).toBe(404)
  })
})
