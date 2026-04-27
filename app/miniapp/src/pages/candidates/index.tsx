import { useEffect, useMemo, useState } from 'react'

import Taro, { getCurrentInstance } from '@tarojs/taro'
import { Button, Input, Text, Textarea, View } from '@tarojs/components'

import { ActionButton } from '@/components/ui/action-button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Section } from '@/components/ui/section'
import { PageShell } from '@/features/app-shell/page-shell'
import {
  buildCandidateUsageSummary,
  filterCandidates,
  type CandidateFilterState
} from '@/features/candidates/filter'
import { parseCandidateDraftState } from '@/features/candidates/draft'
import {
  builtInCuisineCandidates,
  type BuiltInCuisineCandidate
} from '@/features/cuisine/catalog'
import {
  filterUncoveredCuisines
} from '@/features/cuisine/coverage'
import {
  createCandidate,
  fetchCandidates,
  type CandidateItem
} from '@/services/candidates'
import {
  createCuisine,
  fetchCuisines,
  type CuisineItem
} from '@/services/cuisines'
import { fetchHistory, type HistoryItem } from '@/services/history'
import {
  budgetOptions,
  diningModeOptions,
  getOptionLabel,
  sceneTagOptions,
  tasteTagOptions
} from '@/features/decision/taxonomy'

type DisplayCuisineItem = (
  | BuiltInCuisineCandidate
  | CuisineItem
) & {
  source: 'built-in' | 'custom'
}

export default function CandidatesPage() {
  const initialDraftState = parseCandidateDraftState(
    getCurrentInstance().router?.params ?? {}
  )
  const [poolView, setPoolView] = useState<'restaurants' | 'cuisines'>(
    'restaurants'
  )
  const [items, setItems] = useState<CandidateItem[]>([])
  const [cuisineItems, setCuisineItems] = useState<CuisineItem[]>([])
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cuisineSubmitting, setCuisineSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<CandidateFilterState>({
    keyword: '',
    cuisineId: '',
    tasteTagId: '',
    sceneTagId: '',
    diningModeId: '',
    recentAcceptedOnly: false
  })
  const [name, setName] = useState(initialDraftState.name)
  const [note, setNote] = useState(initialDraftState.note)
  const [cuisineIds, setCuisineIds] = useState<string[]>(initialDraftState.cuisineIds)
  const [tasteTagIds, setTasteTagIds] = useState<string[]>(
    initialDraftState.tasteTagIds
  )
  const [sceneTagIds, setSceneTagIds] = useState<string[]>(
    initialDraftState.sceneTagIds
  )
  const [budgetId, setBudgetId] = useState<string>(initialDraftState.budgetId)
  const [diningModeIds, setDiningModeIds] = useState<string[]>(
    initialDraftState.diningModeIds
  )
  const [cuisineTitle, setCuisineTitle] = useState('')
  const [cuisineDescription, setCuisineDescription] = useState('')
  const [cuisineTasteTagIds, setCuisineTasteTagIds] = useState<string[]>([])
  const [cuisineSceneTagIds, setCuisineSceneTagIds] = useState<string[]>([])
  const [cuisineBudgetId, setCuisineBudgetId] = useState('')
  const [cuisineDiningModeIds, setCuisineDiningModeIds] = useState<string[]>([])
  const [showDraftDetails, setShowDraftDetails] = useState(
    Boolean(initialDraftState.note) ||
      initialDraftState.cuisineIds.length > 0 ||
      initialDraftState.tasteTagIds.length > 0 ||
      initialDraftState.sceneTagIds.length > 0 ||
      Boolean(initialDraftState.budgetId) ||
      initialDraftState.diningModeIds.length > 0
  )
  const [showFilters, setShowFilters] = useState(false)
  const [showCuisineComposer, setShowCuisineComposer] = useState(false)

  const usageSummary = useMemo(
    () => buildCandidateUsageSummary(historyItems),
    [historyItems]
  )
  const filteredItems = useMemo(
    () => filterCandidates(items, filters, usageSummary),
    [filters, items, usageSummary]
  )
  const allCuisineItems = useMemo<DisplayCuisineItem[]>(
    () => [
      ...cuisineItems.map((item) => ({
        ...item,
        source: 'custom' as const
      })),
      ...builtInCuisineCandidates.map((item) => ({
        ...item,
        source: 'built-in' as const
      }))
    ],
    [cuisineItems]
  )
  const visibleCuisineItems = useMemo(
    () => filterUncoveredCuisines(allCuisineItems, items),
    [allCuisineItems, items]
  )
  useEffect(() => {
    void loadCandidates()
  }, [])

  const hasItems = items.length > 0
  const hasPrefilledDraft =
    initialDraftState.name ||
    initialDraftState.note ||
    initialDraftState.cuisineIds.length > 0 ||
    initialDraftState.tasteTagIds.length > 0 ||
    initialDraftState.sceneTagIds.length > 0 ||
    initialDraftState.budgetId ||
    initialDraftState.diningModeIds.length > 0
  const helperText = useMemo(() => {
    if (loading) {
      return '正在读取你的候选池…'
    }

    if (error) {
      return error
    }

    if (hasPrefilledDraft) {
      return '已带入这次方向。'
    }

    return hasItems
      ? `已记录 ${items.length} 家。`
      : '先记一家也行。'
  }, [
    error,
    hasItems,
    hasPrefilledDraft,
    items.length,
    loading
  ])
  const cuisineHelperText = useMemo(() => {
    if (loading) {
      return '正在读取品类池…'
    }

    if (error && poolView === 'cuisines') {
      return error
    }

    return visibleCuisineItems.length > 0
      ? '这些方向还没有对应店铺。'
      : '这些方向都已有店铺。'
  }, [error, loading, poolView, visibleCuisineItems.length])

  async function loadCandidates() {
    setLoading(true)
    setError(null)

    try {
      const [candidateResponse, historyResponse, cuisineResponse] = await Promise.all([
        fetchCandidates(),
        fetchHistory(),
        fetchCuisines()
      ])
      setItems(candidateResponse.items)
      setHistoryItems(historyResponse.items)
      setCuisineItems(cuisineResponse.items)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '候选池读取失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    const normalizedName = name.trim()
    const normalizedNote = note.trim()

    if (!normalizedName) {
      Taro.showToast({
        title: '请先填写店铺名',
        icon: 'none'
      })
      return
    }

    setSubmitting(true)

    try {
      const response = await createCandidate({
        name: normalizedName,
        note: normalizedNote || undefined,
        cuisine_ids: cuisineIds,
        taste_tag_ids: tasteTagIds,
        scene_tag_ids: sceneTagIds,
        budget_id: budgetId || undefined,
        dining_mode_ids: diningModeIds
      })

      setItems((current) => [response.item, ...current])
      setName('')
      setNote('')
      setCuisineIds([])
      setTasteTagIds([])
      setSceneTagIds([])
      setBudgetId('')
      setDiningModeIds([])
      setShowDraftDetails(false)
      setError(null)
      Taro.showToast({
        title: '已加入候选池',
        icon: 'success'
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '新增候选项失败')
      Taro.showToast({
        title: '保存失败',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCuisineSubmit() {
    const normalizedTitle = cuisineTitle.trim()
    const normalizedDescription = cuisineDescription.trim()

    if (!normalizedTitle) {
      Taro.showToast({
        title: '请先填写品类标题',
        icon: 'none'
      })
      return
    }

    if (!normalizedDescription) {
      Taro.showToast({
        title: '请先填写品类说明',
        icon: 'none'
      })
      return
    }

    setCuisineSubmitting(true)

    try {
      const response = await createCuisine({
        title: normalizedTitle,
        description: normalizedDescription,
        taste_tag_ids: cuisineTasteTagIds,
        scene_tag_ids: cuisineSceneTagIds,
        budget_id: cuisineBudgetId || undefined,
        dining_mode_ids: cuisineDiningModeIds
      })

      setCuisineItems((current) => [response.item, ...current])
      setCuisineTitle('')
      setCuisineDescription('')
      setCuisineTasteTagIds([])
      setCuisineSceneTagIds([])
      setCuisineBudgetId('')
      setCuisineDiningModeIds([])
      setShowCuisineComposer(false)
      setError(null)
      Taro.showToast({
        title: '已加入品类池',
        icon: 'success'
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '新增品类失败')
      Taro.showToast({
        title: '保存失败',
        icon: 'none'
      })
    } finally {
      setCuisineSubmitting(false)
    }
  }

  function toggleTasteTag(tagId: string) {
    setTasteTagIds((current) =>
      current.includes(tagId)
        ? current.filter((item) => item !== tagId)
        : [...current, tagId]
    )
  }

  function toggleCuisine(cuisineId: string) {
    setCuisineIds((current) =>
      current.includes(cuisineId)
        ? current.filter((item) => item !== cuisineId)
        : [...current, cuisineId]
    )
  }

  function toggleDiningMode(modeId: string) {
    setDiningModeIds((current) =>
      current.includes(modeId)
        ? current.filter((item) => item !== modeId)
        : [...current, modeId]
    )
  }

  function toggleSceneTag(tagId: string) {
    setSceneTagIds((current) =>
      current.includes(tagId)
        ? current.filter((item) => item !== tagId)
        : [...current, tagId]
    )
  }

  function toggleCuisineTasteTag(tagId: string) {
    setCuisineTasteTagIds((current) =>
      current.includes(tagId)
        ? current.filter((item) => item !== tagId)
        : [...current, tagId]
    )
  }

  function toggleCuisineDiningMode(modeId: string) {
    setCuisineDiningModeIds((current) =>
      current.includes(modeId)
        ? current.filter((item) => item !== modeId)
        : [...current, modeId]
    )
  }

  function toggleCuisineSceneTag(tagId: string) {
    setCuisineSceneTagIds((current) =>
      current.includes(tagId)
        ? current.filter((item) => item !== tagId)
        : [...current, tagId]
    )
  }

  function getUsageText(item: CandidateItem): string {
    const acceptedAt = usageSummary.lastAcceptedAtByCandidateId[item.id]

    if (!acceptedAt) {
      return '新加入'
    }

    return `最近选过 · ${new Date(acceptedAt).toLocaleString('zh-CN')}`
  }

  function buildCuisineMetaParts(item: DisplayCuisineItem): string[] {
    return [
      item.budget_id ? getOptionLabel(budgetOptions, item.budget_id) : '',
      item.dining_mode_ids.length > 0
        ? item.dining_mode_ids
            .map((modeId) => getOptionLabel(diningModeOptions, modeId))
            .join('、')
        : '',
      item.taste_tag_ids.length > 0
        ? item.taste_tag_ids
            .map((tagId) => getOptionLabel(tasteTagOptions, tagId))
            .join('、')
        : ''
    ].filter(Boolean)
  }

  function buildCandidateMetaParts(item: CandidateItem): string[] {
    return [
      item.cuisine_ids.length > 0
        ? item.cuisine_ids.map((cuisineId) => getCuisineTitle(cuisineId)).join('、')
        : '',
      item.dining_mode_ids.length > 0
        ? item.dining_mode_ids
            .map((modeId) => getOptionLabel(diningModeOptions, modeId))
            .join('、')
        : '',
      item.budget_id ? getOptionLabel(budgetOptions, item.budget_id) : ''
    ].filter(Boolean)
  }

  function getCuisineTitle(cuisineId: string): string {
    return allCuisineItems.find((item) => item.id === cuisineId)?.title ?? cuisineId
  }

  return (
    <PageShell
      title='候选池'
      description='把常去的店记在这里。'
    >
      <Section title='切换'>
        <Card
          style={{
            marginBottom: '16rpx',
            padding: '20rpx 24rpx'
          }}
        >
          <Text
            style={{
              display: 'inline-block',
              marginRight: '12rpx',
              padding: '12rpx 22rpx',
              borderRadius: '9999rpx',
              backgroundColor:
                poolView === 'restaurants' ? '#f97316' : '#ffedd5',
              color: poolView === 'restaurants' ? '#ffffff' : '#9a3412',
              fontSize: '24rpx',
              fontWeight: '600'
            }}
            onClick={() => setPoolView('restaurants')}
          >
            店铺
          </Text>
          <Text
            style={{
              display: 'inline-block',
              padding: '12rpx 22rpx',
              borderRadius: '9999rpx',
              backgroundColor: poolView === 'cuisines' ? '#f97316' : '#ffedd5',
              color: poolView === 'cuisines' ? '#ffffff' : '#9a3412',
              fontSize: '24rpx',
              fontWeight: '600'
            }}
            onClick={() => setPoolView('cuisines')}
          >
            方向
          </Text>
        </Card>
      </Section>

      {poolView === 'restaurants' ? (
        <>
      <Section title='加一家' description={helperText}>
        <Card
          style={{
            marginBottom: '16rpx'
          }}
        >
          <Text
            style={{
              display: 'block',
              marginBottom: '12rpx',
              color: '#0f172a',
              fontSize: '28rpx',
              fontWeight: '600'
            }}
          >
            店铺名或昵称
          </Text>
          <Input
            value={name}
            maxlength={40}
            placeholder='例如：阿姨盖饭、楼下粉面'
            placeholderStyle='color: #94a3b8;'
            onInput={(event) => setName(event.detail.value)}
            style={{
              width: '100%',
              height: '88rpx',
              lineHeight: '88rpx',
              marginBottom: '20rpx',
              padding: '0 24rpx',
              borderRadius: '16rpx',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '28rpx',
              boxSizing: 'border-box'
            }}
          />

          <View
            style={{
              marginBottom: '20rpx'
            }}
          >
            <Text
              style={{
                display: 'inline-block',
                padding: '10rpx 20rpx',
                borderRadius: '9999rpx',
                backgroundColor: showDraftDetails ? '#f97316' : '#ffedd5',
                color: showDraftDetails ? '#ffffff' : '#9a3412',
                fontSize: '24rpx',
                fontWeight: '600'
              }}
              onClick={() => setShowDraftDetails((current) => !current)}
            >
              {showDraftDetails ? '收起补充' : '补充信息'}
            </Text>
          </View>

          {showDraftDetails ? (
            <>
              <Text
                style={{
                  display: 'block',
                  marginBottom: '12rpx',
                  color: '#0f172a',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                备注
              </Text>
              <Textarea
                value={note}
                maxlength={120}
                autoHeight
                placeholder='例如：适合工作日晚餐、分量大、最近刚吃过'
                onInput={(event) => setNote(event.detail.value)}
                style={{
                  width: '100%',
                  minHeight: '140rpx',
                  marginBottom: '20rpx',
                  padding: '20rpx 24rpx',
                  borderRadius: '16rpx',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '28rpx',
                  boxSizing: 'border-box'
                }}
              />

              <Text
                style={{
                  display: 'block',
                  marginBottom: '12rpx',
                  color: '#0f172a',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                关联品类
              </Text>
              <View
                style={{
                  marginBottom: '20rpx'
                }}
              >
                {allCuisineItems.map((item) => {
                  const active = cuisineIds.includes(item.id)

                  return (
                    <Text
                      key={item.id}
                      style={{
                        display: 'inline-block',
                        marginRight: '12rpx',
                        marginBottom: '12rpx',
                        padding: '10rpx 20rpx',
                        borderRadius: '9999rpx',
                        backgroundColor: active ? '#f97316' : '#ffedd5',
                        color: active ? '#ffffff' : '#9a3412',
                        fontSize: '24rpx'
                      }}
                      onClick={() => toggleCuisine(item.id)}
                    >
                      {item.title}
                    </Text>
                  )
                })}
              </View>

              <Text
                style={{
                  display: 'block',
                  marginBottom: '12rpx',
                  color: '#0f172a',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                口味标签
              </Text>
              <View
                style={{
                  marginBottom: '20rpx'
                }}
              >
                {tasteTagOptions.map((option) => {
                  const active = tasteTagIds.includes(option.id)

                  return (
                    <Text
                      key={option.id}
                      style={{
                        display: 'inline-block',
                        marginRight: '12rpx',
                        marginBottom: '12rpx',
                        padding: '10rpx 20rpx',
                        borderRadius: '9999rpx',
                        backgroundColor: active ? '#f97316' : '#ffedd5',
                        color: active ? '#ffffff' : '#9a3412',
                        fontSize: '24rpx'
                      }}
                      onClick={() => toggleTasteTag(option.id)}
                    >
                      {option.label}
                    </Text>
                  )
                })}
              </View>

              <Text
                style={{
                  display: 'block',
                  marginBottom: '12rpx',
                  color: '#0f172a',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                场景标签
              </Text>
              <View
                style={{
                  marginBottom: '20rpx'
                }}
              >
                {sceneTagOptions.map((option) => {
                  const active = sceneTagIds.includes(option.id)

                  return (
                    <Text
                      key={option.id}
                      style={{
                        display: 'inline-block',
                        marginRight: '12rpx',
                        marginBottom: '12rpx',
                        padding: '10rpx 20rpx',
                        borderRadius: '9999rpx',
                        backgroundColor: active ? '#f97316' : '#ffedd5',
                        color: active ? '#ffffff' : '#9a3412',
                        fontSize: '24rpx'
                      }}
                      onClick={() => toggleSceneTag(option.id)}
                    >
                      {option.label}
                    </Text>
                  )
                })}
              </View>

              <Text
                style={{
                  display: 'block',
                  marginBottom: '12rpx',
                  color: '#0f172a',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                预算范围
              </Text>
              <View
                style={{
                  marginBottom: '20rpx'
                }}
              >
                {budgetOptions.map((option) => {
                  const active = budgetId === option.id

                  return (
                    <Text
                      key={option.id}
                      style={{
                        display: 'inline-block',
                        marginRight: '12rpx',
                        marginBottom: '12rpx',
                        padding: '10rpx 20rpx',
                        borderRadius: '9999rpx',
                        backgroundColor: active ? '#f97316' : '#ffedd5',
                        color: active ? '#ffffff' : '#9a3412',
                        fontSize: '24rpx'
                      }}
                      onClick={() => setBudgetId(active ? '' : option.id)}
                    >
                      {option.label}
                    </Text>
                  )
                })}
              </View>

              <Text
                style={{
                  display: 'block',
                  marginBottom: '12rpx',
                  color: '#0f172a',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                用餐方式
              </Text>
              <View
                style={{
                  marginBottom: '20rpx'
                }}
              >
                {diningModeOptions.map((option) => {
                  const active = diningModeIds.includes(option.id)

                  return (
                    <Text
                      key={option.id}
                      style={{
                        display: 'inline-block',
                        marginRight: '12rpx',
                        marginBottom: '12rpx',
                        padding: '10rpx 20rpx',
                        borderRadius: '9999rpx',
                        backgroundColor: active ? '#f97316' : '#ffedd5',
                        color: active ? '#ffffff' : '#9a3412',
                        fontSize: '24rpx'
                      }}
                      onClick={() => toggleDiningMode(option.id)}
                    >
                      {option.label}
                    </Text>
                  )
                })}
              </View>
            </>
          ) : null}

          <Button
            loading={submitting}
            style={{
              borderRadius: '24rpx',
              backgroundColor: '#f97316',
              color: '#ffffff'
            }}
            onClick={() => void handleSubmit()}
          >
            存到店铺池
          </Button>
        </Card>
      </Section>

      <Section title='查找'>
        <Card
          style={{
            marginBottom: '16rpx'
          }}
        >
          <Text
            style={{
              display: 'block',
              marginBottom: '12rpx',
              color: '#0f172a',
              fontSize: '28rpx',
              fontWeight: '600'
            }}
          >
            搜索候选项
          </Text>
          <Input
            value={filters.keyword}
            maxlength={40}
            placeholder='搜索店铺名、昵称或备注'
            placeholderStyle='color: #94a3b8;'
            onInput={(event) =>
              setFilters((current) => ({
                ...current,
                keyword: event.detail.value
              }))
            }
            style={{
              width: '100%',
              height: '88rpx',
              lineHeight: '88rpx',
              marginBottom: '20rpx',
              padding: '0 24rpx',
              borderRadius: '16rpx',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '28rpx',
              boxSizing: 'border-box'
            }}
          />

          <Text
            style={{
              display: 'inline-block',
              marginBottom: '20rpx',
              padding: '10rpx 20rpx',
              borderRadius: '9999rpx',
              backgroundColor: showFilters ? '#f97316' : '#ffedd5',
              color: showFilters ? '#ffffff' : '#9a3412',
              fontSize: '24rpx',
              fontWeight: '600'
            }}
            onClick={() => setShowFilters((current) => !current)}
          >
            {showFilters ? '收起筛选' : '更多筛选'}
          </Text>

          {showFilters ? (
            <>
              <Text
                style={{
                  display: 'block',
                  marginBottom: '12rpx',
                  color: '#0f172a',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                按关联品类
              </Text>
              <View
                style={{
                  marginBottom: '20rpx'
                }}
              >
                {allCuisineItems.map((item) => {
                  const active = filters.cuisineId === item.id

                  return (
                    <Text
                      key={item.id}
                      style={{
                        display: 'inline-block',
                        marginRight: '12rpx',
                        marginBottom: '12rpx',
                        padding: '10rpx 20rpx',
                        borderRadius: '9999rpx',
                        backgroundColor: active ? '#f97316' : '#ffedd5',
                        color: active ? '#ffffff' : '#9a3412',
                        fontSize: '24rpx'
                      }}
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          cuisineId: active ? '' : item.id
                        }))
                      }
                    >
                      {item.title}
                    </Text>
                  )
                })}
              </View>

              <Text
                style={{
                  display: 'block',
                  marginBottom: '12rpx',
                  color: '#0f172a',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                按口味标签
              </Text>
              <View
                style={{
                  marginBottom: '20rpx'
                }}
              >
                {tasteTagOptions.map((option) => {
                  const active = filters.tasteTagId === option.id

                  return (
                    <Text
                      key={option.id}
                      style={{
                        display: 'inline-block',
                        marginRight: '12rpx',
                        marginBottom: '12rpx',
                        padding: '10rpx 20rpx',
                        borderRadius: '9999rpx',
                        backgroundColor: active ? '#f97316' : '#ffedd5',
                        color: active ? '#ffffff' : '#9a3412',
                        fontSize: '24rpx'
                      }}
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          tasteTagId: active ? '' : option.id
                        }))
                      }
                    >
                      {option.label}
                    </Text>
                  )
                })}
              </View>

              <Text
                style={{
                  display: 'block',
                  marginBottom: '12rpx',
                  color: '#0f172a',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                按场景标签
              </Text>
              <View
                style={{
                  marginBottom: '20rpx'
                }}
              >
                {sceneTagOptions.map((option) => {
                  const active = filters.sceneTagId === option.id

                  return (
                    <Text
                      key={option.id}
                      style={{
                        display: 'inline-block',
                        marginRight: '12rpx',
                        marginBottom: '12rpx',
                        padding: '10rpx 20rpx',
                        borderRadius: '9999rpx',
                        backgroundColor: active ? '#f97316' : '#ffedd5',
                        color: active ? '#ffffff' : '#9a3412',
                        fontSize: '24rpx'
                      }}
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          sceneTagId: active ? '' : option.id
                        }))
                      }
                    >
                      {option.label}
                    </Text>
                  )
                })}
              </View>

              <Text
                style={{
                  display: 'block',
                  marginBottom: '12rpx',
                  color: '#0f172a',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                按用餐方式
              </Text>
              <View
                style={{
                  marginBottom: '20rpx'
                }}
              >
                {diningModeOptions.map((option) => {
                  const active = filters.diningModeId === option.id

                  return (
                    <Text
                      key={option.id}
                      style={{
                        display: 'inline-block',
                        marginRight: '12rpx',
                        marginBottom: '12rpx',
                        padding: '10rpx 20rpx',
                        borderRadius: '9999rpx',
                        backgroundColor: active ? '#f97316' : '#ffedd5',
                        color: active ? '#ffffff' : '#9a3412',
                        fontSize: '24rpx'
                      }}
                      onClick={() =>
                        setFilters((current) => ({
                          ...current,
                          diningModeId: active ? '' : option.id
                        }))
                      }
                    >
                      {option.label}
                    </Text>
                  )
                })}
              </View>

              <Text
                style={{
                  display: 'inline-block',
                  padding: '10rpx 20rpx',
                  borderRadius: '9999rpx',
                  backgroundColor: filters.recentAcceptedOnly ? '#f97316' : '#ffedd5',
                  color: filters.recentAcceptedOnly ? '#ffffff' : '#9a3412',
                  fontSize: '24rpx'
                }}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    recentAcceptedOnly: !current.recentAcceptedOnly
                  }))
                }
              >
                仅看最近选中过
              </Text>
            </>
          ) : null}
        </Card>
      </Section>

      <Section
        title='列表'
        description={
          filteredItems.length !== items.length
            ? `当前显示 ${filteredItems.length} / ${items.length}`
            : undefined
        }
      >
        <View>
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              style={{
                marginBottom: '16rpx'
              }}
            >
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '12rpx',
                  gap: '16rpx'
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    color: '#0f172a',
                    fontSize: '30rpx',
                    fontWeight: '600'
                  }}
                >
                  {item.name}
                </Text>
                <Text
                  style={{
                    display: 'inline-block',
                    padding: '8rpx 18rpx',
                    borderRadius: '9999rpx',
                    backgroundColor: usageSummary.acceptedCandidateIds.has(item.id)
                      ? '#ecfdf5'
                      : '#f8fafc',
                    color: usageSummary.acceptedCandidateIds.has(item.id)
                      ? '#059669'
                      : '#64748b',
                    fontSize: '22rpx',
                    fontWeight: '600'
                  }}
                >
                  {getUsageText(item)}
                </Text>
              </View>

              {item.note ? (
                <Text
                  style={{
                    display: 'block',
                    marginBottom: buildCandidateMetaParts(item).length > 0 ? '14rpx' : '0',
                    color: '#9a3412',
                    fontSize: '24rpx',
                    lineHeight: '36rpx'
                  }}
                >
                  {item.note}
                </Text>
              ) : null}

              {buildCandidateMetaParts(item).length > 0 ? (
                <View>
                  {buildCandidateMetaParts(item).map((meta) => (
                    <Text
                      key={`${item.id}-${meta}`}
                      style={{
                        display: 'inline-block',
                        marginRight: '12rpx',
                        marginBottom: '12rpx',
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
            </Card>
          ))}
        </View>
      </Section>

      {!loading && hasItems && filteredItems.length === 0 ? (
        <Section title='筛选结果为空'>
          <EmptyState
            title='当前筛选下没有命中候选项'
            description='清掉筛选再试试。'
          />
        </Section>
      ) : null}

      {!hasItems ? (
        <Section title='还没有店铺'>
          <EmptyState
            title='先加一个熟悉的店名就够了'
            description='记个店名就能开始用。'
          />
        </Section>
      ) : null}

      <Section title='开始抽取'>
        <Button
          style={{
            borderRadius: '24rpx',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            border: '1px solid #e2e8f0'
          }}
          onClick={() => Taro.navigateTo({ url: '/pages/result/index' })}
        >
          直接去抽一次
        </Button>
      </Section>
        </>
      ) : (
        <>
          <Section
            title='方向'
            description={cuisineHelperText}
          >
            {showCuisineComposer ? (
            <Card
              style={{
                marginBottom: '16rpx'
              }}
            >
              <Text
                style={{
                  display: 'block',
                  marginBottom: '12rpx',
                  color: '#0f172a',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                品类标题
              </Text>
              <Input
                value={cuisineTitle}
                maxlength={40}
                placeholder='例如：拌饭、麻辣烫、轻食'
                placeholderStyle='color: #94a3b8;'
                onInput={(event) => setCuisineTitle(event.detail.value)}
                style={{
                  width: '100%',
                  height: '88rpx',
                  lineHeight: '88rpx',
                  marginBottom: '20rpx',
                  padding: '0 24rpx',
                  borderRadius: '16rpx',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '28rpx',
                  boxSizing: 'border-box'
                }}
              />

              <Text
                style={{
                  display: 'block',
                  marginBottom: '12rpx',
                  color: '#0f172a',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                品类说明
              </Text>
              <Textarea
                value={cuisineDescription}
                maxlength={120}
                autoHeight
                placeholder='例如：更适合工作日外卖、想吃热乎一点时优先考虑'
                placeholderStyle='color: #94a3b8;'
                onInput={(event) => setCuisineDescription(event.detail.value)}
                style={{
                  width: '100%',
                  minHeight: '140rpx',
                  marginBottom: '20rpx',
                  padding: '20rpx 24rpx',
                  borderRadius: '16rpx',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '28rpx',
                  boxSizing: 'border-box'
                }}
              />

              <Text
                style={{
                  display: 'block',
                  marginBottom: '12rpx',
                  color: '#0f172a',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                口味标签
              </Text>
              <View
                style={{
                  marginBottom: '20rpx'
                }}
              >
                {tasteTagOptions.map((option) => {
                  const active = cuisineTasteTagIds.includes(option.id)

                  return (
                    <Text
                      key={option.id}
                      style={{
                        display: 'inline-block',
                        marginRight: '12rpx',
                        marginBottom: '12rpx',
                        padding: '10rpx 20rpx',
                        borderRadius: '9999rpx',
                        backgroundColor: active ? '#f97316' : '#ffedd5',
                        color: active ? '#ffffff' : '#9a3412',
                        fontSize: '24rpx'
                      }}
                      onClick={() => toggleCuisineTasteTag(option.id)}
                    >
                      {option.label}
                    </Text>
                  )
                })}
              </View>

              <Text
                style={{
                  display: 'block',
                  marginBottom: '12rpx',
                  color: '#0f172a',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                场景标签
              </Text>
              <View
                style={{
                  marginBottom: '20rpx'
                }}
              >
                {sceneTagOptions.map((option) => {
                  const active = cuisineSceneTagIds.includes(option.id)

                  return (
                    <Text
                      key={option.id}
                      style={{
                        display: 'inline-block',
                        marginRight: '12rpx',
                        marginBottom: '12rpx',
                        padding: '10rpx 20rpx',
                        borderRadius: '9999rpx',
                        backgroundColor: active ? '#f97316' : '#ffedd5',
                        color: active ? '#ffffff' : '#9a3412',
                        fontSize: '24rpx'
                      }}
                      onClick={() => toggleCuisineSceneTag(option.id)}
                    >
                      {option.label}
                    </Text>
                  )
                })}
              </View>

              <Text
                style={{
                  display: 'block',
                  marginBottom: '12rpx',
                  color: '#0f172a',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                预算范围
              </Text>
              <View
                style={{
                  marginBottom: '20rpx'
                }}
              >
                {budgetOptions.map((option) => {
                  const active = cuisineBudgetId === option.id

                  return (
                    <Text
                      key={option.id}
                      style={{
                        display: 'inline-block',
                        marginRight: '12rpx',
                        marginBottom: '12rpx',
                        padding: '10rpx 20rpx',
                        borderRadius: '9999rpx',
                        backgroundColor: active ? '#f97316' : '#ffedd5',
                        color: active ? '#ffffff' : '#9a3412',
                        fontSize: '24rpx'
                      }}
                      onClick={() => setCuisineBudgetId(active ? '' : option.id)}
                    >
                      {option.label}
                    </Text>
                  )
                })}
              </View>

              <Text
                style={{
                  display: 'block',
                  marginBottom: '12rpx',
                  color: '#0f172a',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                用餐方式
              </Text>
              <View
                style={{
                  marginBottom: '20rpx'
                }}
              >
                {diningModeOptions.map((option) => {
                  const active = cuisineDiningModeIds.includes(option.id)

                  return (
                    <Text
                      key={option.id}
                      style={{
                        display: 'inline-block',
                        marginRight: '12rpx',
                        marginBottom: '12rpx',
                        padding: '10rpx 20rpx',
                        borderRadius: '9999rpx',
                        backgroundColor: active ? '#f97316' : '#ffedd5',
                        color: active ? '#ffffff' : '#9a3412',
                        fontSize: '24rpx'
                      }}
                      onClick={() => toggleCuisineDiningMode(option.id)}
                    >
                      {option.label}
                    </Text>
                  )
                })}
              </View>

              <Button
                loading={cuisineSubmitting}
                style={{
                  borderRadius: '24rpx',
                  backgroundColor: '#f97316',
                  color: '#ffffff'
                }}
                onClick={() => void handleCuisineSubmit()}
              >
                保存这个方向
              </Button>
            </Card>
            ) : (
              <Card
                style={{
                  marginBottom: '16rpx'
                }}
              >
                <ActionButton
                  label='新增方向'
                  variant='secondary'
                  icon='plus'
                  onClick={() => setShowCuisineComposer(true)}
                />
              </Card>
            )}
          </Section>

          <Section title='方向列表'>
            {visibleCuisineItems.length > 0 ? (
              <View>
                {visibleCuisineItems.map((item) => (
                  <Card
                    key={item.id}
                    style={{
                      marginBottom: '16rpx'
                    }}
                  >
                    <Text
                      style={{
                        display: 'block',
                        marginBottom: '12rpx',
                        color: '#0f172a',
                        fontSize: '30rpx',
                        fontWeight: '600'
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{
                        display: 'block',
                        marginBottom: buildCuisineMetaParts(item).length > 0 ? '14rpx' : '0',
                        color: '#64748b',
                        fontSize: '24rpx',
                        lineHeight: '36rpx'
                      }}
                    >
                      {item.description}
                    </Text>
                    {buildCuisineMetaParts(item).length > 0 ? (
                      <View>
                        {buildCuisineMetaParts(item).map((meta) => (
                          <Text
                            key={`${item.id}-${meta}`}
                            style={{
                              display: 'inline-block',
                              marginRight: '12rpx',
                              marginBottom: '12rpx',
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
                  </Card>
                ))}
              </View>
            ) : (
              <EmptyState
                title='现在直接用店铺就够了'
                description='这些方向都已有店铺。'
              />
            )}
          </Section>
        </>
      )}
    </PageShell>
  )
}
