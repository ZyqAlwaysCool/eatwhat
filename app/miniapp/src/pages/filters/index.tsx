import { useEffect, useMemo, useState } from 'react'

import Taro, { getCurrentInstance } from '@tarojs/taro'
import { Text, View } from '@tarojs/components'

import { ActionButton } from '@/components/ui/action-button'
import { Card } from '@/components/ui/card'
import { Section } from '@/components/ui/section'
import {
  builtInCuisineCandidates,
  type BuiltInCuisineCandidate
} from '@/features/cuisine/catalog'
import {
  buildResultUrl,
  parseDecisionQueryState
} from '@/features/decision/query'
import {
  budgetOptions,
  diningModeOptions,
  sceneTagOptions,
  tasteTagOptions
} from '@/features/decision/taxonomy'
import { PageShell } from '@/features/app-shell/page-shell'
import { fetchCuisines, type CuisineItem } from '@/services/cuisines'

type DisplayCuisineItem = BuiltInCuisineCandidate | CuisineItem

export default function FiltersPage() {
  const initialQueryState = parseDecisionQueryState(
    getCurrentInstance().router?.params ?? {}
  )
  const [cuisineItems, setCuisineItems] = useState<CuisineItem[]>([])
  const [cuisineIds, setCuisineIds] = useState<string[]>(
    initialQueryState.cuisineIds
  )
  const [tasteTagIds, setTasteTagIds] = useState<string[]>(
    initialQueryState.tasteTagIds
  )
  const [sceneTagIds, setSceneTagIds] = useState<string[]>(
    initialQueryState.sceneTagIds
  )
  const [budgetId, setBudgetId] = useState<string>(initialQueryState.budgetId)
  const [diningModeId, setDiningModeId] = useState<string>(
    initialQueryState.diningModeId
  )
  const [showMore, setShowMore] = useState(
    initialQueryState.tasteTagIds.length > 0 ||
      initialQueryState.sceneTagIds.length > 0
  )

  const cuisineOptions = useMemo<DisplayCuisineItem[]>(
    () => [...cuisineItems, ...builtInCuisineCandidates],
    [cuisineItems]
  )

  useEffect(() => {
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

  function toggleCuisine(cuisineId: string) {
    setCuisineIds((current) =>
      current.includes(cuisineId)
        ? current.filter((item) => item !== cuisineId)
        : [...current, cuisineId]
    )
  }

  function toggleTasteTag(tagId: string) {
    setTasteTagIds((current) =>
      current.includes(tagId)
        ? current.filter((item) => item !== tagId)
        : [...current, tagId]
    )
  }

  function toggleDiningMode(modeId: string) {
    setDiningModeId((current) => (current === modeId ? '' : modeId))
  }

  function toggleSceneTag(tagId: string) {
    setSceneTagIds((current) =>
      current.includes(tagId)
        ? current.filter((item) => item !== tagId)
        : [...current, tagId]
    )
  }

  function clearFilters() {
    setCuisineIds([])
    setTasteTagIds([])
    setSceneTagIds([])
    setBudgetId('')
    setDiningModeId('either')
    setShowMore(false)
  }

  function goToResultPage() {
    Taro.navigateTo({
      url: buildResultUrl({
        cuisineIds,
        tasteTagIds,
        sceneTagIds,
        budgetId,
        diningModeId,
        excludeCandidateIds: [],
        excludeCuisineIds: []
      })
    })
  }

  return (
    <PageShell
      title='加一点条件'
      description='只保留这顿真正要用的条件。'
    >
      <Section title='先定一个大方向'>
        <Card
          style={{
            marginBottom: '16rpx'
          }}
        >
          <View>
            {cuisineOptions.map((option) => {
              const active = cuisineIds.includes(option.id)

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
                  onClick={() => toggleCuisine(option.id)}
                >
                  {option.title}
                </Text>
              )
            })}
          </View>
        </Card>
      </Section>

      <Section title='这顿怎么吃'>
        <Card
          style={{
            marginBottom: '16rpx'
          }}
        >
          <Text
            style={{
              display: 'block',
              marginBottom: '12rpx',
              color: '#7c2d12',
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
              const active = diningModeId === option.id

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

          <Text
            style={{
              display: 'block',
              marginBottom: '12rpx',
              color: '#7c2d12',
              fontSize: '28rpx',
              fontWeight: '600'
            }}
          >
            预算
          </Text>
          <View>
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
        </Card>
      </Section>

      <Section title='还想再缩小一点'>
        <Card
          style={{
            marginBottom: '16rpx'
          }}
        >
          <ActionButton
            label={showMore ? '收起更多条件' : '再加一点口味或场景'}
            variant='secondary'
            icon={showMore ? 'chevron-up' : 'chevron-down'}
            onClick={() => setShowMore((current) => !current)}
          />

          {showMore ? (
            <>
              <Text
                style={{
                  display: 'block',
                  marginBottom: '12rpx',
                  color: '#7c2d12',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                口味
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
                  color: '#7c2d12',
                  fontSize: '28rpx',
                  fontWeight: '600'
                }}
              >
                场景
              </Text>
              <View>
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
            </>
          ) : null}
        </Card>
      </Section>

      <Section title='开始抽'>
        <ActionButton label='开始抽选' icon='shuffle' onClick={goToResultPage} />
        <ActionButton
          label='清空条件'
          variant='secondary'
          icon='retry'
          onClick={clearFilters}
        />
      </Section>
    </PageShell>
  )
}
