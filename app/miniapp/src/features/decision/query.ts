import type { DecisionRequestPayload } from '@/services/decisions'

type QueryValue = string | string[] | undefined

export type DecisionQueryState = {
  cuisineIds: string[]
  tasteTagIds: string[]
  sceneTagIds: string[]
  budgetId: string
  diningModeId: string
  excludeCandidateIds: string[]
  excludeCuisineIds: string[]
}

function readQueryList(value: QueryValue): string[] {
  const rawValue = Array.isArray(value) ? value[0] : value

  return (rawValue ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeSceneTagIds(sceneTagIds: string[]): string[] {
  if (sceneTagIds.includes('no-limit')) {
    return []
  }

  return sceneTagIds
}

export function parseDecisionQueryState(
  params: Record<string, QueryValue>
): DecisionQueryState {
  const diningModeId =
    readQueryList(params.diningModeIds)[0] ||
    (Array.isArray(params.diningModeId) ? params.diningModeId[0] : params.diningModeId) ||
    ''

  return {
    cuisineIds: readQueryList(params.cuisineIds),
    tasteTagIds: readQueryList(params.tasteTagIds),
    sceneTagIds: readQueryList(params.sceneTagIds),
    budgetId: Array.isArray(params.budgetId) ? params.budgetId[0] ?? '' : params.budgetId ?? '',
    diningModeId,
    excludeCandidateIds: readQueryList(params.excludeCandidateIds),
    excludeCuisineIds: readQueryList(params.excludeCuisineIds)
  }
}

export function createDecisionRequestPayload(
  state: DecisionQueryState
): DecisionRequestPayload {
  return {
    cuisine_ids: state.cuisineIds,
    taste_tag_ids: state.tasteTagIds,
    scene_tag_ids: normalizeSceneTagIds(state.sceneTagIds),
    budget_id: state.budgetId || undefined,
    dining_mode_ids:
      state.diningModeId && state.diningModeId !== 'either'
        ? [state.diningModeId]
        : [],
    exclude_candidate_ids: state.excludeCandidateIds,
    exclude_cuisine_ids: state.excludeCuisineIds
  }
}

export function buildDecisionQueryString(state: DecisionQueryState): string {
  const queryParts: string[] = []

  if (state.tasteTagIds.length > 0) {
    queryParts.push(
      `tasteTagIds=${encodeURIComponent(state.tasteTagIds.join(','))}`
    )
  }

  if (state.cuisineIds.length > 0) {
    queryParts.push(`cuisineIds=${encodeURIComponent(state.cuisineIds.join(','))}`)
  }

  if (state.budgetId) {
    queryParts.push(`budgetId=${encodeURIComponent(state.budgetId)}`)
  }

  if (state.sceneTagIds.length > 0) {
    queryParts.push(
      `sceneTagIds=${encodeURIComponent(state.sceneTagIds.join(','))}`
    )
  }

  if (state.diningModeId) {
    queryParts.push(`diningModeId=${encodeURIComponent(state.diningModeId)}`)
  }

  if (state.excludeCandidateIds.length > 0) {
    queryParts.push(
      `excludeCandidateIds=${encodeURIComponent(
        state.excludeCandidateIds.join(',')
      )}`
    )
  }

  if (state.excludeCuisineIds.length > 0) {
    queryParts.push(
      `excludeCuisineIds=${encodeURIComponent(state.excludeCuisineIds.join(','))}`
    )
  }

  return queryParts.join('&')
}

export function buildFiltersUrl(state: DecisionQueryState): string {
  const queryString = buildDecisionQueryString(state)

  return queryString
    ? `/pages/filters/index?${queryString}`
    : '/pages/filters/index'
}

export function buildResultUrl(state: DecisionQueryState): string {
  const queryString = buildDecisionQueryString(state)

  return queryString
    ? `/pages/result/index?${queryString}`
    : '/pages/result/index'
}
