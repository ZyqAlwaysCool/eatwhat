import { useEffect, type PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'

import { ensureAuthenticated } from '@/services/auth'

import './app.css'

function App({ children }: PropsWithChildren) {
  useEffect(() => {
    const useCallContainer = process.env.TARO_APP_USE_CALL_CONTAINER === 'true'
    if (useCallContainer && Taro.cloud) {
      Taro.cloud.init({
        env: process.env.TARO_APP_CLOUDRUN_ENV || 'prod',
        traceUser: true
      })
    }

    void ensureAuthenticated().catch(() => {
      // 中文注释：启动时先静默拉起登录，页面上的业务请求会在失败时再显式提示。
    })
  }, [])

  return children
}

export default App
