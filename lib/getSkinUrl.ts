import { type Character } from './characterOfTheDay'

const BLOB_BASE = 'https://qpjyakz4casdsvlz.public.blob.vercel-storage.com'

// Returns a URL for the character's skin, generating and storing it in Blob if needed.
// Safe to call from server components and API routes.
export async function getSkinUrl(char: Character): Promise<string | null> {
  if (char.skinFile) return `/skins/premade/${char.skinFile}.png`

  const cdnUrl = `${BLOB_BASE}/skins/characters/${char.slug}.png`

  // Fast path: already in Blob CDN
  try {
    const probe = await fetch(cdnUrl, { method: 'HEAD', cache: 'no-store' })
    if (probe.ok) return cdnUrl
  } catch {}

  // Generate and store — pure Node.js, no browser APIs
  try {
    const [{ buildCharacterSkin }, { put }] = await Promise.all([
      import('./characterSkinGenerator'),
      import('@vercel/blob'),
    ])
    const buf = buildCharacterSkin(char.slug, char.category)
    const { url } = await put(`skins/characters/${char.slug}.png`, buf, {
      access: 'public', contentType: 'image/png', addRandomSuffix: false, allowOverwrite: true,
    })
    return url
  } catch (e) {
    console.error(`[getSkinUrl] ${char.slug}:`, e)
    return null
  }
}
