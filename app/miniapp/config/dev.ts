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
    NODE_ENV: '"development"',
    TARO_APP_API_BASE_URL: JSON.stringify(defaultApiBaseUrl),
    TARO_APP_USE_CALL_CONTAINER: JSON.stringify(defaultUseCallContainer),
    TARO_APP_CLOUDRUN_SERVER: JSON.stringify(defaultCloudRunServer),
    TARO_APP_CLOUDRUN_ENV: JSON.stringify(defaultCloudRunEnv)
  },
  mini: {}
} satisfies UserConfigExport<'webpack5'>
