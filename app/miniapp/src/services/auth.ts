import Taro from '@tarojs/taro'

import {
  getOrCreateDeviceId,
  isSessionUsable,
  persistSession,
  readStoredSession,
  type AuthSession
} from '@/services/auth-state'
import { rawRequest } from '@/services/http-raw'

export type { AuthSession } from '@/services/auth-state'
export {
  clearStoredSession,
  getAuthorizationHeader,
  isSessionUsable,
  readStoredSession
} from '@/services/auth-state'

let pendingLoginPromise: Promise<AuthSession> | null = null

export async function ensureAuthenticated(forceRefresh = false): Promise<AuthSession> {
  const storedSession = readStoredSession()

  if (!forceRefresh && storedSession && isSessionUsable(storedSession)) {
    return storedSession
  }

  if (pendingLoginPromise) {
    return pendingLoginPromise
  }

  pendingLoginPromise = loginWithWechat().finally(() => {
    pendingLoginPromise = null
  })

  return pendingLoginPromise
}

async function loginWithWechat(): Promise<AuthSession> {
  const loginResult = await Taro.login()

  if (!loginResult.code) {
    throw new Error('微信登录失败，请稍后再试')
  }

  const session = await rawRequest<AuthSession>('/auth/wechat/login', {
    method: 'POST',
    data: {
      code: loginResult.code,
      client_device_id: getOrCreateDeviceId()
    }
  })

  persistSession(session)
  return session
}
