const TAG = 'toalla21-21'

function amz(query: string) {
  return `https://www.amazon.es/s?k=${encodeURIComponent(query)}&tag=${TAG}`
}

interface AmazonBoxProps {
  characterName?: string
  category?: string
  locale?: string
}

type Link = { emoji: string; label: Record<string, string>; query: string }

function getLinks(characterName?: string, category?: string): Link[] {
  const charLinks: Link[] = characterName ? [
    {
      emoji: '🎭',
      label: {
        es: `Peluche de ${characterName}`,
        en: `${characterName} plush toy`,
        fr: `Peluche ${characterName}`,
        pt: `Pelúcia ${characterName}`,
      },
      query: `${characterName} peluche figura`,
    },
    {
      emoji: '🃏',
      label: {
        es: `Funko Pop ${characterName}`,
        en: `${characterName} Funko Pop`,
        fr: `Funko Pop ${characterName}`,
        pt: `Funko Pop ${characterName}`,
      },
      query: `funko pop ${characterName}`,
    },
  ] : []

  const mcLinks: Link[] = [
    {
      emoji: '🧱',
      label: {
        es: 'LEGO Minecraft',
        en: 'LEGO Minecraft',
        fr: 'LEGO Minecraft',
        pt: 'LEGO Minecraft',
      },
      query: 'lego minecraft',
    },
    {
      emoji: '🐸',
      label: {
        es: 'Peluches Minecraft',
        en: 'Minecraft plush toys',
        fr: 'Peluches Minecraft',
        pt: 'Pelúcias Minecraft',
      },
      query: 'minecraft peluche creeper',
    },
  ]

  const all = [...charLinks, ...mcLinks]
  return all.slice(0, 3)
}

const TITLE: Record<string, string> = {
  es: '🛒 Merch relacionado en Amazon',
  en: '🛒 Related merch on Amazon',
  fr: '🛒 Merch lié sur Amazon',
  pt: '🛒 Merch relacionado na Amazon',
}
const DISCLAIMER: Record<string, string> = {
  es: 'Enlace de afiliado · sin coste extra para ti',
  en: 'Affiliate link · no extra cost to you',
  fr: 'Lien affilié · sans frais supplémentaires',
  pt: 'Link de afiliado · sem custo extra para ti',
}

export default function AmazonBox({ characterName, category, locale = 'es' }: AmazonBoxProps) {
  const links = getLinks(characterName, category)

  return (
    <div className="rounded-2xl p-5 mb-8"
      style={{ background: '#fffbeb', border: '2px solid #fde68a' }}>
      <p className="font-bold text-sm mb-3" style={{ color: '#92400e' }}>
        {TITLE[locale] ?? TITLE.es}
      </p>
      <div className="flex flex-col gap-2">
        {links.map((link, i) => (
          <a
            key={i}
            href={amz(link.query)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-center gap-2 text-sm font-semibold hover:underline"
            style={{ color: '#b45309' }}
          >
            <span>{link.emoji}</span>
            <span>{link.label[locale] ?? link.label.es}</span>
            <span className="opacity-40 text-xs ml-auto">→ Amazon</span>
          </a>
        ))}
      </div>
      <p className="text-xs mt-3 opacity-40" style={{ color: '#92400e' }}>
        {DISCLAIMER[locale] ?? DISCLAIMER.es}
      </p>
    </div>
  )
}
