import { type Character } from './characterOfTheDay'
import { storagePut, storageUrl, storageExists } from './storage'

const SKIN_VERSION = 'v2'

// Returns a URL for the character's skin, generating and storing it if needed.
export async function getSkinUrl(char: Character): Promise<string | null> {
  if (char.skinFile) return `/skins/premade/${char.skinFile}.png`

  const path   = `skins/${SKIN_VERSION}/characters/${char.slug}.png`
  const cdnUrl = storageUrl(path)

  if (await storageExists(path)) return cdnUrl

  try {
    const { buildCharacterSkin } = await import('./characterSkinGenerator')
    const buf = buildCharacterSkin(char.slug, char.category)
    return await storagePut(path, buf)
  } catch (e) {
    console.error(`[getSkinUrl] ${char.slug}:`, e)
    return null
  }
}
