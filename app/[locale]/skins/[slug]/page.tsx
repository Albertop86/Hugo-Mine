import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCharacterBySlug, getAllCharacterSlugs, CHARACTERS } from '@/lib/characterOfTheDay'
import { routing } from '@/lib/i18n/routing'
import SkinDisplay from '@/components/SkinDisplay'
import AmazonBox from '@/components/AmazonBox'

export const revalidate = 86400

const BLOB_BASE = 'https://qpjyakz4casdsvlz.public.blob.vercel-storage.com'

type Props = { params: Promise<{ locale: string; slug: string }> }

type CharacterDayContent = {
  title: string; description: string; metaTitle: string; metaDesc: string
  intro: string; lore?: string; howToUse?: string; funFact?: string
}
type CharacterDayData = {
  slug: string; date: string; skinUrl?: string
  character: { slug: string; nameEs: string; nameEn: string; emoji: string; category: string }
  es?: CharacterDayContent; en?: CharacterDayContent; fr?: CharacterDayContent; pt?: CharacterDayContent
}

async function getCharacterData(slug: string): Promise<CharacterDayData | null> {
  // Search the index for when this character was featured
  try {
    const idxRes = await fetch(`${BLOB_BASE}/characters/index.json`, { next: { revalidate: 3600 } })
    if (!idxRes.ok) return null
    const index: { date: string; slug: string }[] = await idxRes.json()
    const entry = index.find(e => e.slug === slug)
    if (!entry) return null
    const res = await fetch(`${BLOB_BASE}/characters/${entry.date}.json`, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export async function generateStaticParams() {
  const paths: { locale: string; slug: string }[] = []
  for (const locale of routing.locales) {
    for (const slug of getAllCharacterSlugs()) {
      paths.push({ locale, slug })
    }
  }
  return paths
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const locale = await getLocale()
  const char = getCharacterBySlug(slug)
  if (!char) return {}

  const data = await getCharacterData(slug)
  const content = data?.[locale as keyof CharacterDayData] as CharacterDayContent | undefined
  const name = locale === 'es' ? char.nameEs : char.nameEn

  const title = content?.metaTitle
    ?? (locale === 'es' ? `Skin de ${name} para Minecraft — MakeSkins`
     : locale === 'fr' ? `Skin ${name} Minecraft — MakeSkins`
     : locale === 'pt' ? `Skin ${name} para Minecraft — MakeSkins`
     : `${name} Minecraft Skin — MakeSkins`)

  const desc = content?.metaDesc
    ?? (locale === 'es' ? `Descarga gratis la skin de ${name} para Minecraft. Personaliza tu personaje con el skin de ${name} en Java y Bedrock.`
     : locale === 'fr' ? `Téléchargez gratuitement le skin ${name} pour Minecraft. Personnalisez votre personnage.`
     : locale === 'pt' ? `Baixe gratuitamente o skin de ${name} para Minecraft. Personalize seu personagem.`
     : `Download the free ${name} Minecraft skin. Customize your character with the ${name} skin for Java and Bedrock.`)

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: 'website',
    },
    alternates: {
      canonical: `/${locale}/skins/${slug}`,
    },
  }
}

const LABELS: Record<string, Record<string, string>> = {
  back:       { es: '← Archivo de skins',     en: '← Skins archive',         fr: '← Archive des skins',   pt: '← Arquivo de skins' },
  download:   { es: 'Descargar skin gratis',   en: 'Download free skin',      fr: 'Télécharger skin gratuit', pt: 'Baixar skin grátis' },
  create:     { es: '¿Prefieres tu propia skin?', en: 'Want your own skin?',  fr: 'Tu veux ton propre skin?', pt: 'Quer sua própria skin?' },
  createBtn:  { es: 'Crear desde foto',        en: 'Create from photo',       fr: 'Créer depuis une photo', pt: 'Criar de foto' },
  category:   { es: 'Categoría',               en: 'Category',                fr: 'Catégorie',               pt: 'Categoria' },
  lore:       { es: 'Historia',                en: 'Background',              fr: 'Histoire',                pt: 'História' },
  howToUse:   { es: 'Cómo usar esta skin',     en: 'How to use this skin',    fr: 'Comment utiliser ce skin', pt: 'Como usar este skin' },
  funFact:    { es: '¿Sabías que...',           en: 'Did you know...',         fr: 'Le saviez-vous...',       pt: 'Você sabia...' },
  featuredOn: { es: 'Skin del día el',         en: 'Skin of the day on',      fr: 'Skin du jour le',        pt: 'Skin do dia em' },
  notFeatured:{ es: 'Skin disponible próximamente como skin del día',
                en: 'Skin coming soon as skin of the day',
                fr: 'Skin bientôt disponible comme skin du jour',
                pt: 'Skin em breve como skin do dia' },
  similar:    { es: 'Personajes similares',    en: 'Similar characters',      fr: 'Personnages similaires',  pt: 'Personagens similares' },
  skinDelDia: { es: 'Ver skin del día →',      en: 'See skin of the day →',   fr: 'Voir skin du jour →',    pt: 'Ver skin do dia →' },
}

const CATEGORY_COLORS: Record<string, string> = {
  Marvel:    '#e3342f', DC:        '#2563eb', Anime:     '#7c3aed',
  Gaming:    '#059669', Películas: '#d97706', Series:    '#db2777',
  YouTubers: '#dc2626', Memes:     '#f59e0b', Minecraft: '#16a34a',
}

export default async function SkinCharacterPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const char = getCharacterBySlug(slug)
  if (!char) notFound()

  const L    = (key: string) => LABELS[key]?.[locale] ?? LABELS[key]?.en ?? key
  const name = locale === 'es' ? char.nameEs : char.nameEn
  const data = await getCharacterData(slug)
  const content = (data?.[locale as keyof CharacterDayData] ?? data?.es) as CharacterDayContent | undefined
  const catColor = CATEGORY_COLORS[char.category] ?? 'var(--color-green-mine)'

  // Similar characters (same category)
  const similar = CHARACTERS.filter(c => c.category === char.category && c.slug !== char.slug).slice(0, 4)

  const jsonLd = {
    '@context':  'https://schema.org',
    '@type':     'WebPage',
    name:        content?.metaTitle ?? `${name} Minecraft Skin`,
    description: content?.metaDesc,
    url:         `https://makeskins.com/${locale}/skins/${slug}`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href={`/${locale}/skins`}
          className="text-sm font-semibold mb-6 inline-block opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--color-earth)', textDecoration: 'none' }}>
          {L('back')}
        </Link>

        {/* Header */}
        <div className="text-center mb-10 mt-4">
          {data?.date && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
              style={{ background: catColor, color: 'white' }}>
              📅 {L('featuredOn')} {data.date}
            </div>
          )}
          <div className="text-8xl mb-4">{char.emoji}</div>
          <h1 className="text-3xl font-extrabold mb-2"
            style={{ color: 'var(--color-earth)', fontFamily: 'var(--font-pixel)', fontSize: '1.2rem', lineHeight: 2 }}>
            {content?.title ?? (locale === 'es'
              ? `Skin de ${name} para Minecraft`
              : `${name} Minecraft Skin`)}
          </h1>
          <p className="opacity-60 text-base">
            {content?.description ?? (locale === 'es'
              ? `Descarga gratis la skin de ${name} para Minecraft Java y Bedrock.`
              : `Download the free ${name} skin for Minecraft Java and Bedrock.`)}
          </p>
        </div>

        {/* Skin preview + descarga */}
        <div className="mb-8">
          {(data?.skinUrl || char.skinFile) ? (
            <SkinDisplay
              skinUrl={data?.skinUrl ?? `/skins/premade/${char.skinFile}.png`}
              name={name}
              downloadLabel={L('download')}
              downloadFilename={`${char.slug}-minecraft-skin.png`}
              bgColor={catColor}
            />
          ) : (
            <div className="rounded-2xl p-6 text-center" style={{ background: catColor }}>
              <a href={`/${locale}/gallery`}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:opacity-90"
                style={{ background: 'white', color: catColor }}>
                ⬇️ {L('download')}
              </a>
              <p className="text-white text-xs mt-3 opacity-80">{L('category')}: {char.category}</p>
            </div>
          )}
        </div>

        {/* Intro / placeholder */}
        {content?.intro ? (
          <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--color-earth)' }}>
            {content.intro}
          </p>
        ) : (
          <div className="rounded-2xl p-4 mb-8 text-center"
            style={{ background: 'var(--color-cream)', border: '2px solid var(--color-cream-dark)' }}>
            <p className="text-sm opacity-60">{L('notFeatured')}</p>
            <Link href={`/${locale}/skin-del-dia`}
              className="inline-block mt-2 text-sm font-bold hover:underline"
              style={{ color: catColor }}>
              {L('skinDelDia')}
            </Link>
          </div>
        )}

        {/* Lore */}
        {content?.lore && (
          <div className="rounded-2xl p-6 mb-6"
            style={{ background: 'var(--color-cream)', border: '2px solid var(--color-cream-dark)' }}>
            <h2 className="font-bold text-base mb-3" style={{ color: catColor }}>
              📖 {L('lore')}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-earth)' }}>{content.lore}</p>
          </div>
        )}

        {/* How to use */}
        {content?.howToUse && (
          <div className="rounded-2xl p-6 mb-6"
            style={{ background: 'var(--color-cream)', border: '2px solid var(--color-cream-dark)' }}>
            <h2 className="font-bold text-base mb-3" style={{ color: catColor }}>
              🎮 {L('howToUse')}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-earth)' }}>{content.howToUse}</p>
          </div>
        )}

        {/* Fun fact */}
        {content?.funFact && (
          <div className="rounded-2xl p-4 mb-8" style={{ background: '#fef9c3', border: '2px solid #fde68a' }}>
            <p className="text-sm" style={{ color: '#92400e' }}>
              <strong>{L('funFact')}</strong> {content.funFact}
            </p>
          </div>
        )}

        {/* Create own skin */}
        <div className="rounded-2xl p-6 text-center mb-8" style={{ background: 'var(--color-cream-dark)' }}>
          <p className="font-bold mb-3" style={{ color: 'var(--color-earth)' }}>{L('create')}</p>
          <Link href={`/${locale}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:opacity-90"
            style={{ background: 'var(--color-green-mine)', color: 'white' }}>
            📸 {L('createBtn')}
          </Link>
        </div>

        {/* Amazon affiliate */}
        <AmazonBox characterName={name} category={char.category} locale={locale} />

        {/* Similar characters */}
        {similar.length > 0 && (
          <div className="pt-8" style={{ borderTop: '2px solid var(--color-cream-dark)' }}>
            <p className="text-sm font-bold mb-4 opacity-60" style={{ color: 'var(--color-earth)' }}>
              {L('similar')} — {char.category}
            </p>
            <div className="grid grid-cols-4 gap-3">
              {similar.map(s => (
                <Link key={s.slug} href={`/${locale}/skins/${s.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="rounded-xl p-3 text-center hover:shadow-md hover:-translate-y-0.5 transition-all"
                    style={{ background: 'var(--color-cream)', border: '2px solid var(--color-cream-dark)' }}>
                    <div className="text-2xl mb-1">{s.emoji}</div>
                    <div className="text-xs font-semibold truncate" style={{ color: 'var(--color-earth)' }}>
                      {locale === 'es' ? s.nameEs : s.nameEn}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
