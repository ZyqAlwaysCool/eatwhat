import type { HistoryItem } from '@/services/history'

export function getConsecutiveSkippedCount(items: HistoryItem[]): number {
  let count = 0

  for (const item of items) {
    if (item.action !== 'skipped') {
      break
    }

    count += 1
  }

  return count
}
