import Taro from '@tarojs/taro'

import { getAuthorizationHeader } from '@/services/auth-state'

const apiBaseUrl = process.env.TARO_APP_API_BASE_URL || 'http://localhost:8000'
const useCallContainer = process.env.TARO_APP_USE_CALL_CONTAINER === 'true'
const cloudRunServer = process.env.TARO_APP_CLOUDRUN_SERVER || 'meal-decision-api'
/** WeChat: callContainer timeout must not exceed 15s (see cloud run call FAQ). */
const CALL_CONTAINER_TIMEOUT_MS = 15_000

type RequestOptions = {
  method?: 'GET' | 'POST'
  data?: Record<string, unknown>
  auth?: boolean
  /** Used by `request()` retry path only; ignored by transport. */
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

  const response = useCallContainer
    ? await requestByCallContainer<T>(url, options, headers)
    : await Taro.request<T>({
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

async function requestByCallContainer<T>(
  url: string,
  options: RequestOptions,
  headers: Record<string, string>
): Promise<{
  statusCode: number
  data: T & { detail?: string }
}> {
  const wxCloud = (globalThis as typeof globalThis & {
    wx?: {
      cloud?: {
        callContainer: (options: {
          config: { env: string }
          path: string
          method: 'GET' | 'POST'
          header: Record<string, string>
          data?: Record<string, unknown>
          timeout?: number
        }) => Promise<{ statusCode: number; data: T & { detail?: string } }>
      }
    }
  }).wx?.cloud

  if (!wxCloud?.callContainer) {
    throw new Error('当前环境不支持云托管 callContainer，请检查基础库或配置。')
  }

  try {
    return await wxCloud.callContainer({
      config: { env: process.env.TARO_APP_CLOUDRUN_ENV || 'prod' },
      path: url,
      method: options.method ?? 'GET',
      header: {
        ...headers,
        'X-WX-SERVICE': cloudRunServer
      },
      data: options.data,
      timeout: CALL_CONTAINER_TIMEOUT_MS
    })
  } catch (error: unknown) {
    const err = error as { errMsg?: string; errCode?: number | string }
    const hint = [err.errCode, err.errMsg].filter(Boolean).join(' ')
    throw hint ? new Error(`callContainer failed: ${hint}`) : error
  }
}
