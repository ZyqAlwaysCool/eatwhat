import { Text, View } from '@tarojs/components'

type EmptyStateProps = {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View
      style={{
        padding: '32rpx',
        backgroundColor: '#ffffff',
        borderRadius: '28rpx',
        border: '1px dashed #fed7aa',
        textAlign: 'center'
      }}
    >
      <Text
        style={{
          display: 'block',
          marginBottom: '12rpx',
          color: '#7c2d12',
          fontSize: '30rpx',
          fontWeight: '600'
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          display: 'block',
          color: '#b45309',
          fontSize: '24rpx',
          lineHeight: '36rpx'
        }}
      >
        {description}
      </Text>
    </View>
  )
}
