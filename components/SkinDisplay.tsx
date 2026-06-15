'use client'

import CharacterPreview from './CharacterPreview'

interface Props {
  skinUrl:          string
  name:             string
  downloadLabel:    string
  downloadFilename?: string
  bgColor?:         string
}

export default function SkinDisplay({ skinUrl, name, downloadLabel, downloadFilename, bgColor = 'var(--color-green-mine)' }: Props) {
  const filename = downloadFilename ?? `${name.toLowerCase().replace(/\s+/g, '-')}-minecraft-skin.png`

  function download() {
    const a = document.createElement('a')
    a.href = skinUrl
    a.download = filename
    a.click()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-2xl p-6 flex items-center justify-center" style={{ background: '#3a4a5a', minHeight: 200 }}>
        <CharacterPreview skinUrl={skinUrl} />
      </div>
      <button
        onClick={download}
        className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:opacity-90 active:scale-95"
        style={{ background: bgColor, color: 'white' }}>
        ⬇️ {downloadLabel}
      </button>
    </div>
  )
}
