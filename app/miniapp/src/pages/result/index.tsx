import { useCallback, useEffect, useMemo, useState } from 'react'

import Taro, { getCurrentInstance } from '@tarojs/taro'
import { Text, View } from '@tarojs/components'

import { ActionButton } from '@/components/ui/action-button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { Section } from '@/components/ui/section'
import { buildCandidateDraftUrl } from '@/features/candidates/draft'
import { builtInCuisineCandidates } from '@/features/cuisine/catalog'
import { getConsecutiveSkippedCount } from '@/features/history/summary'
import {
  buildFiltersUrl,
  createDecisionRequestPayload,
  parseDecisionQueryState
} from '@/features/decision/query'
import {
  budgetOptions,
  diningModeOptions,
  getOptionLabel,
  sceneTagOptions,
  tasteTagOptions
} from '@/features/decision/taxonomy'
import { PageShell } from '@/features/app-shell/page-shell'
import { fetchCuisines, type CuisineItem } from '@/services/cuisines'
import {
  fetchRecommendation,
  type DecisionRequestPayload,
  type DecisionResponse
} from '@/services/decisions'
import {
  createFeedback,
  fetchHistory,
  type FeedbackAction
} from '@/services/history'

export default function ResultPage() {
  const [result, setResult] = useState<DecisionResponse | null>(null)
  const [cuisineItems, setCuisineItems] = useState<CuisineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [consecutiveSkippedCount, setConsecutiveSkippedCount] = useState(0)
  const queryState = useMemo(
    () => parseDecisionQueryState(getCurrentInstance().router?.params ?? {}),
    []
  )
  const [excludedCandidateIds, setExcludedCandidateIds] = useState<string[]>(
    queryState.excludeCandidateIds
  )
  const [excludedCuisineIds, setExcludedCuisineIds] = useState<string[]>(
    queryState.excludeCuisineIds
  )
  const requestPayload = useMemo<DecisionRequestPayload>(
    () =>
      createDecisionRequestPayload({
        ...queryState,
        excludeCandidateIds: excludedCandidateIds,
        excludeCuisineIds: excludedCuisineIds
      }),
    [excludedCandidateIds, excludedCuisineIds, queryState]
  )
  const baseRequestPayload = useMemo<DecisionRequestPayload>(
    () =>
      createDecisionRequestPayload({
        ...queryState,
        excludeCandidateIds: [],
        excludeCuisineIds: []
      }),
    [queryState]
  )
  const initialRequestPayload = useMemo<DecisionRequestPayload>(
    () =>
      createDecisionRequestPayload({
        ...queryState,
        excludeCandidateIds: queryState.excludeCandidateIds,
        excludeCuisineIds: queryState.excludeCuisineIds
      }),
    [queryState]
  )

  const loadRecommendation = useCallback(async (payload: DecisionRequestPayload) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchRecommendation(payload)
      setResult(response)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '推荐结果读取失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRecommendation(initialRequestPayload)
    void loadHistorySummary()
    void loadCuisines()
  }, [initialRequestPayload, loadRecommendation])

  async function loadCuisines() {
    try {
      const response = await fetchCuisines()
      setCuisineItems(response.items)
    } catch {
      setCuisineItems([])
    }
  }

  function getCuisineTitle(cuisineId: string): string {
    return (
      cuisineItems.find((item) => item.id === cuisineId)?.title ??
      builtInCuisineCandidates.find((item) => item.id === cuisineId)?.title ??
      cuisineId
    )
  }

  const matchedCuisineText =
    result && result.matched_cuisine_ids.length > 0
      ? result.matched_cuisine_ids
          .map((cuisineId) => getCuisineTitle(cuisineId))
          .join('、')
      : result?.cuisine?.title ?? '未指定品类偏好'

  const matchedTasteText =
    result && result.matched_taste_tag_ids.length > 0
      ? result.matched_taste_tag_ids
          .map((tagId) => getOptionLabel(tasteTagOptions, tagId))
          .join('、')
      : '未命中特定口味标签'
  const appliedBudgetText =
    result?.applied_budget_id
      ? getOptionLabel(budgetOptions, result.applied_budget_id)
      : '未限制预算'
  const appliedSceneText =
    result && result.applied_scene_tag_ids.length > 0
      ? result.applied_scene_tag_ids
          .map((sceneTagId) => getOptionLabel(sceneTagOptions, sceneTagId))
          .join('、')
      : '未限制场景'
  const appliedDiningText =
    result && result.applied_dining_mode_ids.length > 0
      ? result.applied_dining_mode_ids
          .map((modeId) => getOptionLabel(diningModeOptions, modeId))
          .join('、')
      : '未限制用餐方式'
  const isCandidateMode = result?.mode === 'candidate'
  const isCuisineFallback = Boolean(result?.cuisine) && result?.mode !== 'candidate'
  const showSkipReminder = consecutiveSkippedCount >= 2
  const resultBadgeText =
    isCandidateMode ? '店铺推荐' : isCuisineFallback ? '方向推荐' : '推荐结果'
  const summaryChips = [
    matchedCuisineText !== '未指定品类偏好' ? `偏向 ${matchedCuisineText}` : '',
    matchedTasteText !== '未命中特定口味标签' ? matchedTasteText : '',
    appliedDiningText !== '未限制用餐方式' ? appliedDiningText : '',
    appliedBudgetText !== '未限制预算' ? appliedBudgetText : '',
    appliedSceneText !== '未限制场景' ? appliedSceneText : ''
  ].filter(Boolean)
  const heroIconName =
    isCandidateMode ? 'check' : isCuisineFallback ? 'filter' : 'shuffle'

  async function loadHistorySummary() {
    try {
      const response = await fetchHistory()
      setConsecutiveSkippedCount(getConsecutiveSkippedCount(response.items))
    } catch {
      setConsecutiveSkippedCount(0)
    }
  }

  async function submitFeedback(action: FeedbackAction) {
    if (!result) {
      return
    }

    const feedbackTitle =
      action === 'accepted'
        ? '已记录本次选择'
        : action === 'skipped'
          ? '已记录这次跳过'
          : action === 'disliked'
            ? '已记录为不喜欢'
            : action === 'too_expensive'
              ? '已记录为太贵了'
              : '已记录为最近刚吃过'

    try {
      await createFeedback({
        action,
        title: result.title,
        description: result.description,
        candidate: result.candidate ?? null,
        cuisine: result.cuisine ?? null,
        applied_cuisine_ids: result.applied_cuisine_ids,
        matched_taste_tag_ids: result.matched_taste_tag_ids,
        applied_scene_tag_ids: result.applied_scene_tag_ids,
        applied_budget_id: result.applied_budget_id ?? undefined,
        applied_dining_mode_ids: result.applied_dining_mode_ids
      })

      Taro.showToast({
        title: feedbackTitle,
        icon: 'success'
      })
      await loadHistorySummary()
    } catch (submitError) {
      Taro.showToast({
        title: submitError instanceof Error ? submitError.message : '反馈保存失败',
        icon: 'none'
      })
      throw submitError
    }
  }

  async function handleAcceptResult() {
    if (!result) {
      return
    }

    await submitFeedback('accepted')

    if (result.mode !== 'candidate') {
      const modalResult = await Taro.showModal({
        title: '这次先按这个方向吃',
        content: '要不要顺手补一家你常去的店？',
        confirmText: '去补一家',
        cancelText: '先不用'
      })

      if (modalResult.confirm) {
        Taro.reLaunch({
          url: buildCandidateDraftUrl({
            name: '',
            note: undefined,
            cuisine_ids: result.cuisine
              ? [result.cuisine.id]
              : result.applied_cuisine_ids,
            taste_tag_ids: result.matched_taste_tag_ids,
            scene_tag_ids: result.applied_scene_tag_ids,
            budget_id: result.applied_budget_id ?? undefined,
            dining_mode_ids: result.applied_dining_mode_ids
          })
        })
        return
      }
    }

    Taro.reLaunch({ url: '/pages/home/index' })
  }

  async function rerollRecommendation() {
    if (!result) {
      await loadRecommendation(requestPayload)
      return
    }

    // 中文注释：换一个时要临时排除当前结果，避免连续命中同一个店铺或同一个方向。
    const nextExcludedCandidateIds =
      result.candidate && result.mode === 'candidate'
        ? [...new Set([...excludedCandidateIds, result.candidate.id])]
        : excludedCandidateIds
    const nextExcludedCuisineIds =
      result.cuisine && result.mode !== 'candidate'
        ? [...new Set([...excludedCuisineIds, result.cuisine.id])]
        : excludedCuisineIds

    setLoading(true)
    setError(null)

    try {
      const nextPayload = createDecisionRequestPayload({
        ...queryState,
        excludeCandidateIds: nextExcludedCandidateIds,
        excludeCuisineIds: nextExcludedCuisineIds
      })
      const nextResult = await fetchRecommendation(nextPayload)

      if (
        nextResult.mode === 'empty' &&
        !nextResult.cuisine &&
        (nextExcludedCandidateIds.length > 0 || nextExcludedCuisineIds.length > 0)
      ) {
        setExcludedCandidateIds([])
        setExcludedCuisineIds([])
        const resetResult = await fetchRecommendation(baseRequestPayload)
        setResult(resetResult)
        return
      }

      setExcludedCandidateIds(nextExcludedCandidateIds)
      setExcludedCuisineIds(nextExcludedCuisineIds)
      setResult(nextResult)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '推荐结果读取失败')
    } finally {
      setLoading(false)
    }
  }

  function handleAddToCandidatePool() {
    if (result?.mode === 'candidate') {
      Taro.showToast({
        title: '当前结果已在你的候选池中',
        icon: 'none'
      })
      return
    }

    Taro.navigateTo({
      url: buildCandidateDraftUrl({
        name: '',
        // 中文注释：这里是从“品类建议”回填候选池，只保留条件，不替用户编造店铺名和备注。
        note: undefined,
        cuisine_ids: result?.cuisine ? [result.cuisine.id] : result?.applied_cuisine_ids ?? [],
        taste_tag_ids: result?.matched_taste_tag_ids ?? [],
        scene_tag_ids: result?.applied_scene_tag_ids ?? [],
        budget_id: result?.applied_budget_id ?? undefined,
        dining_mode_ids: result?.applied_dining_mode_ids ?? []
      })
    })
  }

  return (
    <PageShell
      title='推荐结果'
      description='喜欢就定，不喜欢就换一个。'
    >
      <Section title='这次抽到'>
        {loading ? (
          <Card
            style={{
              backgroundColor: '#f97316'
            }}
          >
            <Text
              style={{
                display: 'block',
                color: '#ffffff',
                fontSize: '30rpx',
                fontWeight: '600'
              }}
            >
              正在生成推荐结果…
            </Text>
          </Card>
        ) : error ? (
          <Card>
            <Text
              style={{
                display: 'block',
                marginBottom: '12rpx',
                color: '#dc2626',
                fontSize: '30rpx',
                fontWeight: '600'
              }}
            >
              结果加载失败
            </Text>
            <Text
              style={{
                display: 'block',
                color: '#64748b',
                fontSize: '26rpx',
                lineHeight: '40rpx'
              }}
            >
              {error}
            </Text>
          </Card>
        ) : (
          <Card
            className='result-card-pop'
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '32rpx',
              background: isCandidateMode
                ? 'linear-gradient(145deg, #fb923c 0%, #f97316 52%, #ea580c 100%)'
                : 'linear-gradient(145deg, #fffaf0 0%, #fff7ed 45%, #ffedd5 100%)',
              boxShadow: isCandidateMode
                ? '0 20rpx 56rpx rgba(249, 115, 22, 0.24)'
                : '0 18rpx 48rpx rgba(251, 146, 60, 0.14)',
              border: isCandidateMode
                ? '1px solid rgba(255,255,255,0.12)'
                : '1px solid #fed7aa'
            }}
          >
            <View
              className='result-orb-float'
              style={{
                position: 'absolute',
                top: '-40rpx',
                right: '-16rpx',
                width: '180rpx',
                height: '180rpx',
                borderRadius: '9999rpx',
                backgroundColor: isCandidateMode
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(251,146,60,0.16)'
              }}
            />
            <View
              className='result-orb-float'
              style={{
                position: 'absolute',
                bottom: '-56rpx',
                left: '-24rpx',
                width: '140rpx',
                height: '140rpx',
                borderRadius: '9999rpx',
                backgroundColor: isCandidateMode
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(249,115,22,0.1)'
              }}
            />
            <View
              style={{
                position: 'relative',
                zIndex: 1
              }}
            >
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20rpx'
                }}
              >
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    gap: '10rpx',
                    padding: '10rpx 18rpx',
                    borderRadius: '9999rpx',
                    backgroundColor: isCandidateMode
                      ? 'rgba(255,255,255,0.18)'
                      : '#ffffff',
                    border: isCandidateMode
                      ? '1px solid rgba(255,255,255,0.14)'
                      : '1px solid #fed7aa'
                  }}
                >
                  <View
                    className='result-dot-pulse'
                    style={{
                      width: '14rpx',
                      height: '14rpx',
                      borderRadius: '9999rpx',
                      backgroundColor: isCandidateMode ? '#ffffff' : '#f97316'
                    }}
                  />
                  <Text
                    style={{
                      color: isCandidateMode ? '#ffffff' : '#c2410c',
                      fontSize: '22rpx',
                      fontWeight: '600'
                    }}
                  >
                    {resultBadgeText}
                  </Text>
                </View>
                <View
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '72rpx',
                    height: '72rpx',
                    borderRadius: '9999rpx',
                    backgroundColor: isCandidateMode
                      ? 'rgba(255,255,255,0.16)'
                      : '#ffffff',
                    border: isCandidateMode
                      ? '1px solid rgba(255,255,255,0.14)'
                      : '1px solid #fed7aa'
                  }}
                >
                  <Icon
                    name={heroIconName}
                    color={isCandidateMode ? '#ffffff' : '#ea580c'}
                    size={24}
                  />
                </View>
              </View>
              <Text
                style={{
                  display: 'block',
                  marginBottom: '12rpx',
                  color: isCandidateMode ? '#ffffff' : '#7c2d12',
                  fontSize: '58rpx',
                  fontWeight: '700',
                  lineHeight: '70rpx'
                }}
              >
                {result?.title ?? '暂未生成'}
              </Text>
              <Text
                style={{
                  display: 'block',
                  marginBottom: '20rpx',
                  color: isCandidateMode ? 'rgba(255,255,255,0.92)' : '#7c2d12',
                  fontSize: '28rpx',
                  lineHeight: '42rpx'
                }}
              >
                {result?.description ?? '请重新发起一次推荐。'}
              </Text>
              {result?.candidate?.note ? (
                <View
                  style={{
                    marginBottom: '18rpx',
                    padding: '18rpx 20rpx',
                    borderRadius: '20rpx',
                    backgroundColor: isCandidateMode
                      ? 'rgba(255,255,255,0.12)'
                      : '#ffffff'
                  }}
                >
                  <Text
                    style={{
                      display: 'block',
                      color: isCandidateMode ? 'rgba(255,255,255,0.86)' : '#7c2d12',
                      fontSize: '24rpx',
                      lineHeight: '36rpx'
                    }}
                  >
                    备注：{result.candidate.note}
                  </Text>
                </View>
              ) : null}
              {isCuisineFallback ? (
                null
              ) : null}
              {summaryChips.length > 0 ? (
                <View
                  style={{
                    marginTop: '4rpx',
                    marginBottom: '18rpx'
                  }}
                >
                  {summaryChips.map((chip) => (
                    <Text
                      key={chip}
                      style={{
                        display: 'inline-block',
                        marginRight: '12rpx',
                        marginBottom: '12rpx',
                        padding: '10rpx 18rpx',
                        borderRadius: '9999rpx',
                        backgroundColor:
                          isCandidateMode ? 'rgba(255,255,255,0.16)' : '#ffffff',
                        border: isCandidateMode
                          ? '1px solid rgba(255,255,255,0.1)'
                          : '1px solid #fed7aa',
                        color: isCandidateMode ? '#ffffff' : '#9a3412',
                        fontSize: '22rpx',
                        fontWeight: '600'
                      }}
                    >
                      {chip}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          </Card>
        )}
      </Section>

      <Section title='现在就决定'>
        <Card
          className='result-card-pop'
          style={{
            padding: '24rpx',
            backgroundColor: '#fffaf5',
            border: '1px solid #fed7aa'
          }}
        >
          <ActionButton
            label='就吃这个'
            icon='check'
            onClick={() => void handleAcceptResult()}
          />
          <ActionButton
            label='换一个'
            variant='secondary'
            icon='shuffle'
            onClick={() =>
              void (async () => {
                if (result?.mode === 'candidate') {
                  await submitFeedback('skipped')
                }
                await rerollRecommendation()
              })()
            }
          />
          {result?.mode !== 'candidate' ? (
            <ActionButton
              label='补一家这个方向的店'
              variant='secondary'
              icon='plus'
              onClick={handleAddToCandidatePool}
            />
          ) : null}
        </Card>
      </Section>

      {showSkipReminder ? (
        <Section title='还不太对？'>
          <Card>
            <ActionButton
              label='重新选条件'
              variant='secondary'
              icon='filter'
              onClick={() =>
                Taro.navigateTo({
                  url: buildFiltersUrl({
                    ...queryState,
                    excludeCandidateIds: [],
                    excludeCuisineIds: []
                  })
                })
              }
            />
          </Card>
        </Section>
      ) : null}
    </PageShell>
  )
}
