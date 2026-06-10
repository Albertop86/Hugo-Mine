import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt     = 'SkinMe – Crea tu skin de Minecraft'
export const size    = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #2d5016 0%, #5d7c15 60%, #7fb238 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Pixel grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.08,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(255,255,255,.8) 31px, rgba(255,255,255,.8) 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(255,255,255,.8) 31px, rgba(255,255,255,.8) 32px)',
          display: 'flex',
        }} />

        {/* Minecraft grass block */}
        <div style={{ fontSize: 96, marginBottom: 24, display: 'flex' }}>🟩</div>

        {/* Brand */}
        <div style={{
          fontSize: 80, fontWeight: 900, color: 'white',
          letterSpacing: '-2px', marginBottom: 20, display: 'flex',
        }}>
          SkinMe
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 32, color: 'rgba(255,255,255,0.85)',
          textAlign: 'center', maxWidth: 700, lineHeight: 1.4, display: 'flex',
        }}>
          Tu cara en Minecraft — gratis y sin registro
        </div>

        {/* Pill badge */}
        <div style={{
          marginTop: 40,
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 50,
          padding: '12px 32px',
          fontSize: 24,
          color: 'white',
          display: 'flex',
        }}>
          skinme.app
        </div>
      </div>
    ),
    { ...size }
  )
}
