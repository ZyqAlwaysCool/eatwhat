import type { CreateCandidatePayload } from '@/services/candidates'

type QueryValue = string | string[] | undefined

export type CandidateDraftState = {
  name: string
  note: string
  cuisineIds: string[]
  tasteTagIds: string[]
  sceneTagIds: string[]
  budgetId: string
  diningModeIds: string[]
}

function readQueryString(value: QueryValue): string {
  const rawValue = Array.isArray(value) ? value[0] ?? '' : value ?? ''

  try {
    return decodeURIComponent(rawValue)
  } catch {
    return rawValue
  }
}

function readQueryList(value: QueryValue): string[] {
  return readQueryString(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function parseCandidateDraftState(
  params: Record<string, QueryValue>
): CandidateDraftState {
  return {
    name: readQueryString(params.name),
    note: readQueryString(params.note),
    cuisineIds: readQueryList(params.cuisineIds),
    tasteTagIds: readQueryList(params.tasteTagIds),
    sceneTagIds: readQueryList(params.sceneTagIds),
    budgetId: readQueryString(params.budgetId),
    diningModeIds: readQueryList(params.diningModeIds)
  }
}

export function buildCandidateDraftUrl(payload: CreateCandidatePayload): string {
  const queryParts: string[] = []

  if (payload.name) {
    queryParts.push(`name=${encodeURIComponent(payload.name)}`)
  }

  if (payload.note) {
    queryParts.push(`note=${encodeURIComponent(payload.note)}`)
  }

  if (payload.cuisine_ids.length > 0) {
    queryParts.push(`cuisineIds=${encodeURIComponent(payload.cuisine_ids.join(','))}`)
  }

  if (payload.taste_tag_ids.length > 0) {
    queryParts.push(
      `tasteTagIds=${encodeURIComponent(payload.taste_tag_ids.join(','))}`
    )
  }

  if (payload.scene_tag_ids.length > 0) {
    queryParts.push(
      `sceneTagIds=${encodeURIComponent(payload.scene_tag_ids.join(','))}`
    )
  }

  if (payload.budget_id) {
    queryParts.push(`budgetId=${encodeURIComponent(payload.budget_id)}`)
  }

  if (payload.dining_mode_ids.length > 0) {
    queryParts.push(
      `diningModeIds=${encodeURIComponent(payload.dining_mode_ids.join(','))}`
    )
  }

  return queryParts.length > 0
    ? `/pages/candidates/index?${queryParts.join('&')}`
    : '/pages/candidates/index'
}
