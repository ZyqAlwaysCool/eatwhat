import Taro from '@tarojs/taro'

import {
  clearStoredSession,
  ensureAuthenticated,
  getAuthorizationHeader
} from '@/services/auth'

const apiBaseUrl = process.env.TARO_APP_API_BASE_URL || 'http://localhost:8000'

type RequestOptions = {
  method?: 'GET' | 'POST'
  data?: Record<string, unknown>
  auth?: boolean
  retryOnUnauthorized?: boolean
}

export async function rawRequest<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json'
  }
  const authorization = options.auth === false ? null : getAuthorizationHeader()

  if (authorization) {
    headers.Authorization = authorization
  }

  const response = await Taro.request<T>({
    url: `${apiBaseUrl}${url}`,
    method: options.method ?? 'GET',
    data: options.data,
    header: headers
  })

  if (response.statusCode < 200 || response.statusCode >= 300) {
    const message =
      typeof response.data === 'object' &&
      response.data !== null &&
      'detail' in response.data &&
      typeof response.data.detail === 'string'
        ? response.data.detail
        : `Request failed with status ${response.statusCode}`

    throw new Error(message)
  }

  return response.data
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
