import { useEffect, useMemo, useState } from 'react'

import Taro from '@tarojs/taro'
import { Text, View } from '@tarojs/components'

import { ActionButton } from '@/components/ui/action-button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Section } from '@/components/ui/section'
import { PageShell } from '@/features/app-shell/page-shell'
import {
  buildFiltersUrl,
  buildResultUrl,
  type DecisionQueryState
} from '@/features/decision/query'
import { fetchCandidates, type CandidateItem } from '@/services/candidates'
import { fetchHistory, type HistoryItem } from '@/services/history'

const DEFAULT_STATE: DecisionQueryState = {
  cuisineIds: [],
  tasteTagIds: [],
  sceneTagIds: [],
  budgetId: '',
  diningModeId: 'either',
  excludeCandidateIds: [],
  excludeCuisineIds: []
}

export default function HomePage() {
  const [candidateItems, setCandidateItems] = useState<CandidateItem[]>([])
  const [recentHistory, setRecentHistory] = useState<HistoryItem | null>(null)

  useEffect(() => {
    void loadHomeData()
  }, [])

  async function loadHomeData() {
    try {
      const [candidateResponse, historyResponse] =
        await Promise.all([
          fetchCandidates(),
          fetchHistory()
        ])

      setCandidateItems(candidateResponse.items)
      setRecentHistory(historyResponse.items[0] ?? null)
    } catch {
      setCandidateItems([])
      setRecentHistory(null)
    }
  }

  const candidateCount = candidateItems.length
  const heroTitle =
    candidateCount > 0 ? '今天直接帮你从常吃的里选' : '还没建库，也可以先抽一个方向'
  const heroDescription =
    candidateCount > 0
      ? `已记录 ${candidateCount} 家常去店。`
      : '先抽一个方向。'
  const poolBadgeText = candidateCount > 0 ? `店铺池 ${candidateCount} 家` : '还没有常去店'
  const recentDecisionText = useMemo(() => {
    if (!recentHistory) {
      return '还没有最近记录，先来抽一次。'
    }

    return `${recentHistory.title} · ${
      recentHistory.action === 'accepted'
        ? '上次已决定'
        : recentHistory.action === 'skipped'
          ? '上次换了一个'
          : recentHistory.action === 'disliked'
            ? '上次标记不喜欢'
            : recentHistory.action === 'too_expensive'
              ? '上次标记太贵了'
              : '上次标记最近吃过'
    }`
  }, [recentHistory])

  function buildReplayUrl(): string {
    if (!recentHistory) {
      return buildResultUrl(DEFAULT_STATE)
    }

    return buildResultUrl({
      cuisineIds: recentHistory.applied_cuisine_ids,
      tasteTagIds: recentHistory.matched_taste_tag_ids,
      sceneTagIds: recentHistory.applied_scene_tag_ids,
      budgetId: recentHistory.applied_budget_id ?? '',
      diningModeId: recentHistory.applied_dining_mode_ids[0] ?? '',
      excludeCandidateIds: [],
      excludeCuisineIds: []
    })
  }

  return (
    <PageShell
      title='今天吃什么'
      description='帮你快一点决定。'
    >
      <Section title='开始'>
        <Card
          style={{
            marginBottom: '16rpx',
            border: '0',
            borderRadius: '32rpx',
            boxShadow: '0 18rpx 48rpx rgba(249, 115, 22, 0.18)',
            background:
              'linear-gradient(135deg, rgba(249,115,22,0.96), rgba(251,146,60,0.92))'
          }}
        >
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18rpx'
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '10rpx 18rpx',
                borderRadius: '9999rpx',
                backgroundColor: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.16)'
              }}
            >
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: '22rpx',
                  fontWeight: '600'
                }}
              >
                {poolBadgeText}
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
                backgroundColor: 'rgba(255,255,255,0.16)',
                border: '1px solid rgba(255,255,255,0.14)'
              }}
            >
              <Icon name='shuffle' color='#ffffff' size={24} />
            </View>
          </View>
          <Text
            style={{
              display: 'block',
              marginBottom: '10rpx',
              color: 'rgba(255,255,255,0.78)',
              fontSize: '24rpx'
            }}
          >
            现在就定
          </Text>
          <Text
            style={{
              display: 'block',
              marginBottom: '14rpx',
              color: '#ffffff',
              fontSize: '48rpx',
              fontWeight: '700',
              lineHeight: '62rpx'
            }}
          >
            {heroTitle}
          </Text>
          <Text
            style={{
              display: 'block',
              marginBottom: '24rpx',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '24rpx',
              lineHeight: '36rpx'
            }}
          >
            {heroDescription}
          </Text>
          <ActionButton
            label='直接帮我决定'
            icon='shuffle'
            onClick={() => Taro.navigateTo({ url: buildResultUrl(DEFAULT_STATE) })}
          />
          <ActionButton
            label='加一点条件'
            variant='secondary'
            icon='filter'
            onClick={() => Taro.navigateTo({ url: buildFiltersUrl(DEFAULT_STATE) })}
          />
        </Card>
      </Section>

      <Section title='最近'>
        <Card
          style={{
            marginBottom: '16rpx'
          }}
        >
          <Text
            style={{
              display: 'block',
              marginBottom: '20rpx',
              color: '#9a3412',
              fontSize: '26rpx',
              lineHeight: '40rpx'
            }}
          >
            {recentDecisionText}
          </Text>
          <ActionButton
            label='再来一轮'
            variant='secondary'
            icon='retry'
            onClick={() => Taro.navigateTo({ url: buildReplayUrl() })}
          />
        </Card>
      </Section>

      <Section title='管理'>
        <Card>
          <ActionButton
            label='看店铺池'
            variant='secondary'
            icon='pool'
            onClick={() => Taro.navigateTo({ url: '/pages/candidates/index' })}
          />
          <ActionButton
            label='看历史记录'
            variant='secondary'
            icon='history'
            onClick={() => Taro.navigateTo({ url: '/pages/history/index' })}
          />
          {candidateCount === 0 ? (
            <EmptyState
              title='现在先抽也完全没问题'
              description='先抽一次，之后再慢慢补店。'
            />
          ) : null}
        </Card>
      </Section>
    </PageShell>
  )
}
