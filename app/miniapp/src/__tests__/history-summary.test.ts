import { describe, expect, it } from 'vitest'

import { getConsecutiveSkippedCount } from '@/features/history/summary'
import type { HistoryItem } from '@/services/history'

const baseItem: Omit<HistoryItem, 'id' | 'action' | 'created_at'> = {
  title: '阿姨盖饭',
  description: 'desc',
  candidate: null,
  cuisine: null,
  applied_cuisine_ids: [],
  matched_taste_tag_ids: [],
  applied_scene_tag_ids: [],
  applied_budget_id: null,
  applied_dining_mode_ids: []
}

describe('getConsecutiveSkippedCount', () => {
  it('counts leading skipped items only', () => {
    const items: HistoryItem[] = [
      {
        ...baseItem,
        id: 'history-1',
        action: 'skipped',
        created_at: '2026-03-30T10:00:00Z'
      },
      {
        ...baseItem,
        id: 'history-2',
        action: 'skipped',
        created_at: '2026-03-30T09:00:00Z'
      },
      {
        ...baseItem,
        id: 'history-3',
        action: 'accepted',
        created_at: '2026-03-30T08:00:00Z'
      }
    ]

    expect(getConsecutiveSkippedCount(items)).toBe(2)
  })

  it('returns zero when latest item is not skipped', () => {
    const items: HistoryItem[] = [
      {
        ...baseItem,
        id: 'history-1',
        action: 'accepted',
        created_at: '2026-03-30T10:00:00Z'
      }
    ]

    expect(getConsecutiveSkippedCount(items)).toBe(0)
  })
})
