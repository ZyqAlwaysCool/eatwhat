declare namespace NodeJS {
  interface ProcessEnv {
    TARO_APP_API_BASE_URL?: string
    TARO_APP_USE_CALL_CONTAINER?: string
    TARO_APP_CLOUDRUN_SERVER?: string
    TARO_APP_CLOUDRUN_ENV?: string
  }
}
