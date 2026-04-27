import { request } from '@/services/http'

import type { CandidateItem } from '@/services/candidates'
import type { DecisionCuisine } from '@/services/decisions'

export type FeedbackAction =
  | 'accepted'
  | 'skipped'
  | 'disliked'
  | 'ate_recently'
  | 'too_expensive'

export type HistoryItem = {
  id: string
  action: FeedbackAction
  title: string
  description: string
  candidate?: CandidateItem | null
  cuisine?: DecisionCuisine | null
  applied_cuisine_ids: string[]
  matched_taste_tag_ids: string[]
  applied_scene_tag_ids: string[]
  applied_budget_id?: string | null
  applied_dining_mode_ids: string[]
  created_at: string
}

type HistoryListResponse = {
  items: HistoryItem[]
  total: number
}

type FeedbackCreateResponse = {
  item: HistoryItem
}

export type FeedbackPayload = {
  action: FeedbackAction
  title: string
  description: string
  candidate?: CandidateItem | null
  cuisine?: DecisionCuisine | null
  applied_cuisine_ids: string[]
  matched_taste_tag_ids: string[]
  applied_scene_tag_ids: string[]
  applied_budget_id?: string
  applied_dining_mode_ids: string[]
}

export function fetchHistory(): Promise<HistoryListResponse> {
  return request<HistoryListResponse>('/history')
}

export function createFeedback(
  payload: FeedbackPayload
): Promise<FeedbackCreateResponse> {
  return request<FeedbackCreateResponse>('/decisions/feedback', {
    method: 'POST',
    data: payload
  })
}
