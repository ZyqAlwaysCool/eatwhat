import type { CandidateItem } from '@/services/candidates'
import type { HistoryItem } from '@/services/history'

const ANY_SCENE_TAG_ID = 'no-limit'
const ANY_DINING_MODE_ID = 'either'

export type CandidateFilterState = {
  keyword: string
  cuisineId: string
  tasteTagId: string
  sceneTagId: string
  diningModeId: string
  recentAcceptedOnly: boolean
}

export type CandidateUsageSummary = {
  acceptedCandidateIds: Set<string>
  lastAcceptedAtByCandidateId: Record<string, string>
}

export function buildCandidateUsageSummary(
  historyItems: HistoryItem[]
): CandidateUsageSummary {
  const acceptedCandidateIds = new Set<string>()
  const lastAcceptedAtByCandidateId: Record<string, string> = {}

  historyItems.forEach((item) => {
    if (item.action !== 'accepted' || !item.candidate) {
      return
    }

    acceptedCandidateIds.add(item.candidate.id)
    const currentAcceptedAt = lastAcceptedAtByCandidateId[item.candidate.id]

    if (!currentAcceptedAt || item.created_at > currentAcceptedAt) {
      lastAcceptedAtByCandidateId[item.candidate.id] = item.created_at
    }
  })

  return {
    acceptedCandidateIds,
    lastAcceptedAtByCandidateId
  }
}

export function filterCandidates(
  items: CandidateItem[],
  filters: CandidateFilterState,
  usageSummary: CandidateUsageSummary
): CandidateItem[] {
  const normalizedKeyword = filters.keyword.trim().toLowerCase()

  return items
    .filter((item) => {
      if (normalizedKeyword) {
        const haystack = `${item.name} ${item.note ?? ''}`.toLowerCase()

        if (!haystack.includes(normalizedKeyword)) {
          return false
        }
      }

      if (
        filters.cuisineId &&
        !item.cuisine_ids.includes(filters.cuisineId)
      ) {
        return false
      }

      if (
        filters.tasteTagId &&
        !item.taste_tag_ids.includes(filters.tasteTagId)
      ) {
        return false
      }

      if (
        filters.sceneTagId &&
        filters.sceneTagId !== ANY_SCENE_TAG_ID &&
        item.scene_tag_ids.length === 0
      ) {
        return false
      }

      if (
        filters.sceneTagId &&
        filters.sceneTagId !== ANY_SCENE_TAG_ID &&
        !item.scene_tag_ids.includes(ANY_SCENE_TAG_ID) &&
        !item.scene_tag_ids.includes(filters.sceneTagId)
      ) {
        return false
      }

      if (
        filters.diningModeId &&
        filters.diningModeId !== ANY_DINING_MODE_ID &&
        item.dining_mode_ids.length === 0
      ) {
        return false
      }

      if (
        filters.diningModeId &&
        filters.diningModeId !== ANY_DINING_MODE_ID &&
        !item.dining_mode_ids.includes(ANY_DINING_MODE_ID) &&
        !item.dining_mode_ids.includes(filters.diningModeId)
      ) {
        return false
      }

      if (
        filters.recentAcceptedOnly &&
        !usageSummary.acceptedCandidateIds.has(item.id)
      ) {
        return false
      }

      return true
    })
    .sort((left, right) => {
      const leftAcceptedAt = usageSummary.lastAcceptedAtByCandidateId[left.id] ?? ''
      const rightAcceptedAt =
        usageSummary.lastAcceptedAtByCandidateId[right.id] ?? ''

      if (leftAcceptedAt !== rightAcceptedAt) {
        return rightAcceptedAt.localeCompare(leftAcceptedAt)
      }

      return right.created_at.localeCompare(left.created_at)
    })
}
