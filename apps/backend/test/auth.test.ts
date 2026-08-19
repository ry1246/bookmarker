import { describe, it, expect } from 'vitest'
import { app } from '../src/app.js'

const signup = (email: string, password: string) =>
  app.request('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

const login = (email: string, password: string) =>
  app.request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

describe('POST /auth/signup', () => {
  it('creates a user and returns id + email', async () => {
    const res = await signup('a@example.com', 'password123')
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toMatchObject({ email: 'a@example.com' })
    expect(body.id).toBeTypeOf('number')
  })

  it('rejects a duplicate email with 409', async () => {
    await signup('dup@example.com', 'password123')
    const res = await signup('dup@example.com', 'password123')
    expect(res.status).toBe(409)
  })
})

describe('POST /auth/login', () => {
  it('returns a token for valid credentials', async () => {
    await signup('login@example.com', 'password123')
    const res = await login('login@example.com', 'password123')
    expect(res.status).toBe(200)
    expect((await res.json()).token).toBeTypeOf('string')
  })

  it('returns 401 for a wrong password', async () => {
    await signup('login2@example.com', 'password123')
    const res = await login('login2@example.com', 'wrong-password')
    expect(res.status).toBe(401)
  })

  it('returns 401 for an unknown email', async () => {
    const res = await login('nobody@example.com', 'password123')
    expect(res.status).toBe(401)
  })
})
