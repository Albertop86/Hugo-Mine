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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 1000 },
      }),
    }
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`)
  }
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`No JSON for ${locale}: ${text.slice(0, 100)}`)
  return JSON.parse(match[0])
}

export async function GET(req: Request) {
  const reqUrl = new URL(req.url)
  if (reqUrl.searchParams.get('key') !== 'ms-prefill-2026' &&
      req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })
  }

  const featuredIdx  = await storageGetJson<{ slug: string }[]>('characters/index.json', [])
  const featuredSlugs = new Set(featuredIdx.map(e => e.slug))

  const forceAll = reqUrl.searchParams.get('all') === '1'
  const limit    = parseInt(reqUrl.searchParams.get('limit') ?? '12', 10)
  const targets  = CHARACTERS.filter(c => forceAll || !featuredSlugs.has(c.slug))

  const results: { slug: string; ok: boolean; error?: string }[] = []
  let processed = 0

  for (const char of targets) {
    if (processed >= limit) break
    if (!forceAll && await storageExists(`characters/standalone/${char.slug}.json`)) {
      results.push({ slug: char.slug, ok: true })
      continue
    }
    processed++

    const content: Record<string, unknown> = {
      slug: char.slug,
      date: '',
      character: char,
      skinUrl: char.skinFile ? `/skins/premade/${char.skinFile}.png` : '',
    }

    let localeOk = 0
    let firstError = ''
    for (const locale of LOCALES) {
      try {
        content[locale] = await generateContent(char, locale)
        localeOk++
        await new Promise(r => setTimeout(r, 2500))
      } catch (e) {
        if (!firstError) firstError = String(e)
        console.error(`[prefill] ${char.slug}/${locale}:`, e)
      }
    }
    await new Promise(r => setTimeout(r, 3000))

    if (localeOk > 0) {
      try {
        await storagePut(`characters/standalone/${char.slug}.json`, JSON.stringify(content))
        results.push({ slug: char.slug, ok: true })
      } catch (e) {
        results.push({ slug: char.slug, ok: false, error: firstError || String(e) })
      }
    } else {
      results.push({ slug: char.slug, ok: false, error: firstError || 'all locales failed' })
    }
  }

  return NextResponse.json({
    processed: results.length,
    ok:        results.filter(r => r.ok).length,
    failed:    results.filter(r => !r.ok).length,
    failures:  results.filter(r => !r.ok),
  })
}
