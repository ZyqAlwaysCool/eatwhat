import type { UserConfigExport } from '@tarojs/cli'

const defaultApiBaseUrl = process.env.MEAL_DECISION_API_BASE_URL ?? 'http://localhost:8000'

export default {
  env: {
    NODE_ENV: '"development"',
    TARO_APP_API_BASE_URL: JSON.stringify(defaultApiBaseUrl)
  },
  mini: {}
} satisfies UserConfigExport<'webpack5'>
