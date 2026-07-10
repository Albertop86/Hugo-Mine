import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCharacterBySlug, getAllCharacterSlugs, CHARACTERS } from '@/lib/characterOfTheDay'
import { getSkinUrl } from '@/lib/getSkinUrl'
import { CHARACTER_FUN_FACTS } from '@/lib/characterFunFacts'
import { CHARACTER_DESCRIPTIONS } from '@/lib/characterDescriptions'
import { routing } from '@/lib/i18n/routing'
import SkinDisplay from '@/components/SkinDisplay'
import AmazonBox from '@/components/AmazonBox'

export const revalidate = 86400

const STORAGE_BASE = 'https://raw.githubusercontent.com/Albertop86/Hugo-Mine/data'

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
  try {
    const idxRes = await fetch(`${STORAGE_BASE}/characters/index.json`, { next: { revalidate: 3600 } })
    if (idxRes.ok) {
      const index: { date: string; slug: string }[] = await idxRes.json()
      const entry = index.find(e => e.slug === slug)
      if (entry) {
        const res = await fetch(`${STORAGE_BASE}/characters/${entry.date}.json`, { next: { revalidate: 86400 } })
        if (res.ok) return res.json()
      }
    }
  } catch {}
  // Fallback: standalone pre-generated content (not yet featured as skin del día)
  try {
    const res = await fetch(`${STORAGE_BASE}/characters/standalone/${slug}.json`, { next: { revalidate: 86400 } })
    if (res.ok) return res.json()
  } catch {}
  return null
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
      type:   'website',
      images: [`https://makeskins.com/${locale}/skins/${slug}/opengraph-image`],
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description: desc,
      images:      [`https://makeskins.com/${locale}/skins/${slug}/opengraph-image`],
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

  const staticFact = CHARACTER_FUN_FACTS[char.slug]?.[locale as 'es'|'en'|'fr'|'pt']
    ?? CHARACTER_FUN_FACTS[char.slug]?.en
  const funFact = content?.funFact ?? staticFact

  const staticDesc = CHARACTER_DESCRIPTIONS[char.slug]?.[locale as 'es'|'en'|'fr'|'pt']
    ?? CHARACTER_DESCRIPTIONS[char.slug]?.en
  const descriptionText = content?.description ?? staticDesc?.description
    ?? (locale === 'es' ? `Descarga gratis la skin de ${name} para Minecraft Java y Bedrock.`
      : locale === 'fr' ? `Téléchargez gratuitement le skin ${name} pour Minecraft.`
      : locale === 'pt' ? `Baixe gratuitamente o skin de ${name} para Minecraft.`
      : `Download the free ${name} skin for Minecraft Java and Bedrock.`)
  const introText = content?.intro ?? staticDesc?.intro

  // Resolve skin URL — generate if not yet in Blob
  const skinUrl = data?.skinUrl ?? await getSkinUrl(char)

  // Similar characters (same category)
  const similar = CHARACTERS.filter(c => c.category === char.category && c.slug !== char.slug).slice(0, 6)

  const faqItems = [
    {
      q: locale === 'es' ? `¿Cómo descargar la skin de ${name} para Minecraft?`
       : locale === 'fr' ? `Comment télécharger le skin ${name} pour Minecraft ?`
       : locale === 'pt' ? `Como baixar a skin do ${name} para Minecraft?`
       : `How to download the ${name} Minecraft skin?`,
      a: locale === 'es' ? `Entra en makeskins.com/es/skins/${slug}, haz clic en "Descargar skin gratis" y el archivo .png se descarga automáticamente. Compatible con Java y Bedrock.`
       : locale === 'fr' ? `Rendez-vous sur makeskins.com/fr/skins/${slug}, cliquez sur "Télécharger skin gratuit" et le fichier .png se télécharge automatiquement. Compatible Java et Bedrock.`
       : locale === 'pt' ? `Acesse makeskins.com/pt/skins/${slug}, clique em "Baixar skin grátis" e o arquivo .png é baixado automaticamente. Compatível com Java e Bedrock.`
       : `Visit makeskins.com/en/skins/${slug}, click "Download free skin" and the .png file downloads automatically. Compatible with Java and Bedrock.`,
    },
    {
      q: locale === 'es' ? `¿La skin de ${name} es gratis?`
       : locale === 'fr' ? `Le skin ${name} est-il gratuit ?`
       : locale === 'pt' ? `A skin do ${name} é gratuita?`
       : `Is the ${name} Minecraft skin free?`,
      a: locale === 'es' ? `Sí, todas las skins de makeskins.com son completamente gratuitas y no requieren registro.`
       : locale === 'fr' ? `Oui, tous les skins de makeskins.com sont entièrement gratuits et ne nécessitent pas d'inscription.`
       : locale === 'pt' ? `Sim, todas as skins do makeskins.com são completamente gratuitas e não requerem registro.`
       : `Yes, all skins on makeskins.com are completely free and require no registration.`,
    },
    {
      q: locale === 'es' ? `¿Funciona la skin de ${name} en Minecraft Java y Bedrock?`
       : locale === 'fr' ? `Le skin ${name} fonctionne-t-il sur Java et Bedrock ?`
       : locale === 'pt' ? `A skin do ${name} funciona no Java e Bedrock?`
       : `Does the ${name} skin work on Minecraft Java and Bedrock?`,
      a: locale === 'es' ? `Sí, el archivo .png descargado es compatible con Minecraft Java Edition y Bedrock Edition en todas las plataformas.`
       : locale === 'fr' ? `Oui, le fichier .png téléchargé est compatible avec Minecraft Java Edition et Bedrock Edition sur toutes les plateformes.`
       : locale === 'pt' ? `Sim, o arquivo .png é compatível com Minecraft Java Edition e Bedrock Edition em todas as plataformas.`
       : `Yes, the downloaded .png file is compatible with both Minecraft Java Edition and Bedrock Edition on all platforms.`,
    },
    ...(content?.howToUse ? [{
      q: locale === 'es' ? `¿Cómo poner la skin de ${name} en Minecraft?`
       : locale === 'fr' ? `Comment mettre le skin ${name} dans Minecraft ?`
       : locale === 'pt' ? `Como colocar a skin do ${name} no Minecraft?`
       : `How to apply the ${name} skin in Minecraft?`,
      a: content.howToUse,
    }] : []),
  ]

  const webPageLd = {
    '@context':  'https://schema.org',
    '@type':     'WebPage',
    name:        content?.metaTitle ?? `${name} Minecraft Skin`,
    description: content?.metaDesc,
    url:         `https://makeskins.com/${locale}/skins/${slug}`,
    image:       `https://makeskins.com/${locale}/skins/${slug}/opengraph-image`,
  }

  const faqLd = {
    '@context':  'https://schema.org',
    '@type':     'FAQPage',
    mainEntity:  faqItems.map(item => ({
      '@type':          'Question',
      name:             item.q,
      acceptedAnswer:   { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

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
            {descriptionText}
          </p>
        </div>

        {/* Skin preview + descarga */}
        <div className="mb-8">
          {skinUrl ? (
            <SkinDisplay
              skinUrl={skinUrl}
              name={name}
              downloadLabel={L('download')}
              downloadFilename={`${char.slug}-minecraft-skin.png`}
              bgColor={catColor}
            />
          ) : (
            <div className="rounded-2xl p-6 text-center" style={{ background: catColor }}>
              <p className="text-white font-bold text-lg mb-1">{name}</p>
              <p className="text-white text-sm opacity-80">{L('notFeatured')}</p>
            </div>
          )}
        </div>

        {/* Intro / static description fallback */}
        {introText ? (
          <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--color-earth)' }}>
            {introText}
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
        {funFact && (
          <div className="rounded-2xl p-4 mb-8" style={{ background: '#fef9c3', border: '2px solid #fde68a' }}>
            <p className="text-sm" style={{ color: '#92400e' }}>
              <strong>{L('funFact')}</strong> {funFact}
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
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
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
