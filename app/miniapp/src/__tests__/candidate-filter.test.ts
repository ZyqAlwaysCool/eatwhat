import { describe, expect, it } from 'vitest'

import {
  buildCandidateUsageSummary,
  filterCandidates
} from '@/features/candidates/filter'
import type { CandidateItem } from '@/services/candidates'
import type { HistoryItem } from '@/services/history'

const candidates: CandidateItem[] = [
  {
    id: 'candidate-1',
    name: '阿姨盖饭',
    note: '工作日晚餐常吃',
    cuisine_ids: ['cuisine-rice-bowl'],
    taste_tag_ids: ['rice', 'hot'],
    scene_tag_ids: ['near-office'],
    budget_id: 'budget-0-30',
    dining_mode_ids: ['delivery'],
    created_at: '2026-03-29T12:00:00Z'
  },
  {
    id: 'candidate-2',
    name: '楼下粉面',
    note: '适合到店',
    cuisine_ids: ['cuisine-noodles'],
    taste_tag_ids: ['noodles'],
    scene_tag_ids: ['no-limit'],
    budget_id: 'budget-30-60',
    dining_mode_ids: ['either'],
    created_at: '2026-03-29T12:10:00Z'
  },
  {
    id: 'candidate-3',
    name: '未填方式的小店',
    note: '',
    cuisine_ids: [],
    taste_tag_ids: ['rice'],
    scene_tag_ids: [],
    budget_id: 'budget-0-30',
    dining_mode_ids: [],
    created_at: '2026-03-29T12:20:00Z'
  }
]

const historyItems: HistoryItem[] = [
  {
    id: 'history-1',
    action: 'accepted',
    title: '阿姨盖饭',
    description: '这次就吃这个',
    candidate: candidates[0],
    cuisine: null,
    applied_cuisine_ids: ['cuisine-rice-bowl'],
    matched_taste_tag_ids: ['rice'],
    applied_scene_tag_ids: ['near-office'],
    applied_budget_id: 'budget-0-30',
    applied_dining_mode_ids: ['delivery'],
    created_at: '2026-03-30T10:00:00Z'
  },
  {
    id: 'history-2',
    action: 'skipped',
    title: '楼下粉面',
    description: '先换一个',
    candidate: candidates[1],
    cuisine: null,
    applied_cuisine_ids: ['cuisine-noodles'],
    matched_taste_tag_ids: [],
    applied_scene_tag_ids: ['near-home'],
    applied_budget_id: 'budget-30-60',
    applied_dining_mode_ids: ['dine-in'],
    created_at: '2026-03-30T11:00:00Z'
  }
]

describe('candidate filters', () => {
  it('builds accepted usage summary only from accepted history', () => {
    const summary = buildCandidateUsageSummary(historyItems)

    expect(summary.acceptedCandidateIds.has('candidate-1')).toBe(true)
    expect(summary.acceptedCandidateIds.has('candidate-2')).toBe(false)
    expect(summary.lastAcceptedAtByCandidateId['candidate-1']).toBe(
      '2026-03-30T10:00:00Z'
    )
  })

  it('filters by keyword and dining mode', () => {
    const summary = buildCandidateUsageSummary(historyItems)

    const result = filterCandidates(
      candidates,
      {
        keyword: '粉面',
        cuisineId: '',
        tasteTagId: '',
        sceneTagId: '',
        diningModeId: 'dine-in',
        recentAcceptedOnly: false
      },
      summary
    )

    expect(result.map((item) => item.id)).toEqual(['candidate-2'])
  })

  it('filters by recently accepted candidates only', () => {
    const summary = buildCandidateUsageSummary(historyItems)

    const result = filterCandidates(
      candidates,
      {
        keyword: '',
        cuisineId: '',
        tasteTagId: '',
        sceneTagId: '',
        diningModeId: '',
        recentAcceptedOnly: true
      },
      summary
    )

    expect(result.map((item) => item.id)).toEqual(['candidate-1'])
  })

  it('filters by scene tag', () => {
    const summary = buildCandidateUsageSummary(historyItems)

    const result = filterCandidates(
      candidates,
      {
        keyword: '',
        cuisineId: '',
        tasteTagId: '',
        sceneTagId: 'near-home',
        diningModeId: '',
        recentAcceptedOnly: false
      },
      summary
    )

    expect(result.map((item) => item.id)).toEqual(['candidate-2'])
  })

  it('treats no-limit and either as wildcard candidates', () => {
    const summary = buildCandidateUsageSummary(historyItems)

    const result = filterCandidates(
      candidates,
      {
        keyword: '',
        cuisineId: '',
        tasteTagId: '',
        sceneTagId: 'weekend',
        diningModeId: 'delivery',
        recentAcceptedOnly: false
      },
      summary
    )

    expect(result.map((item) => item.id)).toEqual(['candidate-2'])
  })

  it('filters by cuisine id', () => {
    const summary = buildCandidateUsageSummary(historyItems)

    const result = filterCandidates(
      candidates,
      {
        keyword: '',
        cuisineId: 'cuisine-rice-bowl',
        tasteTagId: '',
        sceneTagId: '',
        diningModeId: '',
        recentAcceptedOnly: false
      },
      summary
    )

    expect(result.map((item) => item.id)).toEqual(['candidate-1'])
  })

  it('excludes items without dining mode when dining mode filter is selected', () => {
    const summary = buildCandidateUsageSummary(historyItems)

    const result = filterCandidates(
      candidates,
      {
        keyword: '',
        cuisineId: '',
        tasteTagId: '',
        sceneTagId: '',
        diningModeId: 'dine-in',
        recentAcceptedOnly: false
      },
      summary
    )

    expect(result.map((item) => item.id)).toEqual(['candidate-2'])
  })
})
