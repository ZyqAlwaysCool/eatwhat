import { Image } from '@tarojs/components'

type IconName =
  | 'check'
  | 'shuffle'
  | 'filter'
  | 'pool'
  | 'history'
  | 'plus'
  | 'retry'
  | 'search'
  | 'chevron-down'
  | 'chevron-up'
  | 'dislike'
  | 'clock'
  | 'coin'
  | 'home'

type IconProps = {
  name: IconName
  color?: string
  size?: number
}

const iconPaths: Record<IconName, string[]> = {
  check: ['<path d="M4.5 12.75l6 6 9-13.5" />'],
  shuffle: [
    '<path d="M18.75 3.75L21 6m0 0-2.25 2.25M21 6H9.75a4.5 4.5 0 00-3.182 1.318L3 10.886" />',
    '<path d="M5.25 20.25L3 18m0 0 2.25-2.25M3 18h11.25a4.5 4.5 0 003.182-1.318L21 11.114" />'
  ],
  filter: [
    '<path d="M3.75 6h1.5" />',
    '<path d="M9.75 6H21" />',
    '<path d="M3.75 12h6.75" />',
    '<path d="M15 12H21" />',
    '<path d="M3.75 18h10.5" />',
    '<path d="M18.75 18H21" />',
    '<circle cx="7.5" cy="6" r="2.25" />',
    '<circle cx="12.75" cy="12" r="2.25" />',
    '<circle cx="16.5" cy="18" r="2.25" />'
  ],
  pool: [
    '<path d="M16.5 3.75h-9a1.5 1.5 0 00-1.5 1.5v15l6-4.5 6 4.5v-15a1.5 1.5 0 00-1.5-1.5z" />'
  ],
  history: [
    '<path d="M12 7.5v4.5l3 1.5" />',
    '<path d="M4.5 5.25v4.5H9" />',
    '<path d="M4.903 14.25A7.5 7.5 0 1012 4.5" />'
  ],
  plus: ['<path d="M12 4.5v15m7.5-7.5h-15" />'],
  retry: [
    '<path d="M16.023 9.348h4.992V4.356" />',
    '<path d="M2.985 14.652H7.98v4.992" />',
    '<path d="M4.806 9.228A8.25 8.25 0 0119.5 12c0 1.63-.471 3.148-1.285 4.428" />',
    '<path d="M19.194 14.772A8.25 8.25 0 014.5 12c0-1.63.471-3.148 1.285-4.428" />'
  ],
  search: [
    '<circle cx="10.5" cy="10.5" r="5.25" />',
    '<path d="m15 15 4.5 4.5" />'
  ],
  'chevron-down': ['<path d="m6.75 9.75 5.25 5.25 5.25-5.25" />'],
  'chevron-up': ['<path d="m6.75 14.25 5.25-5.25 5.25 5.25" />'],
  dislike: [
    '<path d="M15.362 5.214A4.5 4.5 0 0013.5 4.5H7.125A2.625 2.625 0 004.5 7.125v4.024c0 .986.552 1.89 1.43 2.343l2.82 1.41-.766 3.83a.75.75 0 00.735.898h.557a.75.75 0 00.6-.3l4.725-6.3a4.5 4.5 0 00.899-2.7V6.75c0-.54-.095-1.06-.138-1.536z" />',
    '<path d="M18.75 8.25h1.5A1.5 1.5 0 0121.75 9.75v3.75a1.5 1.5 0 01-1.5 1.5h-1.5" />'
  ],
  clock: [
    '<path d="M12 6.75v5.25l3 1.5" />',
    '<path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'
  ],
  coin: [
    '<path d="M12 6v12" />',
    '<path d="M15.75 9.375c0-1.243-1.679-2.25-3.75-2.25s-3.75 1.007-3.75 2.25 1.679 2.25 3.75 2.25 3.75 1.007 3.75 2.25-1.679 2.25-3.75 2.25-3.75-1.007-3.75-2.25" />',
    '<path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'
  ],
  home: [
    '<path d="m2.25 12 8.954-8.955a1.125 1.125 0 011.591 0L21.75 12" />',
    '<path d="M4.5 9.75v9.375c0 .621.504 1.125 1.125 1.125H9.75V15a1.125 1.125 0 011.125-1.125h2.25A1.125 1.125 0 0114.25 15v5.25h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />'
  ]
}

function buildIconSrc(name: IconName, color: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">` +
    `<g fill="none" stroke="${color}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">` +
    `${iconPaths[name].join('')}` +
    '</g></svg>'

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function Icon({
  name,
  color = '#9a3412',
  size = 20
}: IconProps) {
  return (
    <Image
      src={buildIconSrc(name, color)}
      mode='aspectFit'
      style={{
        display: 'block',
        width: `${size * 2}rpx`,
        height: `${size * 2}rpx`
      }}
    />
  )
}
