import type { PropsWithChildren } from 'react'

import { Text, View } from '@tarojs/components'

type SectionProps = PropsWithChildren<{
  title: string
  description?: string
}>

export function Section({ title, description, children }: SectionProps) {
  return (
    <View
      style={{
        marginBottom: '18rpx'
      }}
    >
      <Text
        style={{
          display: 'block',
          marginBottom: '6rpx',
          color: '#7c2d12',
          fontSize: '28rpx',
          fontWeight: '600'
        }}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={{
            display: 'block',
            marginBottom: '12rpx',
            color: '#b45309',
            fontSize: '23rpx',
            lineHeight: '34rpx'
          }}
        >
          {description}
        </Text>
      ) : null}
      {children}
    </View>
  )
}
