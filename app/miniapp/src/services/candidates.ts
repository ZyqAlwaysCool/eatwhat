import { request } from '@/services/http'

export type CandidateItem = {
  id: string
  name: string
  note?: string | null
  cuisine_ids: string[]
  taste_tag_ids: string[]
  scene_tag_ids: string[]
  budget_id?: string | null
  dining_mode_ids: string[]
  created_at: string
}

type CandidateListResponse = {
  items: CandidateItem[]
  total: number
}

type CandidateCreateResponse = {
  item: CandidateItem
}

export type CreateCandidatePayload = {
  name: string
  note?: string
  cuisine_ids: string[]
  taste_tag_ids: string[]
  scene_tag_ids: string[]
  budget_id?: string
  dining_mode_ids: string[]
}

export function fetchCandidates(): Promise<CandidateListResponse> {
  return request<CandidateListResponse>('/candidates')
}

export function createCandidate(
  payload: CreateCandidatePayload
): Promise<CandidateCreateResponse> {
  return request<CandidateCreateResponse>('/candidates', {
    method: 'POST',
    data: payload
  })
}
