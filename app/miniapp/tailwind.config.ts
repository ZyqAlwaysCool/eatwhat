import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#0f766e',
        ink: '#0f172a',
        surface: '#fffdf7',
        line: '#e2e8f0'
      },
      borderRadius: {
        card: '24px'
      },
      boxShadow: {
        soft: '0 12px 40px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  corePlugins: {
    preflight: false
  }
}

export default config
