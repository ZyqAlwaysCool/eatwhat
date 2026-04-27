import Taro from '@tarojs/taro'

import { rawRequest } from '@/services/http'

const SESSION_STORAGE_KEY = 'meal-decision-auth-session'
const DEVICE_ID_STORAGE_KEY = 'meal-decision-device-id'
const SESSION_EXPIRY_SKEW_MS = 60 * 1000

export type AuthSession = {
  access_token: string
  token_type: 'Bearer'
  expires_at: string
  user_id: string
}

let pendingLoginPromise: Promise<AuthSession> | null = null

export function readStoredSession(): AuthSession | null {
  try {
    const payload = Taro.getStorageSync<AuthSession | ''>(SESSION_STORAGE_KEY)

    if (!payload || typeof payload !== 'object') {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function clearStoredSession() {
  Taro.removeStorageSync(SESSION_STORAGE_KEY)
}

export function getAuthorizationHeader(): string | null {
  const session = readStoredSession()

  if (!session || !isSessionUsable(session)) {
    return null
  }

  return `${session.token_type} ${session.access_token}`
}

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

  Taro.setStorageSync(SESSION_STORAGE_KEY, session)
  return session
}

function getOrCreateDeviceId(): string {
  const storedValue = Taro.getStorageSync<string>(DEVICE_ID_STORAGE_KEY)

  if (storedValue) {
    return storedValue
  }

  const nextValue = `miniapp-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`
  Taro.setStorageSync(DEVICE_ID_STORAGE_KEY, nextValue)
  return nextValue
}

function isSessionUsable(session: AuthSession): boolean {
  const expiresAt = new Date(session.expires_at).getTime()

  if (Number.isNaN(expiresAt)) {
    return false
  }

  return expiresAt - Date.now() > SESSION_EXPIRY_SKEW_MS
}
