import { describe, expect, it } from 'vitest'

import { cn } from '@/utils/cn'

describe('cn', () => {
  it('joins truthy class names only', () => {
    expect(cn('px-4', undefined, 'rounded-card', false, 'bg-white')).toBe(
      'px-4 rounded-card bg-white'
    )
  })
})
