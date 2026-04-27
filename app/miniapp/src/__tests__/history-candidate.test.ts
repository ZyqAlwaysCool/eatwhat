import { describe, expect, it } from 'vitest'

import { buildCandidatePayloadFromHistory } from '@/features/history/candidate'
import type { HistoryItem } from '@/services/history'

describe('buildCandidatePayloadFromHistory', () => {
  it('reuses candidate fields when history already has candidate', () => {
    const historyItem: HistoryItem = {
      id: 'history-1',
      action: 'accepted',
      title: '阿姨盖饭',
      description: '这次就吃这个',
      candidate: {
        id: 'candidate-1',
        name: '阿姨盖饭',
        note: '工作日晚餐常吃',
        cuisine_ids: ['cuisine-rice-bowl'],
        taste_tag_ids: ['rice'],
        scene_tag_ids: ['near-office'],
        budget_id: 'budget-0-30',
        dining_mode_ids: ['delivery'],
        created_at: '2026-03-30T10:00:00Z'
      },
      cuisine: null,
      applied_cuisine_ids: ['cuisine-rice-bowl'],
      matched_taste_tag_ids: ['rice'],
      applied_scene_tag_ids: ['near-office'],
      applied_budget_id: 'budget-0-30',
      applied_dining_mode_ids: ['delivery'],
      created_at: '2026-03-30T10:00:00Z'
    }

    expect(buildCandidatePayloadFromHistory(historyItem)).toEqual({
      name: '阿姨盖饭',
      note: '工作日晚餐常吃',
      cuisine_ids: ['cuisine-rice-bowl'],
      taste_tag_ids: ['rice'],
      scene_tag_ids: ['near-office'],
      budget_id: 'budget-0-30',
      dining_mode_ids: ['delivery']
    })
  })

  it('only carries filters when history comes from a cuisine result', () => {
    const historyItem: HistoryItem = {
      id: 'history-2',
      action: 'accepted',
      title: '麻辣烫',
      description: '这次是按口味和预算抽到的',
      candidate: null,
      cuisine: {
        id: 'custom-cuisine-1',
        title: '麻辣烫'
      },
      applied_cuisine_ids: ['custom-cuisine-1'],
      matched_taste_tag_ids: ['spicy', 'hot'],
      applied_scene_tag_ids: ['weekend'],
      applied_budget_id: 'budget-30-60',
      applied_dining_mode_ids: ['dine-in'],
      created_at: '2026-03-30T11:00:00Z'
    }

    expect(buildCandidatePayloadFromHistory(historyItem)).toEqual({
      name: '',
      note: undefined,
      cuisine_ids: ['custom-cuisine-1'],
      taste_tag_ids: ['spicy', 'hot'],
      scene_tag_ids: ['weekend'],
      budget_id: 'budget-30-60',
      dining_mode_ids: ['dine-in']
    })
  })
})
