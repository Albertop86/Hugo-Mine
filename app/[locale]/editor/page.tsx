import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import SkinEditor from '@/components/SkinEditor'

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Editor' })
  return { title: t('metaTitle'), description: t('metaDesc') }
}

export default function EditorPage() {
  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        {/* ═══ AdSense banner — replace this block with your ad unit ═══ */}
        <div className="w-full rounded-2xl flex items-center justify-center"
          style={{ minHeight: 90, background: '#f5f5f5', border: '2px dashed #ddd' }}>
          <span className="text-xs opacity-30 text-earth select-none">Publicidad</span>
        </div>
        {/* ═══════════════════════════════════════════════════════════════ */}

        <div className="rounded-3xl p-6 shadow-xl"
          style={{ background: 'var(--color-cream)', border: '2px solid var(--color-cream-dark)' }}>
          <h1 className="font-extrabold text-earth mb-6 text-center"
            style={{ fontFamily: 'var(--font-pixel)', fontSize: '1.1rem', lineHeight: 2, color: 'var(--color-green-mine)' }}>
            🎨 Editor de skin
          </h1>
          <SkinEditor />
        </div>
      </div>
    </main>
  )
}
