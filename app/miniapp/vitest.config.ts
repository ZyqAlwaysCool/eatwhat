import path from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@catalog': path.resolve(__dirname, '..', 'api', 'catalog'),
      '@shared': path.resolve(__dirname, '..', 'shared')
    }
  },
  test: {
    include: ['src/**/*.test.ts']
  }
})
