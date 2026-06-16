import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import SkinDisplay from '@/components/SkinDisplay'
import AmazonBox from '@/components/AmazonBox'
import { getCharacterOfTheDay } from '@/lib/characterOfTheDay'
import { getSkinUrl } from '@/lib/getSkinUrl'

export const revalidate = 3600

const BLOB_BASE = 'https://qpjyakz4casdsvlz.public.blob.vercel-storage.com'

async function getTodayCharacter() {
  try {
    const res = await fetch(`${BLOB_BASE}/characters/today.json`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

const META: Record<string, { title: string; desc: string }> = {
  es: { title: 'Skin del Día — MakeSkins', desc: 'Descarga gratis la skin de Minecraft del día. Cada día un personaje diferente: superhéroes, anime, videojuegos y más.' },
  en: { title: 'Skin of the Day — MakeSkins', desc: 'Free daily Minecraft skin download. A new character every day: superheroes, anime, video games and more.' },
  fr: { title: 'Skin du Jour — MakeSkins', desc: 'Téléchargez gratuitement le skin Minecraft du jour. Un nouveau personnage chaque jour.' },
  pt: { title: 'Skin do Dia — MakeSkins', desc: 'Download gratuito da skin Minecraft do dia. Um personagem diferente todos os dias.' },
}

const LABELS: Record<string, Record<string, string>> = {
  download:   { es: 'Descargar skin gratis', en: 'Download free skin', fr: 'Télécharger skin gratuit', pt: 'Baixar skin grátis' },
  create:     { es: '¿Prefieres hacer tu propia skin?', en: 'Want to make your own skin?', fr: 'Créer ton propre skin ?', pt: 'Quer criar seu próprio skin?' },
  createBtn:  { es: 'Crear desde foto', en: 'Create from photo', fr: 'Créer depuis une photo', pt: 'Criar de foto' },
  tomorrow:   { es: 'Vuelve mañana para el siguiente personaje', en: 'Come back tomorrow for the next character', fr: 'Reviens demain pour le prochain personnage', pt: 'Volte amanhã para o próximo personagem' },
  category:   { es: 'Categoría', en: 'Category', fr: 'Catégorie', pt: 'Categoria' },
  loading:    { es: 'Preparando el personaje de hoy...', en: 'Preparing today\'s character...', fr: 'Préparation du personnage du jour...', pt: 'Preparando o personagem de hoje...' },
  lore:       { es: 'Historia', en: 'Background', fr: 'Histoire', pt: 'História' },
  howToUse:   { es: 'Cómo usar esta skin', en: 'How to use this skin', fr: 'Comment utiliser ce skin', pt: 'Como usar este skin' },
  funFact:    { es: '¿Sabías que...', en: 'Did you know...', fr: 'Le saviez-vous...', pt: 'Você sabia...' },
  archive:    { es: 'Ver todos los personajes →', en: 'See all characters →', fr: 'Voir tous les personnages →', pt: 'Ver todos os personagens →' },
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const m = META[locale] ?? META.en
  return { title: m.title, description: m.desc }
}

export default async function SkinDelDiaPage() {
  const locale   = await getLocale()
  const L        = (key: string) => LABELS[key]?.[locale] ?? LABELS[key]?.en ?? key
  const todayStr = new Date().toISOString().slice(0, 10)

  // Try blob data; fall back to local rotation if missing or stale
  const data         = await getTodayCharacter()
  const blobIsFresh  = data?.date === todayStr
  const localChar    = getCharacterOfTheDay(new Date())

  const char    = blobIsFresh ? data.character : localChar
  const content = blobIsFresh ? (data?.[locale as string] ?? data?.es) : null
  const name    = locale === 'es' ? char.nameEs : char.nameEn

  // Resolve skin — use blob data if fresh, else generate on demand
  const skinUrl = (blobIsFresh && data?.skinUrl) ? data.skinUrl : await getSkinUrl(char)

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
          style={{ background: 'var(--color-green-mine)', color: 'white' }}>
          📅 {todayStr}
        </div>
        <div className="text-8xl mb-4">{char.emoji}</div>
        <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--color-earth)', fontFamily: 'var(--font-pixel)', fontSize: '1.2rem', lineHeight: 2 }}>
          {content?.title ?? (locale === 'es' ? `Skin de ${name} para Minecraft` : `${name} Minecraft Skin`)}
        </h1>
        <p className="opacity-60 text-base">
          {content?.description ?? (locale === 'es'
            ? `Descarga gratis la skin de ${name} para Minecraft Java y Bedrock.`
            : `Download the free ${name} skin for Minecraft Java and Bedrock.`)}
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
          />
        ) : (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--color-cream)', border: '2px solid var(--color-cream-dark)' }}>
            <div className="text-5xl mb-3">{char.emoji}</div>
            <p className="font-bold" style={{ color: 'var(--color-earth)' }}>{name}</p>
          </div>
        )}
      </div>

      {/* Amazon affiliate */}
      <AmazonBox characterName={name} category={char.category} locale={locale} />

      {/* Intro */}
      {content?.intro && (
        <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--color-earth)' }}>
          {content.intro}
        </p>
      )}

      {/* Lore */}
      {content?.lore && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--color-cream)', border: '2px solid var(--color-cream-dark)' }}>
          <h2 className="font-bold text-base mb-3" style={{ color: 'var(--color-green-mine)' }}>📖 {L('lore')}</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-earth)' }}>{content.lore}</p>
        </div>
      )}

      {/* How to use */}
      {content?.howToUse && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--color-cream)', border: '2px solid var(--color-cream-dark)' }}>
          <h2 className="font-bold text-base mb-3" style={{ color: 'var(--color-green-mine)' }}>🎮 {L('howToUse')}</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-earth)' }}>{content.howToUse}</p>
        </div>
      )}

      {/* Fun fact */}
      {content?.funFact && (
        <div className="rounded-2xl p-4 mb-8" style={{ background: '#fef9c3', border: '2px solid #fde68a' }}>
          <p className="text-sm" style={{ color: '#92400e' }}><strong>{L('funFact')}</strong> {content.funFact}</p>
        </div>
      )}

      {/* Create own skin */}
      <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--color-cream-dark)' }}>
        <p className="font-bold mb-3" style={{ color: 'var(--color-earth)' }}>{L('create')}</p>
        <Link href={`/${locale}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:opacity-90"
          style={{ background: 'var(--color-green-mine)', color: 'white' }}>
          📸 {L('createBtn')}
        </Link>
      </div>

      {/* Tomorrow teaser */}
      <p className="text-center text-sm opacity-40 mt-8" style={{ color: 'var(--color-earth)' }}>
        🔄 {L('tomorrow')}
      </p>

      {/* Archive link */}
      <div className="text-center mt-4">
        <Link href={`/${locale}/skins`}
          className="text-sm font-bold hover:underline"
          style={{ color: 'var(--color-green-mine)', textDecoration: 'none' }}>
          {L('archive')}
        </Link>
      </div>
    </div>
  )
}
