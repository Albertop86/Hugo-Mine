export type GenderId = 'auto' | 'm' | 'f'
export type ShirtId = 'auto' | 'white' | 'black' | 'navy' | 'red' | 'green' | 'hoodie' | 'stripe' | 'polo' | 'flannel' | 'tuxedo' | 'camo' | 'denim'
export type PantsId = 'jeans' | 'black' | 'khaki' | 'gray' | 'navy'
export type ShoeId  = 'brown' | 'black' | 'white' | 'red' | 'sneakers' | 'boots' | 'heels' | 'loafers'

export interface ClothingConfig {
  shirt: ShirtId
  pants: PantsId
  shoes: ShoeId
  gender: GenderId
}

export const DEFAULT_CLOTHING: ClothingConfig = {
  shirt: 'auto',
  pants: 'jeans',
  shoes: 'brown',
  gender: 'auto',
}

export const SHIRT_OPTIONS: { id: ShirtId; emoji: string; colorHex: string }[] = [
  { id: 'auto',    emoji: '🎨', colorHex: '#5d7c15' },
  { id: 'white',   emoji: '⬜', colorHex: '#dcdcdc' },
  { id: 'black',   emoji: '⬛', colorHex: '#303030' },
  { id: 'navy',    emoji: '🔵', colorHex: '#324688' },
  { id: 'red',     emoji: '🔴', colorHex: '#8c2d2d' },
  { id: 'green',   emoji: '🟢', colorHex: '#376440' },
  { id: 'hoodie',  emoji: '🧥', colorHex: '#555a65' },
  { id: 'stripe',  emoji: '〰️', colorHex: '#4060a0' },
  { id: 'polo',    emoji: '🏌️', colorHex: '#a52838' },
  { id: 'flannel', emoji: '🟥', colorHex: '#6e3a28' },
  { id: 'tuxedo',  emoji: '🎩', colorHex: '#1e2028' },
  { id: 'camo',    emoji: '🌿', colorHex: '#3d5028' },
  { id: 'denim',   emoji: '👕', colorHex: '#3c5070' },
]

export const PANTS_OPTIONS: { id: PantsId; colorHex: string }[] = [
  { id: 'jeans', colorHex: '#344c78' },
  { id: 'black', colorHex: '#252525' },
  { id: 'khaki', colorHex: '#8a7048' },
  { id: 'gray',  colorHex: '#4a4a5a' },
  { id: 'navy',  colorHex: '#1a2d4e' },
]

export const SHOE_OPTIONS: { id: ShoeId; colorHex: string }[] = [
  { id: 'brown',    colorHex: '#4a2410' },
  { id: 'black',    colorHex: '#151515' },
  { id: 'white',    colorHex: '#c8c8c8' },
  { id: 'red',      colorHex: '#7a1a1a' },
  { id: 'sneakers', colorHex: '#ece9e0' },
  { id: 'boots',    colorHex: '#2a1c0e' },
  { id: 'heels',    colorHex: '#6e162a' },
  { id: 'loafers',  colorHex: '#6b4828' },
]
