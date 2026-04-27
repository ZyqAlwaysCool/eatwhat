import type { PropsWithChildren } from 'react'

import { Text, View } from '@tarojs/components'

type PageShellProps = PropsWithChildren<{
  eyebrow?: string
  title: string
  description: string
}>

export function PageShell({
  eyebrow,
  title,
  description,
  children
}: PageShellProps) {
  return (
    <View
      className='app-page'
      style={{
        backgroundColor: '#fffaf5'
      }}
    >
      <View
        style={{
          marginBottom: '24rpx'
        }}
      >
        {eyebrow ? (
          <Text
            style={{
              display: 'block',
              marginBottom: '12rpx',
              color: '#f97316',
              fontSize: '24rpx',
              fontWeight: '600',
              letterSpacing: '2rpx'
            }}
          >
            {eyebrow}
          </Text>
        ) : null}
        <Text
          style={{
            display: 'block',
            marginBottom: '8rpx',
            color: '#7c2d12',
            fontSize: '46rpx',
            fontWeight: '700'
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            display: 'block',
            color: '#b45309',
            fontSize: '23rpx',
            lineHeight: '34rpx'
          }}
        >
          {description}
        </Text>
      </View>
      {children}
    </View>
  )
}
