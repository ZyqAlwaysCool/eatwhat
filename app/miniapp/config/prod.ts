import type { UserConfigExport } from '@tarojs/cli'

const defaultApiBaseUrl = process.env.MEAL_DECISION_API_BASE_URL ?? 'http://localhost:8000'
const defaultUseCallContainer =
  process.env.MEAL_DECISION_USE_CALL_CONTAINER ??
  process.env.TARO_APP_USE_CALL_CONTAINER ??
  'false'
const defaultCloudRunServer =
  process.env.MEAL_DECISION_CLOUDRUN_SERVER ??
  process.env.TARO_APP_CLOUDRUN_SERVER ??
  'meal-decision-api'
const defaultCloudRunEnv =
  process.env.MEAL_DECISION_CLOUDRUN_ENV ??
  process.env.TARO_APP_CLOUDRUN_ENV ??
  'prod'

export default {
  env: {
    NODE_ENV: '"production"',
    // 中文注释：当前 Stage B 以本地双端联调为主，正式部署地址后续再通过环境变量覆盖。
    TARO_APP_API_BASE_URL: JSON.stringify(defaultApiBaseUrl),
    TARO_APP_USE_CALL_CONTAINER: JSON.stringify(defaultUseCallContainer),
    TARO_APP_CLOUDRUN_SERVER: JSON.stringify(defaultCloudRunServer),
    TARO_APP_CLOUDRUN_ENV: JSON.stringify(defaultCloudRunEnv)
  },
  mini: {
    // Main-package optimization has caused prod-only runtime issues on some
    // WeChat clients (e.g. stack overflow in app-service); keep disabled until stable.
    optimizeMainPackage: {
      enable: false
    }
  }
} satisfies UserConfigExport<'webpack5'>
