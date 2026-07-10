'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import CharacterPreview from '@/components/CharacterPreview'
import { PREMADE_SKINS, CATEGORY_LABELS, type SkinCategory } from '@/lib/premadeSkins'
import { CHARACTERS } from '@/lib/characterOfTheDay'
import type { CommunitySkin } from '@/app/api/skins/route'

const STORAGE_BASE = 'https://raw.githubusercontent.com/Albertop86/Hugo-Mine/data'

const CHAR_CATS = ['Marvel', 'DC', 'Anime', 'Gaming', 'Películas', 'Series', 'YouTubers', 'Memes', 'Minecraft'] as const
type CharCat = typeof CHAR_CATS[number]

const CAT_LABELS: Record<CharCat, Record<string, string>> = {
  Marvel:    { es: 'Marvel',     en: 'Marvel',      fr: 'Marvel',      pt: 'Marvel'     },
  DC:        { es: 'DC',         en: 'DC',           fr: 'DC',          pt: 'DC'         },
  Anime:     { es: 'Anime',      en: 'Anime',        fr: 'Anime',       pt: 'Anime'      },
  Gaming:    { es: 'Videojuegos',en: 'Gaming',       fr: 'Jeux vidéo',  pt: 'Games'      },
  Películas: { es: 'Películas',  en: 'Movies',       fr: 'Films',       pt: 'Filmes'     },
  Series:    { es: 'Series',     en: 'TV Shows',     fr: 'Séries',      pt: 'Séries'     },
  YouTubers: { es: 'YouTubers',  en: 'YouTubers',    fr: 'YouTubers',   pt: 'YouTubers'  },
  Memes:     { es: 'Memes',      en: 'Memes',        fr: 'Mèmes',       pt: 'Memes'      },
  Minecraft: { es: 'Minecraft',  en: 'Minecraft',    fr: 'Minecraft',   pt: 'Minecraft'  },
}

function charSkinUrl(char: typeof CHARACTERS[0]): string {
  return char.skinFile
    ? `/skins/premade/${char.skinFile}.png`
    : `${STORAGE_BASE}/skins/characters/${char.slug}.png`
}

// ── Premade/community skin card (download only) ────────────────────────────────
function SkinCard({ url, name, badge, filename }: {
  url: string; name: string; badge?: string; filename: string
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
      <div className="rounded-xl p-3 w-full flex items-center justify-center" style={{ background: '#1e2433', minHeight: 120 }}>
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

// ── Character card (preview + download + link to skin page) ────────────────────
function CharacterCard({ char, locale }: { char: typeof CHARACTERS[0]; locale: string }) {
  const url      = charSkinUrl(char)
  const name     = locale === 'es' ? char.nameEs : char.nameEn
  const filename = `${char.slug}-minecraft-skin.png`

  function download(e: React.MouseEvent) {
    e.preventDefault()
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
  }

  return (
    <Link href={`/skins/${char.slug}`} style={{ textDecoration: 'none' }}>
      <div className="rounded-2xl flex flex-col items-center gap-3 p-4 transition-all hover:scale-[1.02] cursor-pointer"
        style={{ background: 'var(--color-cream-dark)', border: '2px solid var(--color-brown-dirt)' }}>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full self-start"
          style={{ background: 'var(--color-green-mine)', color: 'white' }}>
          {char.emoji} {char.category}
        </span>
        <div className="rounded-xl p-3 w-full flex items-center justify-center" style={{ background: '#1e2433', minHeight: 120 }}>
          <CharacterPreview skinUrl={url} />
        </div>
        <p className="font-bold text-sm text-center truncate w-full" style={{ color: 'var(--color-earth)' }}>{name}</p>
        <button onClick={download}
          className="w-full py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'var(--color-green-mine)' }}>
          ⬇ Descargar
        </button>
      </div>
    </Link>
  )
}

// ── Filter button ──────────────────────────────────────────────────────────────
function FilterBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1 rounded-xl text-xs font-bold transition-all"
      style={{
        background: active ? 'var(--color-green-mine)' : 'var(--color-cream-dark)',
        color:      active ? 'white' : 'var(--color-earth)',
        border: `2px solid ${active ? 'var(--color-green-mine)' : 'var(--color-brown-dirt)'}`,
      }}>
      {label}
    </button>
  )
}

const PREMADE_CATS: SkinCategory[] = ['superheroes', 'cultura-pop', 'profesiones', 'clasicos']

// ── Main page ──────────────────────────────────────────────────────────────────
export default function GalleryPage() {
  const t      = useTranslations('Gallery')
  const locale = useLocale() as 'es' | 'en' | 'fr' | 'pt'

  const [activeCategory,     setActiveCategory]     = useState<SkinCategory | 'all'>('all')
  const [activeCharCategory, setActiveCharCategory] = useState<CharCat | 'all'>('all')
  const [community,  setCommunity]  = useState<CommunitySkin[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    fetch('/api/skins')
      .then(r => r.json())
      .then(d => setCommunity(d.skins ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Exclude premade skins that already have a dedicated character page (to avoid duplicates)
  const charSkinFiles = new Set(CHARACTERS.flatMap(c => c.skinFile ? [c.skinFile] : []))
  const premadeOnly = PREMADE_SKINS.filter(s => !charSkinFiles.has(s.id))
  const filteredPremade = activeCategory === 'all'
    ? premadeOnly
    : premadeOnly.filter(s => s.category === activeCategory)

  const filteredChars = activeCharCategory === 'all'
    ? CHARACTERS
    : CHARACTERS.filter(c => c.category === activeCharCategory)

  const allLabel    = locale === 'es' ? 'Todos' : locale === 'fr' ? 'Tous' : locale === 'pt' ? 'Todos' : 'All'
  const charsTitle  = locale === 'es' ? 'Todos los personajes'    : locale === 'fr' ? 'Tous les personnages' : locale === 'pt' ? 'Todos os personagens' : 'All characters'
  const communityTitle = locale === 'es' ? 'Comunidad' : locale === 'fr' ? 'Communauté' : locale === 'pt' ? 'Comunidade' : 'Community'

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-10">

      {/* Hero */}
      <div className="flex flex-col gap-2">
        <h1 className="font-extrabold text-3xl"
          style={{ fontFamily: 'var(--font-pixel)', fontSize: '1.5rem', color: 'var(--color-green-mine)' }}>
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

      {/* Premade skins */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-extrabold text-lg" style={{ color: 'var(--color-earth)' }}>
            ⭐ {t('featuredTitle')}
          </h2>
          <div className="flex flex-wrap gap-2">
            <FilterBtn active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} label={allLabel} />
            {PREMADE_CATS.map(cat => (
              <FilterBtn key={cat}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
                label={CATEGORY_LABELS[cat][locale]} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredPremade.map(skin => (
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

      {/* All characters */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-extrabold text-lg" style={{ color: 'var(--color-earth)' }}>
            🎮 {charsTitle} ({filteredChars.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            <FilterBtn active={activeCharCategory === 'all'} onClick={() => setActiveCharCategory('all')} label={allLabel} />
            {CHAR_CATS.map(cat => (
              <FilterBtn key={cat}
                active={activeCharCategory === cat}
                onClick={() => setActiveCharCategory(cat)}
                label={CAT_LABELS[cat][locale]} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredChars.map(char => (
            <CharacterCard key={char.slug} char={char} locale={locale} />
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
