import { request } from '@/services/http'

import type { CandidateItem } from '@/services/candidates'

export type DecisionRequestPayload = {
  cuisine_ids: string[]
  taste_tag_ids: string[]
  scene_tag_ids: string[]
  budget_id?: string
  dining_mode_ids: string[]
  exclude_candidate_ids?: string[]
  exclude_cuisine_ids?: string[]
}

export type DecisionCuisine = {
  id: string
  title: string
}

export type DecisionResponse = {
  mode: 'candidate' | 'empty'
  title: string
  description: string
  candidate?: CandidateItem | null
  cuisine?: DecisionCuisine | null
  rule_notes: string[]
  matched_cuisine_ids: string[]
  matched_taste_tag_ids: string[]
  applied_cuisine_ids: string[]
  applied_scene_tag_ids: string[]
  applied_budget_id?: string | null
  applied_dining_mode_ids: string[]
}

export function fetchRecommendation(
  payload: DecisionRequestPayload
): Promise<DecisionResponse> {
  return request<DecisionResponse>('/decisions/recommend', {
    method: 'POST',
    data: payload
  })
}
