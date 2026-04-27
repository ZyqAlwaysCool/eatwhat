import { useEffect, type PropsWithChildren } from 'react'

import { ensureAuthenticated } from '@/services/auth'

import './app.css'

function App({ children }: PropsWithChildren) {
  useEffect(() => {
    void ensureAuthenticated().catch(() => {
      // 中文注释：启动时先静默拉起登录，页面上的业务请求会在失败时再显式提示。
    })
  }, [])

  return children
}

export default App
