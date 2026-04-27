import type { CandidateItem } from '@/services/candidates'

export function buildCoveredCuisineIdSet(
  candidateItems: CandidateItem[]
): Set<string> {
  const coveredCuisineIds = new Set<string>()

  candidateItems.forEach((item) => {
    item.cuisine_ids.forEach((cuisineId) => {
      coveredCuisineIds.add(cuisineId)
    })
  })

  return coveredCuisineIds
}

export function filterUncoveredCuisines<T extends { id: string }>(
  cuisineItems: T[],
  candidateItems: CandidateItem[]
): T[] {
  const coveredCuisineIds = buildCoveredCuisineIdSet(candidateItems)

  return cuisineItems.filter((item) => !coveredCuisineIds.has(item.id))
}
