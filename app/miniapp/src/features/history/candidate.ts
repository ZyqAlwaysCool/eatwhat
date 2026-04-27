import type { CreateCandidatePayload } from '@/services/candidates'
import type { HistoryItem } from '@/services/history'

export function buildCandidatePayloadFromHistory(
  item: HistoryItem
): CreateCandidatePayload {
  if (item.candidate) {
    return {
      name: item.candidate.name,
      note: item.candidate.note ?? undefined,
      cuisine_ids: item.candidate.cuisine_ids,
      taste_tag_ids: item.candidate.taste_tag_ids,
      scene_tag_ids: item.candidate.scene_tag_ids,
      budget_id: item.candidate.budget_id ?? undefined,
      dining_mode_ids: item.candidate.dining_mode_ids
    }
  }

  if (item.cuisine) {
    return {
      name: '',
      // 中文注释：品类结果只能帮助用户带回筛选条件，不应擅自把品类名当成店铺名预填。
      note: undefined,
      cuisine_ids: [item.cuisine.id],
      taste_tag_ids: item.matched_taste_tag_ids,
      scene_tag_ids: item.applied_scene_tag_ids,
      budget_id: item.applied_budget_id ?? undefined,
      dining_mode_ids: item.applied_dining_mode_ids
    }
  }

  return {
    name: item.title,
    // 中文注释：历史里没有候选项实体时，先退化为“结果标题 + 当时描述”的轻量沉淀，降低补录门槛。
    note: item.description,
    cuisine_ids: item.applied_cuisine_ids,
    taste_tag_ids: item.matched_taste_tag_ids,
    scene_tag_ids: item.applied_scene_tag_ids,
    budget_id: item.applied_budget_id ?? undefined,
    dining_mode_ids: item.applied_dining_mode_ids
  }
}
