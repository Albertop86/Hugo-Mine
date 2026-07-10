import { NextResponse } from 'next/server'
import { storagePut } from '@/lib/storage'
import { CHARACTERS } from '@/lib/characterOfTheDay'
import { buildCharacterSkin } from '@/lib/characterSkinGenerator'

export const maxDuration = 300

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const targets = CHARACTERS.filter(c => !c.skinFile)
  const results: { slug: string; ok: boolean; error?: string }[] = []

  for (const char of targets) {
    try {
      const buf = buildCharacterSkin(char.slug, char.category)
      await storagePut(`skins/v2/characters/${char.slug}.png`, buf)
      results.push({ slug: char.slug, ok: true })
    } catch (e) {
      results.push({ slug: char.slug, ok: false, error: String(e) })
    }
  }

  const ok    = results.filter(r => r.ok).length
  const fails = results.filter(r => !r.ok)
  return NextResponse.json({ regenerated: ok, failed: fails.length, failures: fails })
}
