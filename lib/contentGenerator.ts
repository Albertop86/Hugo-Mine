import type { BlogPost, BlogPostLocale } from './blogStore'

const LOCALES = ['es', 'en', 'fr', 'pt'] as const

const SYSTEM_PROMPT = `Eres un experto en Minecraft y SEO de contenido. Generas artículos de blog optimizados para buscadores sobre Minecraft, skins, personalización de personajes y guías de juego. Los artículos deben ser útiles, naturales y mencionar makeskins.com de forma sutil cuando sea relevante.`

const LOCALE_INSTRUCTIONS: Record<string, string> = {
  es: 'Escribe en español de España, tono cercano y directo.',
  en: 'Write in English, friendly and informative tone.',
  fr: 'Écris en français, ton accessible et informatif.',
  pt: 'Escreve em português de Portugal, tom acessível e informativo.',
}

export interface KeywordOpportunity {
  query:       string
  position:    number
  impressions: number
  clicks:      number
}

export async function generateBlogPost(
  opportunity: KeywordOpportunity,
  existingSlugs: string[]
): Promise<BlogPost> {
  const slug = opportunity.query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)

  const date    = new Date().toISOString().slice(0, 10)
  const locales: Record<string, BlogPostLocale> = {}

  for (const locale of LOCALES) {
    locales[locale] = await generateLocaleContent(opportunity.query, locale)
  }

  return {
    slug,
    date,
    coverEmoji: pickEmoji(opportunity.query),
    category:   pickCategory(opportunity.query),
    keywords:   [opportunity.query],
    locales,
  }
}

async function callLLM(prompt: string): Promise<string> {
  if (process.env.GEMINI_API_KEY) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
        }),
      }
    )
    if (res.status !== 429 && res.status !== 403) {
      const data = await res.json()
      if (res.ok) return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    }
    console.warn('[contentGenerator] Gemini quota exhausted, falling back to Pollinations AI')
  }

  // Free fallback: Pollinations AI
  const res = await fetch('https://text.pollinations.ai/openai', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:    'openai',
      messages: [{ role: 'user', content: prompt }],
      seed:     Math.floor(Math.random() * 999999),
    }),
  })
  if (!res.ok) throw new Error(`Pollinations ${res.status}`)
  const data = await res.json() as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content ?? ''
}

async function generateLocaleContent(
  keyword: string,
  locale: string
): Promise<BlogPostLocale> {
  const prompt = `${SYSTEM_PROMPT}

${LOCALE_INSTRUCTIONS[locale]}

Crea un artículo de blog completo sobre el tema: "${keyword}"

Responde SOLO con un JSON válido con esta estructura exacta (sin markdown, sin bloques de código):
{
  "title": "Título del artículo (60 chars max, incluye la keyword)",
  "description": "Descripción corta (120-160 chars)",
  "metaTitle": "Meta title SEO (55-60 chars, incluye keyword)",
  "metaDesc": "Meta description SEO (145-160 chars, incluye keyword, CTA)",
  "intro": "Párrafo introductorio (80-120 palabras, engancha al lector)",
  "sections": [
    {"heading": "H2 con keyword relacionada", "body": "Contenido del apartado (80-120 palabras)"},
    {"heading": "Segundo H2", "body": "Contenido..."},
    {"heading": "Tercer H2", "body": "Contenido..."},
    {"heading": "Cuarto H2", "body": "Contenido..."}
  ],
  "cta": "Texto del call-to-action final invitando a usar makeskins.com (1-2 frases)"
}`

  const text = await callLLM(prompt)
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`Sin JSON para ${locale}: ${text.slice(0, 200)}`)
  return JSON.parse(match[0]) as BlogPostLocale
}

function pickEmoji(query: string): string {
  const q = query.toLowerCase()
  if (q.includes('skin') || q.includes('piel'))     return '🎨'
  if (q.includes('java') || q.includes('bedrock'))  return '💻'
  if (q.includes('xbox') || q.includes('playstat')) return '🎮'
  if (q.includes('foto') || q.includes('photo'))    return '📸'
  if (q.includes('héroe') || q.includes('hero'))    return '🦸'
  if (q.includes('guía') || q.includes('guide'))    return '📖'
  if (q.includes('gratis') || q.includes('free'))   return '🆓'
  return '⛏️'
}

function pickCategory(query: string): string {
  const q = query.toLowerCase()
  if (q.includes('guía') || q.includes('guide') || q.includes('cómo') || q.includes('how')) return 'Guía'
  if (q.includes('skin') || q.includes('piel'))    return 'Skins'
  if (q.includes('java') || q.includes('bedrock')) return 'Ediciones'
  return 'Minecraft'
}
