import { describe, expect, it } from 'vitest'

import {
  buildCoveredCuisineIdSet,
  filterUncoveredCuisines
} from '@/features/cuisine/coverage'
import type { CandidateItem } from '@/services/candidates'

const candidates: CandidateItem[] = [
  {
    id: 'candidate-1',
    name: '阿姨盖饭',
    note: '',
    cuisine_ids: ['cuisine-rice-bowl'],
    taste_tag_ids: [],
    scene_tag_ids: [],
    budget_id: null,
    dining_mode_ids: [],
    created_at: '2026-03-29T12:00:00Z'
  },
  {
    id: 'candidate-2',
    name: '汉堡店',
    note: '',
    cuisine_ids: ['cuisine-burger', 'cuisine-rice-bowl'],
    taste_tag_ids: [],
    scene_tag_ids: [],
    budget_id: null,
    dining_mode_ids: [],
    created_at: '2026-03-29T12:10:00Z'
  }
]

describe('cuisine coverage helpers', () => {
  it('builds covered cuisine ids from candidate pool', () => {
    expect(Array.from(buildCoveredCuisineIdSet(candidates)).sort()).toEqual([
      'cuisine-burger',
      'cuisine-rice-bowl'
    ])
  })

  it('filters out cuisines that already have mapped stores', () => {
    expect(
      filterUncoveredCuisines(
        [
          { id: 'cuisine-rice-bowl', title: '盖饭' },
          { id: 'cuisine-burger', title: '汉堡' },
          { id: 'cuisine-noodles', title: '面食' }
        ],
        candidates
      )
    ).toEqual([{ id: 'cuisine-noodles', title: '面食' }])
  })
})
