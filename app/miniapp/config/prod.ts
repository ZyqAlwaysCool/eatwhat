import type { UserConfigExport } from '@tarojs/cli'

const defaultApiBaseUrl = process.env.MEAL_DECISION_API_BASE_URL ?? 'http://localhost:8000'

export default {
  env: {
    NODE_ENV: '"production"',
    // 中文注释：当前 Stage B 以本地双端联调为主，正式部署地址后续再通过环境变量覆盖。
    TARO_APP_API_BASE_URL: JSON.stringify(defaultApiBaseUrl)
  },
  mini: {
    optimizeMainPackage: {
      enable: true
    }
  }
} satisfies UserConfigExport<'webpack5'>
