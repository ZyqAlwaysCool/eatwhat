import { useEffect, type PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'

import './app.css'

async function initCloudForCallContainer(): Promise<void> {
  const useCallContainer = process.env.TARO_APP_USE_CALL_CONTAINER === 'true'
  if (!useCallContainer || !Taro.cloud) {
    return
  }
  await Taro.cloud.init({
    env: process.env.TARO_APP_CLOUDRUN_ENV || 'prod',
    traceUser: true
  })
}

function App({ children }: PropsWithChildren) {
  useEffect(() => {
    void (async () => {
      try {
        await initCloudForCallContainer()
        const { ensureAuthenticated } = await import('@/services/auth')
        await ensureAuthenticated()
      } catch (err) {
        console.error('[meal-decision] cloud init or login failed', err)
      }
    })()
  }, [])

  return children
}

export default App
