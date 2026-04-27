import { Button, Text, View } from '@tarojs/components'

import { Icon } from '@/components/ui/icon'

type ActionButtonProps = {
  label: string
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  icon?: Parameters<typeof Icon>[0]['name']
  onClick?: () => void
}

export function ActionButton({
  label,
  variant = 'primary',
  disabled = false,
  icon,
  onClick
}: ActionButtonProps) {
  const isPrimary = variant === 'primary'
  const textColor = disabled ? '#94a3b8' : isPrimary ? '#ffffff' : '#9a3412'
  const iconColor = disabled ? '#94a3b8' : isPrimary ? '#ffffff' : '#ea580c'
  const iconBadgeBackground = disabled
    ? '#cbd5e1'
    : isPrimary
      ? 'rgba(255,255,255,0.18)'
      : '#fff7ed'

  return (
    <Button
      disabled={disabled}
      style={{
        marginBottom: '16rpx',
        minHeight: '92rpx',
        padding: '0 24rpx',
        borderRadius: '26rpx',
        border: isPrimary ? '0' : '1px solid #fed7aa',
        backgroundColor: disabled
          ? '#e2e8f0'
          : isPrimary
            ? '#f97316'
            : '#fffdf9',
        color: textColor,
        fontSize: '27rpx',
        fontWeight: '600',
        boxShadow:
          !disabled
            ? isPrimary
              ? '0 14rpx 36rpx rgba(249, 115, 22, 0.18)'
              : '0 10rpx 26rpx rgba(154, 52, 18, 0.08)'
            : 'none'
      }}
      onClick={onClick}
    >
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: '92rpx',
          justifyContent: 'center',
          gap: '14rpx'
        }}
      >
        {icon ? (
          <View
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44rpx',
              height: '44rpx',
              borderRadius: '9999rpx',
              backgroundColor: iconBadgeBackground
            }}
          >
            <Icon name={icon} color={iconColor} size={18} />
          </View>
        ) : null}
        <Text>{label}</Text>
      </View>
    </Button>
  )
}
