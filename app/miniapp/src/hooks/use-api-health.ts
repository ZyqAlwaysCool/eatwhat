import { useEffect, useState } from 'react'

import { fetchHealth, type HealthResponse } from '@/services/health'

type ApiHealthState = {
  loading: boolean
  data: HealthResponse | null
  error: string | null
}

export function useApiHealth() {
  const [state, setState] = useState<ApiHealthState>({
    loading: true,
    data: null,
    error: null
  })

  useEffect(() => {
    let active = true

    async function loadHealth() {
      try {
        const data = await fetchHealth()

        if (!active) {
          return
        }

        setState({
          loading: false,
          data,
          error: null
        })
      } catch (error) {
        if (!active) {
          return
        }

        // 中文注释：这里把后端连通性直接暴露给首页，方便本地联调时快速判断问题在前端还是 API。
        setState({
          loading: false,
          data: null,
          error: error instanceof Error ? error.message : 'Request failed'
        })
      }
    }

    loadHealth()

    return () => {
      active = false
    }
  }, [])

  return state
}
