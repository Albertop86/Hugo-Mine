import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { CHARACTERS } from '@/lib/characterOfTheDay'
import { makeCharacterSkin, getPalette, getExtras } from '@/lib/characterSkinGenerator'

export const maxDuration = 300

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only regenerate characters that use Blob (no premade skinFile)
  const targets = CHARACTERS.filter(c => !c.skinFile)
  const results: { slug: string; ok: boolean; error?: string }[] = []

  for (const char of targets) {
    try {
      const buf = makeCharacterSkin(getPalette(char.slug, char.category), getExtras(char.slug))
      await put(`skins/characters/${char.slug}.png`, buf, {
        access: 'public', contentType: 'image/png', addRandomSuffix: false, allowOverwrite: true,
      })
      results.push({ slug: char.slug, ok: true })
    } catch (e) {
      results.push({ slug: char.slug, ok: false, error: String(e) })
    }
  }

  const ok    = results.filter(r => r.ok).length
  const fails = results.filter(r => !r.ok)
  return NextResponse.json({ regenerated: ok, failed: fails.length, failures: fails })
}
