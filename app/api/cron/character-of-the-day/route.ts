import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { put } from '@vercel/blob'
import { getCharacterOfTheDay, type Character } from '@/lib/characterOfTheDay'
import { makeCharacterSkin, getPalette, getExtras } from '@/lib/characterSkinGenerator'

const LOCALES = ['es', 'en', 'fr', 'pt'] as const
const LOCALE_INST: Record<string, string> = {
  es: 'Español de España, tono cercano y entusiasta.',
  en: 'English, friendly and enthusiastic tone.',
  fr: 'Français, ton accessible et enthousiaste.',
  pt: 'Português de Portugal, tom acessível e entusiasta.',
}

const BLOB_BASE = 'https://qpjyakz4casdsvlz.public.blob.vercel-storage.com'

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
  slug:    string
  nameEs:  string
  nameEn:  string
  emoji:   string
  category: string
  date:    string
  skinUrl: string
}

async function generateAndStoreSkin(character: Character): Promise<string> {
  if (character.skinFile) {
    return `/skins/premade/${character.skinFile}.png`
  }
  const palette    = getPalette(character.slug, character.category)
  const pngBuffer  = makeCharacterSkin(palette, getExtras(character.slug))
  const blobResult = await put(`skins/characters/${character.slug}.png`, pngBuffer, {
    access: 'public', contentType: 'image/png', addRandomSuffix: false, allowOverwrite: true,
  })
  return blobResult.url
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

    // Generate (or locate) the skin PNG for this character
    let skinUrl = ''
    try {
      skinUrl = await generateAndStoreSkin(character)
    } catch (e) {
      console.error('[character-of-day] Skin error:', e)
    }

    const content: Record<string, unknown> = { slug: character.slug, date: dateStr, character, skinUrl }

    for (const locale of LOCALES) {
      try {
        content[locale] = await generateCharacterContent(character, locale)
        await new Promise(r => setTimeout(r, 2000)) // rate limit
      } catch (e) {
        console.error(`[character-of-day] Error ${locale}:`, e)
      }
    }

    // Mantener índice histórico de personajes del día
    let indexEntries: { date: string; slug: string; nameEn: string; nameEs: string; emoji: string; category: string }[] = []
    try {
      const idxRes = await fetch(`${BLOB_BASE}/characters/index.json`, { cache: 'no-store' })
      if (idxRes.ok) indexEntries = await idxRes.json()
    } catch {}

    const todayEntry = { date: dateStr, slug: character.slug, nameEn: character.nameEn, nameEs: character.nameEs, emoji: character.emoji, category: character.category }
    const existingIdx = indexEntries.findIndex(e => e.date === dateStr)
    if (existingIdx >= 0) indexEntries[existingIdx] = todayEntry
    else indexEntries.push(todayEntry)
    indexEntries.sort((a, b) => b.date.localeCompare(a.date))

    // Mantener índice de skins de personajes para la galería
    let charSkins: CharSkinEntry[] = []
    try {
      const r = await fetch(`${BLOB_BASE}/skins/characters/index.json`, { cache: 'no-store' })
      if (r.ok) charSkins = await r.json()
    } catch {}

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

    await Promise.all([
      put(`characters/${dateStr}.json`, JSON.stringify(content), {
        access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
      }),
      put('characters/today.json', JSON.stringify(content), {
        access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
      }),
      put('characters/index.json', JSON.stringify(indexEntries), {
        access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
      }),
      ...(skinUrl ? [put('skins/characters/index.json', JSON.stringify(charSkins), {
        access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
      })] : []),
    ])

    for (const locale of ['es', 'en', 'fr', 'pt']) {
      revalidatePath(`/${locale}/skin-del-dia`, 'page')
      revalidatePath(`/${locale}/skins/${character.slug}`, 'page')
      revalidatePath(`/${locale}/gallery`, 'page')
    }

    return NextResponse.json({
      ok:        true,
      date:      dateStr,
      character: character.slug,
      skinUrl,
      names:     { es: character.nameEs, en: character.nameEn },
    })
  } catch (err) {
    console.error('[character-of-day]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
