import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { storagePut, storageGetJson } from '@/lib/storage'
import { getCharacterOfTheDay, type Character } from '@/lib/characterOfTheDay'
import { getSkinUrl } from '@/lib/getSkinUrl'
import { postPin } from '@/lib/pinterest'

const LOCALES = ['es', 'en', 'fr', 'pt'] as const
const LOCALE_INST: Record<string, string> = {
  es: 'Español de España, tono cercano y entusiasta.',
  en: 'English, friendly and enthusiastic tone.',
  fr: 'Français, ton accessible et enthousiaste.',
  pt: 'Português de Portugal, tom acessível e entusiasta.',
}

async function generateCharacterContent(character: Character, locale: string) {
  const name = locale === 'es' ? character.nameEs : character.nameEn

  const prompt = `Eres experto en Minecraft y cultura pop. ${LOCALE_INST[locale]}

Escribe contenido para la sección "Skin del Día" de makeskins.com sobre el personaje: ${name} (${character.category})

Responde SOLO con JSON válido sin markdown:
{
  "title": "Skin de ${name} para Minecraft — título atractivo (max 60 chars)",
  "description": "Descripción corta del personaje y su skin (120-160 chars)",
  "metaTitle": "Meta title SEO con keyword 'skin minecraft ${name}' (55-60 chars)",
  "metaDesc": "Meta description con CTA (145-160 chars)",
  "intro": "Párrafo de introducción sobre ${name} y por qué mola tenerlo en Minecraft (60-80 palabras)",
  "lore": "Historia/origen del personaje en 60-80 palabras, amigable para fans de Minecraft",
  "howToUse": "Instrucciones breves de cómo usar/descargar la skin (40-60 palabras)",
  "funFact": "Un dato curioso o meme sobre ${name} relacionado con Minecraft (20-30 palabras)"
}`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 1000 },
      }),
    }
  )
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`Sin JSON para ${locale}`)
  return JSON.parse(match[0])
}

interface CharSkinEntry {
  slug:     string
  nameEs:   string
  nameEn:   string
  emoji:    string
  category: string
  date:     string
  skinUrl:  string
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ skipped: true, reason: 'GEMINI_API_KEY not configured' })
  }

  try {
    const today     = new Date()
    const dateStr   = today.toISOString().slice(0, 10)
    const character = getCharacterOfTheDay(today)

    let skinUrl = ''
    try {
      skinUrl = (await getSkinUrl(character)) ?? ''
    } catch (e) {
      console.error('[character-of-day] Skin error:', e)
    }

    const content: Record<string, unknown> = { slug: character.slug, date: dateStr, character, skinUrl }

    for (const locale of LOCALES) {
      try {
        content[locale] = await generateCharacterContent(character, locale)
        await new Promise(r => setTimeout(r, 2000))
      } catch (e) {
        console.error(`[character-of-day] Error ${locale}:`, e)
      }
    }

    type IndexEntry = { date: string; slug: string; nameEn: string; nameEs: string; emoji: string; category: string }
    const indexEntries = await storageGetJson<IndexEntry[]>('characters/index.json', [])

    const todayEntry: IndexEntry = {
      date: dateStr, slug: character.slug, nameEn: character.nameEn,
      nameEs: character.nameEs, emoji: character.emoji, category: character.category,
    }
    const existingIdx = indexEntries.findIndex(e => e.date === dateStr)
    if (existingIdx >= 0) indexEntries[existingIdx] = todayEntry
    else indexEntries.push(todayEntry)
    indexEntries.sort((a, b) => b.date.localeCompare(a.date))

    const charSkins = await storageGetJson<CharSkinEntry[]>('skins/v2/characters/index.json', [])

    if (skinUrl) {
      const skinEntry: CharSkinEntry = {
        slug: character.slug, nameEs: character.nameEs, nameEn: character.nameEn,
        emoji: character.emoji, category: character.category, date: dateStr, skinUrl,
      }
      const existingCharIdx = charSkins.findIndex(e => e.slug === character.slug)
      if (existingCharIdx >= 0) charSkins[existingCharIdx] = skinEntry
      else charSkins.push(skinEntry)
      charSkins.sort((a, b) => b.date.localeCompare(a.date))
    }

    try {
      await Promise.all([
        storagePut(`characters/${dateStr}.json`, JSON.stringify(content)),
        storagePut('characters/today.json', JSON.stringify(content)),
        storagePut('characters/index.json', JSON.stringify(indexEntries)),
        ...(skinUrl ? [storagePut('skins/v2/characters/index.json', JSON.stringify(charSkins))] : []),
      ])
    } catch (storageErr) {
      console.error('[character-of-day] Storage write failed:', storageErr)
    }

    for (const locale of ['es', 'en', 'fr', 'pt']) {
      revalidatePath(`/${locale}/skin-del-dia`, 'page')
      revalidatePath(`/${locale}/skins/${character.slug}`, 'page')
      revalidatePath(`/${locale}/gallery`, 'page')
    }

    // Publicar en Pinterest si tenemos skin y contenido en español
    let pinterestPinId: string | null = null
    const esContent = content.es as { title?: string; description?: string } | undefined
    if (skinUrl && esContent?.title && process.env.PINTEREST_ACCESS_TOKEN) {
      try {
        pinterestPinId = await postPin({
          title:       esContent.title,
          description: `${esContent.description ?? ''} Descarga gratis en makeskins.com`,
          imageUrl:    skinUrl.startsWith('http') ? skinUrl : `https://makeskins.com${skinUrl}`,
          link:        `https://makeskins.com/es/skins/${character.slug}`,
        })
        console.log(`[character-of-day] Pinterest pin created: ${pinterestPinId}`)
      } catch (pinErr) {
        console.error('[character-of-day] Pinterest error:', pinErr)
      }
    }

    return NextResponse.json({
      ok:             true,
      date:           dateStr,
      character:      character.slug,
      skinUrl,
      names:          { es: character.nameEs, en: character.nameEn },
      pinterestPinId,
    })
  } catch (err) {
    console.error('[character-of-day]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
