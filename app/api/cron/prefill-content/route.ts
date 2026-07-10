import { NextResponse } from 'next/server'
import { storagePut, storageGetJson, storageExists } from '@/lib/storage'
import { CHARACTERS, type Character } from '@/lib/characterOfTheDay'

export const maxDuration = 300

const LOCALES = ['es', 'en', 'fr', 'pt'] as const
const LOCALE_INST: Record<string, string> = {
  es: 'Español de España, tono cercano y entusiasta.',
  en: 'English, friendly and enthusiastic tone.',
  fr: 'Français, ton accessible et enthousiaste.',
  pt: 'Português de Portugal, tom acessível e entusiasta.',
}
const BATCH = 4

async function generateContent(character: Character, locale: string) {
  const name = locale === 'es' ? character.nameEs : character.nameEn
  const prompt = `Eres experto en Minecraft y cultura pop. ${LOCALE_INST[locale]}

Escribe contenido para la página de skin del personaje: ${name} (${character.category}) en makeskins.com

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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 1000 },
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`No JSON for ${locale}`)
  return JSON.parse(match[0])
}

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ skipped: true, reason: 'GEMINI_API_KEY not set' })
  }

  const featuredIdx = await storageGetJson<{ slug: string }[]>('characters/index.json', [])
  const featuredSlugs = new Set(featuredIdx.map(e => e.slug))

  const targets = CHARACTERS.filter(c => !featuredSlugs.has(c.slug))
  const results: { slug: string; ok: boolean }[] = []
  let generated = 0

  for (const char of targets) {
    if (generated >= BATCH) break

    if (await storageExists(`characters/standalone/${char.slug}.json`)) continue

    generated++
    const content: Record<string, unknown> = {
      slug: char.slug, date: '', character: char,
      skinUrl: char.skinFile ? `/skins/premade/${char.skinFile}.png` : '',
    }
    let localeOk = 0
    for (const locale of LOCALES) {
      try {
        content[locale] = await generateContent(char, locale)
        localeOk++
        await new Promise(r => setTimeout(r, 3000))
      } catch (e) {
        console.error(`[prefill-cron] ${char.slug}/${locale}:`, e)
      }
    }

    if (localeOk > 0) {
      try {
        await storagePut(`characters/standalone/${char.slug}.json`, JSON.stringify(content))
        results.push({ slug: char.slug, ok: true })
      } catch { results.push({ slug: char.slug, ok: false }) }
    } else {
      results.push({ slug: char.slug, ok: false })
    }
    await new Promise(r => setTimeout(r, 4000))
  }

  return NextResponse.json({ generated, results, remaining: targets.length - generated })
}
