import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { CHARACTERS } from '@/lib/characterOfTheDay'

export const revalidate = 3600

const BLOB_BASE = 'https://qpjyakz4casdsvlz.public.blob.vercel-storage.com'

type IndexEntry = { date: string; slug: string; nameEn: string; nameEs: string; emoji: string; category: string }

async function getFeaturedIndex(): Promise<IndexEntry[]> {
  try {
    const res = await fetch(`${BLOB_BASE}/characters/index.json`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    return res.json()
  } catch { return [] }
}

const META: Record<string, { title: string; desc: string; h1: string; sub: string }> = {
  es: {
    title: 'Archivo de Skins del Día — MakeSkins',
    desc:  'Descarga todas las skins de Minecraft del día. Archivo completo de personajes: superhéroes, anime, videojuegos, series y más.',
    h1:    'Archivo de Skins del Día',
    sub:   'Todos los personajes que han sido skin del día, disponibles para descargar gratis.',
  },
  en: {
    title: 'Skin of the Day Archive — MakeSkins',
    desc:  'Download all daily Minecraft skins. Complete character archive: superheroes, anime, video games, series and more.',
    h1:    'Skin of the Day Archive',
    sub:   'All characters that have been skin of the day, available for free download.',
  },
  fr: {
    title: 'Archive Skin du Jour — MakeSkins',
    desc:  'Téléchargez tous les skins Minecraft du jour. Archive complète: super-héros, anime, jeux vidéo et plus.',
    h1:    'Archive Skin du Jour',
    sub:   'Tous les personnages qui ont été le skin du jour, disponibles en téléchargement gratuit.',
  },
  pt: {
    title: 'Arquivo de Skin do Dia — MakeSkins',
    desc:  'Baixe todas as skins Minecraft do dia. Arquivo completo: super-heróis, anime, jogos, séries e mais.',
    h1:    'Arquivo de Skin do Dia',
    sub:   'Todos os personagens que foram skin do dia, disponíveis para download gratuito.',
  },
}

const LABELS: Record<string, Record<string, string>> = {
  featured:    { es: 'Destacados',         en: 'Featured',       fr: 'En vedette',    pt: 'Destacados' },
  allChars:    { es: 'Todos los personajes',en: 'All characters', fr: 'Tous les personnages', pt: 'Todos os personagens' },
  comingSoon:  { es: 'Próximamente',        en: 'Coming soon',    fr: 'Bientôt',        pt: 'Em breve' },
  viewSkin:    { es: 'Ver skin →',          en: 'View skin →',    fr: 'Voir skin →',    pt: 'Ver skin →' },
  skinDelDia:  { es: '← Skin del Día',      en: '← Skin of the Day', fr: '← Skin du Jour', pt: '← Skin do Dia' },
}

const CATEGORY_COLORS: Record<string, string> = {
  Marvel:    '#e3342f',
  DC:        '#2563eb',
  Anime:     '#7c3aed',
  Gaming:    '#059669',
  Películas: '#d97706',
  Series:    '#db2777',
  YouTubers: '#dc2626',
  Memes:     '#f59e0b',
  Minecraft: '#16a34a',
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const m = META[locale] ?? META.en
  return {
    title:       m.title,
    description: m.desc,
    alternates: {
      canonical: `/${locale}/skins`,
    },
  }
}

export default async function SkinsArchivePage() {
  const locale = await getLocale()
  const m   = META[locale] ?? META.en
  const L   = (key: string) => LABELS[key]?.[locale] ?? LABELS[key]?.en ?? key

  const featured = await getFeaturedIndex()
  const featuredSlugs = new Set(featured.map(e => e.slug))

  // All characters: featured ones first, then the rest
  const allChars = CHARACTERS.map(c => ({
    ...c,
    featuredDate: featured.find(e => e.slug === c.slug)?.date ?? null,
  })).sort((a, b) => {
    if (a.featuredDate && !b.featuredDate) return -1
    if (!a.featuredDate && b.featuredDate) return 1
    if (a.featuredDate && b.featuredDate) return b.featuredDate.localeCompare(a.featuredDate)
    return 0
  })

  const name = (c: typeof CHARACTERS[0]) => locale === 'es' ? c.nameEs : c.nameEn

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <Link href={`/${locale}/skin-del-dia`}
        className="text-sm font-semibold mb-6 inline-block opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: 'var(--color-earth)', textDecoration: 'none' }}>
        {L('skinDelDia')}
      </Link>

      <h1 className="text-3xl font-extrabold mb-2 mt-4"
        style={{ color: 'var(--color-green-mine)', fontFamily: 'var(--font-pixel)' }}>
        {m.h1}
      </h1>
      <p className="text-lg mb-10 opacity-70">{m.sub}</p>

      {/* Featured section */}
      {featured.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-earth)' }}>
            ⭐ {L('featured')} ({featured.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {featured.slice(0, 12).map(entry => (
              <Link key={entry.slug} href={`/${locale}/skins/${entry.slug}`} style={{ textDecoration: 'none' }}>
                <div className="rounded-xl p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                  style={{ background: 'var(--color-cream)', border: '2px solid var(--color-cream-dark)' }}>
                  <div className="text-4xl mb-2">{entry.emoji}</div>
                  <div className="text-xs font-bold truncate" style={{ color: 'var(--color-earth)' }}>
                    {locale === 'es' ? entry.nameEs : entry.nameEn}
                  </div>
                  <div className="text-xs opacity-40 mt-1">{entry.date}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All characters grid */}
      <section>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-earth)' }}>
          🎮 {L('allChars')} ({CHARACTERS.length})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {allChars.map(char => {
            const isFeatured = featuredSlugs.has(char.slug)
            const catColor   = CATEGORY_COLORS[char.category] ?? 'var(--color-green-mine)'
            return (
              <Link key={char.slug} href={`/${locale}/skins/${char.slug}`} style={{ textDecoration: 'none' }}>
                <div
                  className="rounded-xl p-3 text-center hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer relative"
                  style={{
                    background: isFeatured ? 'var(--color-cream)' : 'white',
                    border: `2px solid ${isFeatured ? catColor : 'var(--color-cream-dark)'}`,
                    opacity: isFeatured ? 1 : 0.7,
                  }}>
                  <div className="text-3xl mb-1">{char.emoji}</div>
                  <div className="text-xs font-semibold leading-tight truncate" style={{ color: 'var(--color-earth)' }}>
                    {name(char)}
                  </div>
                  <div className="text-xs mt-1 font-bold px-1.5 py-0.5 rounded-full inline-block"
                    style={{ background: catColor, color: 'white', fontSize: '0.6rem' }}>
                    {char.category}
                  </div>
                  {!isFeatured && (
                    <div className="text-xs opacity-30 mt-1" style={{ fontSize: '0.6rem' }}>
                      {L('comingSoon')}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
