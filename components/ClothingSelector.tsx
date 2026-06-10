'use client'

import { useTranslations } from 'next-intl'
import type { ClothingConfig, ShirtId, PantsId, ShoeId, GenderId } from '@/lib/clothingConfig'
import { SHIRT_OPTIONS, PANTS_OPTIONS, SHOE_OPTIONS } from '@/lib/clothingConfig'

interface Props {
  value: ClothingConfig
  onChange: (next: ClothingConfig) => void
}

function Swatch({ colorHex, selected, onClick, title }: {
  colorHex: string
  selected: boolean
  onClick: () => void
  title: string
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="w-8 h-8 rounded-lg transition-all hover:scale-110 active:scale-95"
      style={{
        background: colorHex,
        border: selected
          ? '3px solid var(--color-green-mine)'
          : '2px solid rgba(0,0,0,0.18)',
        boxShadow: selected ? '0 0 0 2px var(--color-green-grass)' : 'none',
        outline: 'none',
      }}
    />
  )
}

export default function ClothingSelector({ value, onChange }: Props) {
  const t = useTranslations('Clothing')

  const shirtLabels: Record<ShirtId, string> = {
    auto:    t('auto'),
    white:   t('white'),
    black:   t('black'),
    navy:    t('navy'),
    red:     t('red'),
    green:   t('green'),
    hoodie:  t('hoodie'),
    stripe:  t('stripe'),
    polo:    t('polo'),
    flannel: t('flannel'),
    tuxedo:  t('tuxedo'),
    camo:    t('camo'),
    denim:   t('denim'),
  }

  const pantsLabels: Record<PantsId, string> = {
    jeans: t('jeans'),
    black: t('black'),
    khaki: t('khaki'),
    gray:  t('gray'),
    navy:  t('navy'),
  }

  const shoeLabels: Record<ShoeId, string> = {
    brown:    t('brown'),
    black:    t('black'),
    white:    t('white'),
    red:      t('red'),
    sneakers: t('sneakers'),
    boots:    t('boots'),
    heels:    t('heels'),
    loafers:  t('loafers'),
  }

  const genderOptions: { id: GenderId; icon: string; label: string }[] = [
    { id: 'auto', icon: '🎭', label: t('genderAuto') },
    { id: 'm',    icon: '♂',  label: t('genderMale') },
    { id: 'f',    icon: '♀',  label: t('genderFemale') },
  ]

  return (
    <div className="w-full rounded-2xl p-4 flex flex-col gap-4"
      style={{ background: 'var(--color-cream-dark)', border: '2px solid var(--color-cream-dark)' }}>
      <p className="text-xs font-extrabold tracking-wide uppercase opacity-60 text-earth">{t('title')}</p>

      {/* Gender toggle */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-earth-soft">{t('gender')}</p>
        <div className="flex gap-2">
          {genderOptions.map(opt => (
            <button key={opt.id} type="button"
              onClick={() => onChange({ ...value, gender: opt.id })}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: value.gender === opt.id ? 'var(--color-green-mine)' : 'var(--color-cream)',
                color:      value.gender === opt.id ? 'white' : 'var(--color-earth)',
                border: `2px solid ${value.gender === opt.id ? 'var(--color-green-mine)' : 'rgba(0,0,0,0.12)'}`,
              }}>
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shirts */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-earth-soft">{t('shirt')}</p>
        <div className="flex flex-wrap gap-2">
          {SHIRT_OPTIONS.map(opt => (
            <div key={opt.id} className="flex flex-col items-center gap-1">
              <Swatch
                colorHex={opt.colorHex}
                selected={value.shirt === opt.id}
                onClick={() => onChange({ ...value, shirt: opt.id })}
                title={shirtLabels[opt.id]}
              />
              <span className="text-[9px] opacity-50 text-earth leading-none">{opt.emoji}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pants */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-earth-soft">{t('pants')}</p>
        <div className="flex flex-wrap gap-2">
          {PANTS_OPTIONS.map(opt => (
            <Swatch
              key={opt.id}
              colorHex={opt.colorHex}
              selected={value.pants === opt.id}
              onClick={() => onChange({ ...value, pants: opt.id })}
              title={pantsLabels[opt.id]}
            />
          ))}
        </div>
      </div>

      {/* Shoes */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-earth-soft">{t('shoes')}</p>
        <div className="flex flex-wrap gap-2">
          {SHOE_OPTIONS.map(opt => (
            <Swatch
              key={opt.id}
              colorHex={opt.colorHex}
              selected={value.shoes === opt.id}
              onClick={() => onChange({ ...value, shoes: opt.id })}
              title={shoeLabels[opt.id]}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
