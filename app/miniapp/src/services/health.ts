import { request } from '@/services/http'

export type HealthResponse = {
  status: string
  service: string
}

export function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health', { auth: false })
}
