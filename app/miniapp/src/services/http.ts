import { clearStoredSession } from '@/services/auth-state'
import { ensureAuthenticated } from '@/services/auth'
import { rawRequest } from '@/services/http-raw'

type RequestOptions = {
  method?: 'GET' | 'POST'
  data?: Record<string, unknown>
  auth?: boolean
  retryOnUnauthorized?: boolean
}

export async function request<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const requiresAuth = options.auth !== false

  if (requiresAuth) {
    await ensureAuthenticated()
  }

  try {
    // 中文注释：业务请求默认必须带自家服务会话，用户 ID 只从后端登录态中解析。
    return await rawRequest<T>(url, {
      ...options,
      auth: requiresAuth
    })
  } catch (error) {
    const shouldRetry =
      requiresAuth &&
      options.retryOnUnauthorized !== false &&
      error instanceof Error &&
      error.message.includes('401')

    if (!shouldRetry) {
      throw error
    }

    clearStoredSession()
    await ensureAuthenticated(true)

    return rawRequest<T>(url, {
      ...options,
      auth: true,
      retryOnUnauthorized: false
    })
  }
}
