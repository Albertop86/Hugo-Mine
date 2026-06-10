'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import CharacterPreview from '@/components/CharacterPreview'
import { PREMADE_SKINS, CATEGORY_LABELS, type SkinCategory } from '@/lib/premadeSkins'
import type { CommunitySkin } from '@/app/api/skins/route'

// ── Skin card ──────────────────────────────────────────────────────────
function SkinCard({ url, name, badge, filename }: {
  url:      string
  name:     string
  badge?:   string
  filename: string
}) {
  function download() {
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
  }

  return (
    <div className="rounded-2xl flex flex-col items-center gap-3 p-4 transition-all hover:scale-[1.02]"
      style={{ background: 'var(--color-cream-dark)', border: '2px solid var(--color-brown-dirt)' }}>
      {badge && (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full self-start"
          style={{ background: 'var(--color-green-mine)', color: 'white' }}>
          {badge}
        </span>
      )}
      <div className="rounded-xl p-3 w-full flex items-center justify-center" style={{ background: '#5a6a7a', minHeight: 120 }}>
        <CharacterPreview skinUrl={url} />
      </div>
      <p className="font-bold text-sm text-center truncate w-full" style={{ color: 'var(--color-earth)' }}>{name}</p>
      <button onClick={download}
        className="w-full py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95"
        style={{ background: 'var(--color-green-mine)' }}>
        ⬇ Descargar
      </button>
    </div>
  )
}

// ── Category filter bar ───────────────────────────────────────────────
const CATEGORIES: SkinCategory[] = ['superheroes', 'cultura-pop', 'profesiones', 'clasicos']

// ── Main page ──────────────────────────────────────────────────────────
export default function GalleryPage() {
  const t      = useTranslations('Gallery')
  const locale = useLocale() as 'es' | 'en' | 'fr' | 'pt'

  const [activeCategory, setActiveCategory] = useState<SkinCategory | 'all'>('all')
  const [community, setCommunity] = useState<CommunitySkin[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    fetch('/api/skins')
      .then(r => r.json())
      .then(d => setCommunity(d.skins ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = activeCategory === 'all'
    ? PREMADE_SKINS
    : PREMADE_SKINS.filter(s => s.category === activeCategory)

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-10">

      {/* Hero */}
      <div className="flex flex-col gap-2">
        <h1 className="font-extrabold text-3xl" style={{ fontFamily: 'var(--font-pixel)', fontSize: '1.5rem', color: 'var(--color-green-mine)' }}>
          {t('title')}
        </h1>
        <p className="text-sm opacity-70" style={{ color: 'var(--color-earth)' }}>
          {t('subtitle')}
        </p>
        <Link href="/editor"
          className="mt-2 self-start px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
          style={{ background: 'var(--color-green-mine)' }}>
          ✏️ {t('createBtn')}
        </Link>
      </div>

      {/* Featured skins */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-extrabold text-lg" style={{ color: 'var(--color-earth)' }}>
            ⭐ {t('featuredTitle')}
          </h2>
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveCategory('all')}
              className="px-3 py-1 rounded-xl text-xs font-bold transition-all"
              style={{
                background: activeCategory === 'all' ? 'var(--color-green-mine)' : 'var(--color-cream-dark)',
                color:      activeCategory === 'all' ? 'white' : 'var(--color-earth)',
                border: `2px solid ${activeCategory === 'all' ? 'var(--color-green-mine)' : 'var(--color-brown-dirt)'}`,
              }}>
              {t('filterAll')}
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="px-3 py-1 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: activeCategory === cat ? 'var(--color-green-mine)' : 'var(--color-cream-dark)',
                  color:      activeCategory === cat ? 'white' : 'var(--color-earth)',
                  border: `2px solid ${activeCategory === cat ? 'var(--color-green-mine)' : 'var(--color-brown-dirt)'}`,
                }}>
                {CATEGORY_LABELS[cat][locale]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(skin => (
            <SkinCard
              key={skin.id}
              url={`/skins/premade/${skin.file}`}
              name={locale === 'en' ? skin.nameEn : skin.name}
              badge={CATEGORY_LABELS[skin.category][locale]}
              filename={skin.file}
            />
          ))}
        </div>
      </section>

      {/* Community skins */}
      <section className="flex flex-col gap-5">
        <h2 className="font-extrabold text-lg" style={{ color: 'var(--color-earth)' }}>
          👥 {t('communityTitle')}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12 opacity-40" style={{ color: 'var(--color-earth)' }}>
            <span className="text-sm font-semibold">{t('loading')}</span>
          </div>
        ) : community.length === 0 ? (
          <div className="rounded-2xl p-8 flex flex-col items-center gap-3 text-center"
            style={{ background: 'var(--color-cream-dark)', border: '2px dashed var(--color-brown-dirt)' }}>
            <span className="text-4xl">🎨</span>
            <p className="font-bold" style={{ color: 'var(--color-earth)' }}>{t('emptyTitle')}</p>
            <p className="text-sm opacity-60" style={{ color: 'var(--color-earth)' }}>{t('emptyDesc')}</p>
            <Link href="/editor"
              className="mt-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
              style={{ background: 'var(--color-green-mine)' }}>
              {t('createBtn')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {community.map(skin => (
              <SkinCard
                key={skin.id}
                url={skin.url}
                name={skin.name}
                filename={`skin-${skin.id}.png`}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
