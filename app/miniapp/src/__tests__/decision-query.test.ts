import { describe, expect, it } from 'vitest'

import {
  buildDecisionQueryString,
  createDecisionRequestPayload,
  parseDecisionQueryState
} from '@/features/decision/query'

describe('decision query helpers', () => {
  it('parses quick filter params into query state', () => {
    expect(
      parseDecisionQueryState({
        cuisineIds: 'cuisine-rice-bowl,cuisine-noodles',
        tasteTagIds: 'spicy,hot',
        sceneTagIds: 'near-office,weekend',
        budgetId: 'budget-30-60',
        diningModeId: 'either',
        excludeCandidateIds: 'candidate-1,candidate-2',
        excludeCuisineIds: 'cuisine-hotpot'
      })
    ).toEqual({
      cuisineIds: ['cuisine-rice-bowl', 'cuisine-noodles'],
      tasteTagIds: ['spicy', 'hot'],
      sceneTagIds: ['near-office', 'weekend'],
      budgetId: 'budget-30-60',
      diningModeId: 'either',
      excludeCandidateIds: ['candidate-1', 'candidate-2'],
      excludeCuisineIds: ['cuisine-hotpot']
    })
  })

  it('builds request payload and removes either dining mode restriction', () => {
    expect(
      createDecisionRequestPayload({
        cuisineIds: ['cuisine-rice-bowl'],
        tasteTagIds: ['rice'],
        sceneTagIds: ['near-office'],
        budgetId: 'budget-0-30',
        diningModeId: 'either',
        excludeCandidateIds: ['candidate-1'],
        excludeCuisineIds: ['cuisine-hotpot']
      })
    ).toEqual({
      cuisine_ids: ['cuisine-rice-bowl'],
      taste_tag_ids: ['rice'],
      scene_tag_ids: ['near-office'],
      budget_id: 'budget-0-30',
      dining_mode_ids: [],
      exclude_candidate_ids: ['candidate-1'],
      exclude_cuisine_ids: ['cuisine-hotpot']
    })
  })

  it('removes no-limit scene restriction from request payload', () => {
    expect(
      createDecisionRequestPayload({
        cuisineIds: [],
        tasteTagIds: [],
        sceneTagIds: ['no-limit'],
        budgetId: '',
        diningModeId: 'delivery',
        excludeCandidateIds: [],
        excludeCuisineIds: []
      })
    ).toEqual({
      cuisine_ids: [],
      taste_tag_ids: [],
      scene_tag_ids: [],
      budget_id: undefined,
      dining_mode_ids: ['delivery'],
      exclude_candidate_ids: [],
      exclude_cuisine_ids: []
    })
  })

  it('builds query string for navigation', () => {
    expect(
      buildDecisionQueryString({
        cuisineIds: ['cuisine-rice-bowl'],
        tasteTagIds: ['rice', 'hot'],
        sceneTagIds: ['near-office'],
        budgetId: 'budget-0-30',
        diningModeId: 'delivery',
        excludeCandidateIds: [],
        excludeCuisineIds: ['cuisine-hotpot']
      })
    ).toBe(
      'tasteTagIds=rice%2Chot&cuisineIds=cuisine-rice-bowl&budgetId=budget-0-30&sceneTagIds=near-office&diningModeId=delivery&excludeCuisineIds=cuisine-hotpot'
    )
  })
})
