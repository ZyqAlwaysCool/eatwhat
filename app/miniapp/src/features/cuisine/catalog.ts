import cuisineCandidates from '@shared/cuisine-candidates.json'

export type BuiltInCuisineCandidate = {
  id: string
  title: string
  description: string
  taste_tag_ids: string[]
  scene_tag_ids: string[]
  budget_id?: string | null
  dining_mode_ids: string[]
}

export const builtInCuisineCandidates =
  cuisineCandidates as BuiltInCuisineCandidate[]
