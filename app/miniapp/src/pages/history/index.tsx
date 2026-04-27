import { useEffect, useMemo, useState } from 'react'

import Taro from '@tarojs/taro'
import { Text, View } from '@tarojs/components'

import { ActionButton } from '@/components/ui/action-button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Section } from '@/components/ui/section'
import { buildCandidateDraftUrl } from '@/features/candidates/draft'
import { builtInCuisineCandidates } from '@/features/cuisine/catalog'
import {
  budgetOptions,
  diningModeOptions,
  getOptionLabel
} from '@/features/decision/taxonomy'
import { PageShell } from '@/features/app-shell/page-shell'
import { buildCandidatePayloadFromHistory } from '@/features/history/candidate'
import { createCandidate } from '@/services/candidates'
import { fetchCuisines, type CuisineItem } from '@/services/cuisines'
import {
  createFeedback,
  fetchHistory,
  type FeedbackAction,
  type HistoryItem
} from '@/services/history'

const CORRECTION_WINDOWS = {
  disliked: 14 * 24 * 60 * 60 * 1000,
  ate_recently: 7 * 24 * 60 * 60 * 1000,
  too_expensive: 14 * 24 * 60 * 60 * 1000
} as const

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [cuisineItems, setCuisineItems] = useState<CuisineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadHistory()
    void loadCuisines()
  }, [])

  async function loadCuisines() {
    try {
      const response = await fetchCuisines()
      setCuisineItems(response.items)
    } catch {
      setCuisineItems([])
    }
  }

  const helperText = useMemo(() => {
    if (loading) {
      return '正在读取…'
    }

    if (error) {
      return error
    }

    return items.length > 0
      ? `最近已记录 ${items.length} 条。`
      : '还没有历史记录。'
  }, [error, items.length, loading])
  const activeCorrections = useMemo(() => {
    const now = Date.now()
    const state: Record<string, Partial<Record<'disliked' | 'ate_recently' | 'too_expensive', boolean>>> =
      {}

    items.forEach((item) => {
      if (
        !item.candidate ||
        !(
          item.action === 'disliked' ||
          item.action === 'ate_recently' ||
          item.action === 'too_expensive'
        )
      ) {
        return
      }

      const windowMs = CORRECTION_WINDOWS[item.action]

      if (now - new Date(item.created_at).getTime() >= windowMs) {
        return
      }

      state[item.candidate.id] = {
        ...state[item.candidate.id],
        [item.action]: true
      }
    })

    return state
  }, [items])

  async function loadHistory() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchHistory()
      setItems(response.items)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '历史记录读取失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleCorrection(
    item: HistoryItem,
    action: Extract<FeedbackAction, 'disliked' | 'ate_recently' | 'too_expensive'>
  ) {
    if (!item.candidate) {
      return
    }

    try {
      await createFeedback({
        action,
        title: item.title,
        description: item.description,
        candidate: item.candidate,
        cuisine: item.cuisine ?? null,
        applied_cuisine_ids: item.applied_cuisine_ids,
        matched_taste_tag_ids: item.matched_taste_tag_ids,
        applied_scene_tag_ids: item.applied_scene_tag_ids,
        applied_budget_id: item.applied_budget_id ?? undefined,
        applied_dining_mode_ids: item.applied_dining_mode_ids
      })
      await loadHistory()
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : '历史反馈保存失败'
      )
    }
  }

  async function handleAddToCandidatePool(item: HistoryItem) {
    if (!item.candidate) {
      Taro.navigateTo({
        url: buildCandidateDraftUrl(buildCandidatePayloadFromHistory(item))
      })
      return
    }

    try {
      await createCandidate(buildCandidatePayloadFromHistory(item))
      Taro.showToast({
        title: '已同步到候选池',
        icon: 'success'
      })
      await loadHistory()
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : '加入候选池失败'
      )
    }
  }

  function getActionLabel(action: HistoryItem['action']): string {
    switch (action) {
      case 'accepted':
        return '已接受'
      case 'skipped':
        return '换了一个'
      case 'disliked':
        return '已标记不喜欢'
      case 'ate_recently':
        return '已标记最近吃过'
      case 'too_expensive':
        return '已标记太贵了'
      default:
        return action
    }
  }

  function getCuisineTitle(cuisineId: string): string {
    return (
      cuisineItems.find((item) => item.id === cuisineId)?.title ??
      builtInCuisineCandidates.find((item) => item.id === cuisineId)?.title ??
      cuisineId
    )
  }

  function isCorrectionDisabled(
    item: HistoryItem,
    action: Extract<FeedbackAction, 'disliked' | 'ate_recently' | 'too_expensive'>
  ): boolean {
    if (!item.candidate) {
      return true
    }

    return Boolean(activeCorrections[item.candidate.id]?.[action])
  }

  function buildHistoryMetaParts(item: HistoryItem): string[] {
    return [
      item.applied_cuisine_ids.length > 0
        ? item.applied_cuisine_ids
            .map((cuisineId) => getCuisineTitle(cuisineId))
            .join('、')
        : item.cuisine?.title ?? '',
      item.applied_dining_mode_ids.length > 0
        ? item.applied_dining_mode_ids
            .map((modeId) => getOptionLabel(diningModeOptions, modeId))
            .join('、')
        : '',
      item.applied_budget_id
        ? getOptionLabel(budgetOptions, item.applied_budget_id)
        : ''
    ].filter(Boolean)
  }

  return (
    <PageShell
      title='历史记录'
      description='看最近的选择。'
    >
      <Section title='最近' description={helperText}>
        <View>
          {items.map((item) => (
            <Card
              key={item.id}
              style={{
                marginBottom: '16rpx'
              }}
            >
              <Text
                style={{
                  display: 'block',
                  marginBottom: '10rpx',
                  color: '#64748b',
                  fontSize: '24rpx'
                }}
              >
                {new Date(item.created_at).toLocaleString('zh-CN')}
              </Text>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16rpx',
                  marginBottom: '12rpx'
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    color: '#0f172a',
                    fontSize: '30rpx',
                    fontWeight: '600',
                    lineHeight: '42rpx'
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    display: 'inline-block',
                    padding: '8rpx 16rpx',
                    borderRadius: '9999rpx',
                    backgroundColor: item.action === 'accepted' ? '#ecfdf5' : '#fff7ed',
                    color: item.action === 'accepted' ? '#059669' : '#c2410c',
                    fontSize: '22rpx',
                    fontWeight: '600'
                  }}
                >
                  {getActionLabel(item.action)}
                </Text>
              </View>
              {item.description && item.description !== item.title ? (
                <Text
                  style={{
                    display: 'block',
                    marginBottom: '14rpx',
                    color: '#64748b',
                    fontSize: '24rpx',
                    lineHeight: '36rpx'
                  }}
                >
                  {item.description}
                </Text>
              ) : null}
              {buildHistoryMetaParts(item).length > 0 ? (
                <View
                  style={{
                    marginBottom: '14rpx'
                  }}
                >
                  {buildHistoryMetaParts(item).map((meta) => (
                    <Text
                      key={`${item.id}-${meta}`}
                      style={{
                        display: 'inline-block',
                        marginRight: '12rpx',
                        marginBottom: '10rpx',
                        padding: '8rpx 16rpx',
                        borderRadius: '9999rpx',
                        backgroundColor: '#fff7ed',
                        border: '1px solid #fed7aa',
                        color: '#c2410c',
                        fontSize: '22rpx',
                        fontWeight: '600'
                      }}
                    >
                      {meta}
                    </Text>
                  ))}
                </View>
              ) : null}
              {!item.candidate ? (
                <Text
                  style={{
                    display: 'inline-block',
                    marginBottom: '14rpx',
                    padding: '8rpx 16rpx',
                    borderRadius: '9999rpx',
                    backgroundColor: '#f8fafc',
                    color: '#64748b',
                    fontSize: '22rpx',
                    fontWeight: '600'
                  }}
                >
                  可加入常用
                </Text>
              ) : null}
              <View
                style={{
                  marginTop: '6rpx'
                }}
              >
                {!item.candidate ? (
                  <ActionButton
                    label='加入常用'
                    variant='secondary'
                    icon='plus'
                    onClick={() => void handleAddToCandidatePool(item)}
                  />
                ) : null}
                {item.candidate ? (
                  <View>
                    <Text
                      style={{
                        display: 'block',
                        marginBottom: '12rpx',
                        color: '#94a3b8',
                        fontSize: '22rpx'
                      }}
                    >
                      调整反馈
                    </Text>
                    <View>
                      <Text
                        style={{
                          display: 'inline-block',
                          marginRight: '12rpx',
                          marginBottom: '12rpx',
                          padding: '10rpx 18rpx',
                          borderRadius: '9999rpx',
                          backgroundColor: isCorrectionDisabled(item, 'disliked')
                            ? '#e2e8f0'
                            : '#fff7ed',
                          color: isCorrectionDisabled(item, 'disliked')
                            ? '#94a3b8'
                            : '#c2410c',
                          fontSize: '22rpx',
                          fontWeight: '600'
                        }}
                        onClick={() =>
                          isCorrectionDisabled(item, 'disliked')
                            ? undefined
                            : void handleCorrection(item, 'disliked')
                        }
                      >
                        不喜欢
                      </Text>
                      <Text
                        style={{
                          display: 'inline-block',
                          marginRight: '12rpx',
                          marginBottom: '12rpx',
                          padding: '10rpx 18rpx',
                          borderRadius: '9999rpx',
                          backgroundColor: isCorrectionDisabled(item, 'ate_recently')
                            ? '#e2e8f0'
                            : '#fff7ed',
                          color: isCorrectionDisabled(item, 'ate_recently')
                            ? '#94a3b8'
                            : '#c2410c',
                          fontSize: '22rpx',
                          fontWeight: '600'
                        }}
                        onClick={() =>
                          isCorrectionDisabled(item, 'ate_recently')
                            ? undefined
                            : void handleCorrection(item, 'ate_recently')
                        }
                      >
                        最近别推荐
                      </Text>
                      <Text
                        style={{
                          display: 'inline-block',
                          marginBottom: '12rpx',
                          padding: '10rpx 18rpx',
                          borderRadius: '9999rpx',
                          backgroundColor: isCorrectionDisabled(item, 'too_expensive')
                            ? '#e2e8f0'
                            : '#fff7ed',
                          color: isCorrectionDisabled(item, 'too_expensive')
                            ? '#94a3b8'
                            : '#c2410c',
                          fontSize: '22rpx',
                          fontWeight: '600'
                        }}
                        onClick={() =>
                          isCorrectionDisabled(item, 'too_expensive')
                            ? undefined
                            : void handleCorrection(item, 'too_expensive')
                        }
                      >
                        太贵了
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </Card>
          ))}
        </View>
      </Section>

      {!loading && items.length === 0 ? (
        <Section title='还没有记录'>
          <EmptyState
            title='还没有反馈记录'
            description='先去抽一次。'
          />
        </Section>
      ) : null}

      <Section title='首页'>
        <ActionButton
          label='返回首页'
          variant='secondary'
          icon='home'
          onClick={() => Taro.reLaunch({ url: '/pages/home/index' })}
        />
      </Section>
    </PageShell>
  )
}
