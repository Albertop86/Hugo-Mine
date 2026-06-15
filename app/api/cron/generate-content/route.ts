import { NextResponse } from 'next/server'
import { getGSCToken, querySearchConsole } from '@/lib/gsc'
import { generateBlogPost, type KeywordOpportunity } from '@/lib/contentGenerator'
import { savePost, listSlugs } from '@/lib/blogStore'

const SITE = 'https://makeskins.com/'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ skipped: true, reason: 'GEMINI_API_KEY not configured' })
  }

  try {
    const token = await getGSCToken()

    // Keywords de oportunidad de Search Console (pos 5-30, mínimo 5 impresiones)
    const rows = await querySearchConsole(token, SITE, {
      startDate:  new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10),
      endDate:    new Date().toISOString().slice(0, 10),
      dimensions: ['query'],
      rowLimit:   100,
      orderBy:    [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }],
    })

    const existingSlugs = await listSlugs()

    const opportunities: KeywordOpportunity[] = rows
      .filter(r => r.position >= 5 && r.position <= 30 && r.impressions >= 5 && r.keys[0].length > 8)
      .map(r => ({ query: r.keys[0], position: r.position, impressions: r.impressions, clicks: r.clicks }))

    // Temas de fallback si GSC no tiene datos todavía
    const fallback: KeywordOpportunity[] = [
      { query: 'como hacer una skin de minecraft personalizada desde una foto', position: 15, impressions: 50, clicks: 2 },
      { query: 'mejores skins de minecraft para chicas 2025',                  position: 12, impressions: 80, clicks: 5 },
      { query: 'skins de minecraft de anime gratis',                           position: 20, impressions: 40, clicks: 1 },
      { query: 'como poner skin en minecraft sin cuenta premium',               position: 18, impressions: 60, clicks: 3 },
      { query: 'skins de minecraft de superheroes marvel',                      position: 14, impressions: 70, clicks: 4 },
      { query: 'skin minecraft creeper humanizado',                             position: 22, impressions: 30, clicks: 1 },
      { query: 'como cambiar skin minecraft movil android ios',                 position: 16, impressions: 45, clicks: 2 },
      { query: 'mejores skins minecraft aesthetic 2025',                        position: 19, impressions: 55, clicks: 3 },
    ]

    const pool = opportunities.length > 0 ? opportunities : fallback

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
      titles:   { es: post.locales.es?.title, en: post.locales.en?.title },
    })
  } catch (err) {
    console.error('[generate-content]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
