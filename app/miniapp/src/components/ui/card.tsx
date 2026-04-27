import type { CSSProperties, PropsWithChildren } from 'react'

import { View } from '@tarojs/components'

type CardProps = PropsWithChildren<{
  className?: string
  style?: CSSProperties
}>

export function Card({ children, className, style }: CardProps) {
  return (
    <View
      className={className}
      style={{
        padding: '28rpx',
        backgroundColor: '#ffffff',
        borderRadius: '28rpx',
        border: '1px solid #ffedd5',
        boxShadow: '0 10rpx 28rpx rgba(154, 52, 18, 0.08)',
        ...style
      }}
    >
      {children}
    </View>
  )
}
