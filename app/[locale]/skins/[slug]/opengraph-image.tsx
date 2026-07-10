import { ImageResponse } from 'next/og'
import { getCharacterBySlug } from '@/lib/characterOfTheDay'

export const runtime     = 'edge'
export const alt         = 'Minecraft Skin'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

const STORAGE_BASE = 'https://raw.githubusercontent.com/Albertop86/Hugo-Mine/data'

const CAT_COLOR: Record<string, string> = {
  Marvel:    '#e3342f', DC:        '#2563eb', Anime:     '#7c3aed',
  Gaming:    '#059669', Películas: '#d97706', Series:    '#db2777',
  YouTubers: '#dc2626', Memes:     '#f59e0b', Minecraft: '#16a34a',
}

type Props = { params: Promise<{ slug: string; locale: string }> }

export default async function Image({ params }: Props) {
  const { slug, locale } = await params
  const char = getCharacterBySlug(slug)

  if (!char) {
    return new ImageResponse(
      <div style={{ background: '#1e2433', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white', fontSize: 60, fontWeight: 900, display: 'flex' }}>MakeSkins.com</div>
      </div>,
      { ...size }
    )
  }

  const catColor  = CAT_COLOR[char.category] ?? '#16a34a'
  const skinUrl   = char.skinFile
    ? `https://makeskins.com/skins/premade/${char.skinFile}.png`
    : `${STORAGE_BASE}/skins/characters/${char.slug}.png`

  const name     = locale === 'es' ? char.nameEs : char.nameEn
  const subtitle = locale === 'fr' ? 'Skin pour Minecraft — Gratuit'
    : locale === 'pt' ? 'Skin para Minecraft — Grátis'
    : locale === 'es' ? 'Skin para Minecraft — Gratis'
    : 'Free Minecraft Skin Download'

  const nameFontSize = name.length > 18 ? 64 : name.length > 12 ? 80 : 96

  return new ImageResponse(
    <div
      style={{
        background: '#1e2433',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '60px 80px',
        gap: 60,
        fontFamily: 'sans-serif',
      }}
    >
      {/* Pixel grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06, display: 'flex',
        backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 31px,rgba(255,255,255,.8) 31px,rgba(255,255,255,.8) 32px),repeating-linear-gradient(90deg,transparent,transparent 31px,rgba(255,255,255,.8) 31px,rgba(255,255,255,.8) 32px)',
      }} />

      {/* Left: text */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 20 }}>

        {/* Category badge */}
        <div style={{
          background: catColor, color: 'white',
          fontSize: 28, fontWeight: 700,
          padding: '8px 22px', borderRadius: 12,
          display: 'flex', alignSelf: 'flex-start',
        }}>
          {char.emoji}  {char.category}
        </div>

        {/* Character name */}
        <div style={{
          fontSize: nameFontSize, fontWeight: 900, color: 'white',
          lineHeight: 1.05, letterSpacing: -2, display: 'flex',
        }}>
          {name}
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: 36, color: '#86efac', display: 'flex' }}>
          {subtitle}
        </div>

        {/* Domain */}
        <div style={{ fontSize: 28, color: '#6b7280', marginTop: 20, display: 'flex' }}>
          makeskins.com
        </div>
      </div>

      {/* Right: skin face preview */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        borderRadius: 32,
        width: 360,
        height: 360,
        flexShrink: 0,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Face UV is 8,8 to 16,16 in a 64×64 texture.
            At 40x scale: full image = 2560×2560, face region = 320×320.
            Offset by -(8×40)=-320 to align face with container top-left,
            giving ~20px natural padding inside the 360×360 container. */}
        <img
          src={skinUrl}
          style={{
            position: 'absolute',
            width: 2560,
            height: 2560,
            left: -320,
            top: -320,
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </div>,
    { ...size }
  )
}
