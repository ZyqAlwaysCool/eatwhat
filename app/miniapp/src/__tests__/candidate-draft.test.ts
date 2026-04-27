import { describe, expect, it } from 'vitest'

import {
  buildCandidateDraftUrl,
  parseCandidateDraftState
} from '@/features/candidates/draft'

describe('candidate draft helpers', () => {
  it('parses candidate draft params', () => {
    expect(
      parseCandidateDraftState({
        name: '盖饭 / 简餐',
        note: '先从熟悉的简餐开始',
        cuisineIds: 'cuisine-rice-bowl',
        tasteTagIds: 'rice,hot',
        sceneTagIds: 'near-office',
        budgetId: 'budget-0-30',
        diningModeIds: 'delivery'
      })
    ).toEqual({
      name: '盖饭 / 简餐',
      note: '先从熟悉的简餐开始',
      cuisineIds: ['cuisine-rice-bowl'],
      tasteTagIds: ['rice', 'hot'],
      sceneTagIds: ['near-office'],
      budgetId: 'budget-0-30',
      diningModeIds: ['delivery']
    })
  })

  it('decodes encoded candidate draft params', () => {
    expect(
      parseCandidateDraftState({
        name: '%E7%9B%96%E9%A5%AD%20%2F%20%E7%AE%80%E9%A4%90',
        note: '%E5%85%88%E4%BB%8E%E7%86%9F%E6%82%89%E7%9A%84%E7%AE%80%E9%A4%90%E5%BC%80%E5%A7%8B',
        cuisineIds: 'cuisine-rice-bowl',
        tasteTagIds: 'rice%2Chot'
      })
    ).toEqual({
      name: '盖饭 / 简餐',
      note: '先从熟悉的简餐开始',
      cuisineIds: ['cuisine-rice-bowl'],
      tasteTagIds: ['rice', 'hot'],
      sceneTagIds: [],
      budgetId: '',
      diningModeIds: []
    })
  })

  it('builds candidate draft url with prefilled fields', () => {
    expect(
      buildCandidateDraftUrl({
        name: '盖饭 / 简餐',
        note: '先从熟悉的简餐开始',
        cuisine_ids: ['cuisine-rice-bowl'],
        taste_tag_ids: ['rice', 'hot'],
        scene_tag_ids: ['near-office'],
        budget_id: 'budget-0-30',
        dining_mode_ids: ['delivery']
      })
    ).toBe(
      '/pages/candidates/index?name=%E7%9B%96%E9%A5%AD%20%2F%20%E7%AE%80%E9%A4%90&note=%E5%85%88%E4%BB%8E%E7%86%9F%E6%82%89%E7%9A%84%E7%AE%80%E9%A4%90%E5%BC%80%E5%A7%8B&cuisineIds=cuisine-rice-bowl&tasteTagIds=rice%2Chot&sceneTagIds=near-office&budgetId=budget-0-30&diningModeIds=delivery'
    )
  })
})
