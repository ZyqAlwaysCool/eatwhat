import { Text, View } from '@tarojs/components'

import { Card } from '@/components/ui/card'

type StatusCardProps = {
  loading: boolean
  title: string
  successText: string
  errorText: string | null
  hint: string
}

export function StatusCard({
  loading,
  title,
  successText,
  errorText,
  hint
}: StatusCardProps) {
  const content = loading ? '正在检查后端状态…' : errorText ?? successText
  const badgeBackground = errorText ? '#fff1f2' : '#ecfdf5'
  const badgeColor = errorText ? '#dc2626' : '#059669'

  return (
    <Card>
      <Text
        style={{
          display: 'block',
          marginBottom: '12rpx',
          color: '#0f172a',
          fontSize: '30rpx',
          fontWeight: '600'
        }}
      >
        {title}
      </Text>
      <View
        style={{
          display: 'inline-block',
          marginBottom: '16rpx',
          padding: '10rpx 20rpx',
          borderRadius: '9999rpx',
          backgroundColor: badgeBackground
        }}
      >
        <Text
          style={{
            color: badgeColor,
            fontSize: '24rpx',
            fontWeight: '600'
          }}
        >
          {content}
        </Text>
      </View>
      <Text
        style={{
          display: 'block',
          color: '#64748b',
          fontSize: '26rpx',
          lineHeight: '40rpx'
        }}
      >
        {hint}
      </Text>
    </Card>
  )
}
