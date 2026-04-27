import { request } from '@/services/http'

export type CuisineItem = {
  id: string
  title: string
  description: string
  taste_tag_ids: string[]
  scene_tag_ids: string[]
  budget_id?: string | null
  dining_mode_ids: string[]
  created_at: string
}

type CuisineListResponse = {
  items: CuisineItem[]
  total: number
}

type CuisineCreateResponse = {
  item: CuisineItem
}

export type CreateCuisinePayload = {
  title: string
  description: string
  taste_tag_ids: string[]
  scene_tag_ids: string[]
  budget_id?: string
  dining_mode_ids: string[]
}

export function fetchCuisines(): Promise<CuisineListResponse> {
  return request<CuisineListResponse>('/cuisines')
}

export function createCuisine(
  payload: CreateCuisinePayload
): Promise<CuisineCreateResponse> {
  return request<CuisineCreateResponse>('/cuisines', {
    method: 'POST',
    data: payload
  })
}
