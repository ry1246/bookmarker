import { defineConfig } from 'vitest/config'

export default defineConfig ({
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    env: {
      TURSO_DATABASE_URL: ':memory:',
      JWT_SECRET: 'test-secret',
    },
  },
})
