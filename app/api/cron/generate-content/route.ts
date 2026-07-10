import { NextResponse } from 'next/server'
import { getGSCToken, querySearchConsole } from '@/lib/gsc'
import { generateBlogPost, type KeywordOpportunity } from '@/lib/contentGenerator'
import { savePost, listSlugs } from '@/lib/blogStore'

const SITE = 'https://makeskins.com/'

const FALLBACK_KEYWORDS: KeywordOpportunity[] = [
  { query: 'como hacer una skin de minecraft personalizada desde una foto', position: 15, impressions: 50, clicks: 2 },
  { query: 'mejores skins de minecraft para chicas 2025',                  position: 12, impressions: 80, clicks: 5 },
  { query: 'skins de minecraft de anime gratis',                           position: 20, impressions: 40, clicks: 1 },
  { query: 'como poner skin en minecraft sin cuenta premium',               position: 18, impressions: 60, clicks: 3 },
  { query: 'skins de minecraft de superheroes marvel',                      position: 14, impressions: 70, clicks: 4 },
  { query: 'skin minecraft creeper humanizado',                             position: 22, impressions: 30, clicks: 1 },
  { query: 'como cambiar skin minecraft movil android ios',                 position: 16, impressions: 45, clicks: 2 },
  { query: 'mejores skins minecraft aesthetic 2025',                        position: 19, impressions: 55, clicks: 3 },
  { query: 'skin minecraft naruto shippuden descarga gratis',               position: 17, impressions: 65, clicks: 4 },
  { query: 'como instalar skins minecraft java edition',                    position: 13, impressions: 90, clicks: 6 },
  { query: 'skins minecraft personajes populares youtube',                  position: 21, impressions: 35, clicks: 2 },
  { query: 'mejores skins minecraft halloween terror',                      position: 24, impressions: 28, clicks: 1 },
]

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ skipped: true, reason: 'GEMINI_API_KEY not configured' })
  }

  try {
    let opportunities: KeywordOpportunity[] = []
    let gscOk = false

    try {
      const token = await getGSCToken()
      const rows  = await querySearchConsole(token, SITE, {
        startDate:  new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10),
        endDate:    new Date().toISOString().slice(0, 10),
        dimensions: ['query'],
        rowLimit:   100,
        orderBy:    [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }],
      })
      opportunities = rows
        .filter(r => r.position >= 5 && r.position <= 30 && r.impressions >= 5 && r.keys[0].length > 8)
        .map(r => ({ query: r.keys[0], position: r.position, impressions: r.impressions, clicks: r.clicks }))
      gscOk = true
    } catch (gscErr) {
      console.warn('[generate-content] GSC unavailable, using fallback keywords:', String(gscErr))
    }

    const existingSlugs = await listSlugs()
    const pool = opportunities.length > 0 ? opportunities : FALLBACK_KEYWORDS

    const candidate = pool.find(op => {
      const slug = op.query.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60)
      return !existingSlugs.includes(slug)
    })

    if (!candidate) {
      return NextResponse.json({ skipped: true, reason: 'All opportunities already covered' })
    }

    const post = await generateBlogPost(candidate, existingSlugs)
    await savePost(post)

    return NextResponse.json({
      ok:       true,
      slug:     post.slug,
      keyword:  candidate.query,
      position: candidate.position,
      gscOk,
      titles:   { es: post.locales.es?.title, en: post.locales.en?.title },
    })
  } catch (err) {
    console.error('[generate-content]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
