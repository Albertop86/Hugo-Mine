'use client'

import { useState, useRef, useCallback } from 'react'
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { cropFaceCanvas, generateSkinFromCanvas } from '@/lib/skinGenerator'
import { DEFAULT_CLOTHING, type ClothingConfig } from '@/lib/clothingConfig'
import CharacterPreview from '@/components/CharacterPreview'
import CameraCapture from '@/components/CameraCapture'
import ClothingSelector from '@/components/ClothingSelector'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'

type Step = 'upload' | 'crop' | 'preview' | 'error'

const MAX_FILE_MB = 10

// ─────────────────────────────────────────────
// Quality analysis — run after gallery upload
// ─────────────────────────────────────────────
function analyzeImageBrightness(src: string): Promise<'dark' | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 32; canvas.height = 32
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, 32, 32)
      const { data } = ctx.getImageData(0, 0, 32, 32)
      let total = 0
      for (let i = 0; i < data.length; i += 4)
        total += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      resolve(total / (32 * 32) < 58 ? 'dark' : null)
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// ─────────────────────────────────────────────
// Photo tips
// ─────────────────────────────────────────────
function PhotoTips() {
  const t = useTranslations('Converter')
  const good = [
    { icon: '😊', text: t('tipsGood1') },
    { icon: '☀️', text: t('tipsGood2') },
    { icon: '🔍', text: t('tipsGood3') },
  ]
  const bad = [
    { icon: '🌙', text: t('tipsBad1') },
    { icon: '👤', text: t('tipsBad2') },
    { icon: '🧢', text: t('tipsBad3') },
  ]
  return (
    <div className="w-full grid grid-cols-2 gap-3">
      <div className="rounded-2xl p-4 flex flex-col gap-2"
        style={{ background: 'rgba(93,124,21,0.08)', border: '2px solid var(--color-green-grass)' }}>
        <p className="text-xs font-extrabold text-center mb-1" style={{ color: 'var(--color-green-mine)' }}>{t('tipsGoodLabel')}</p>
        {good.map((g, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-earth">
            <span className="text-base shrink-0 leading-none mt-0.5">{g.icon}</span>
            <span>{g.text}</span>
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-4 flex flex-col gap-2"
        style={{ background: 'rgba(180,60,60,0.06)', border: '2px solid #d9a0a0' }}>
        <p className="text-xs font-extrabold text-center mb-1" style={{ color: '#b04040' }}>{t('tipsBadLabel')}</p>
        {bad.map((b, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-earth">
            <span className="text-base shrink-0 leading-none mt-0.5">{b.icon}</span>
            <span>{b.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Upload step
// ─────────────────────────────────────────────
function UploadStep({ onFile }: { onFile: (f: File, skipCrop?: boolean) => void }) {
  const t = useTranslations('Converter')
  const [dragging, setDragging] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const galleryRef = useRef<HTMLInputElement>(null)

  function validate(file: File | undefined | null): boolean {
    if (!file) return false
    if (!file.type.startsWith('image/')) return false
    if (file.size > MAX_FILE_MB * 1024 * 1024) return false
    return true
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return
    if (validate(files[0])) onFile(files[0])
  }

  function handleCameraCapture(file: File, skipCrop: boolean) {
    setShowCamera(false)
    onFile(file, skipCrop)
  }

  return (
    <>
      {showCamera && (
        <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
      )}
      <div className="flex flex-col items-center gap-5">
        <h2 className="font-extrabold text-earth"
          style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', lineHeight: 2 }}>
          {t('uploadTitle')}
        </h2>
        <PhotoTips />
        <div className="w-full grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setShowCamera(true)}
            className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-md"
            style={{ background: 'var(--color-green-mine)' }}>
            <span className="text-3xl">📷</span>
            <span className="text-sm">{t('cameraBtn')}</span>
          </button>
          <button type="button" onClick={() => galleryRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl font-bold transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--color-cream-dark)', color: 'var(--color-earth)', border: '2px solid var(--color-brown-dirt)' }}>
            <span className="text-3xl">🖼️</span>
            <span className="text-sm">{t('uploadBtn')}</span>
          </button>
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => galleryRef.current?.click()}
          className="w-full cursor-pointer rounded-2xl flex items-center justify-center gap-3 py-4 px-6 transition-all duration-200"
          style={{
            border: `2px dashed ${dragging ? 'var(--color-green-grass)' : 'var(--color-brown-dirt)'}`,
            background: dragging ? 'rgba(93,124,21,0.06)' : 'transparent',
          }}>
          <span className="text-xl opacity-40">⬆</span>
          <p className="text-sm text-earth opacity-50">{t('uploadDrag')}</p>
        </div>
        <p className="text-xs opacity-40 text-earth">{t('uploadHint')}</p>
        <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp"
          className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>
    </>
  )
}

// ─────────────────────────────────────────────
// Crop step
// ─────────────────────────────────────────────
function CropStep({
  imageSrc, qualityWarning, onGenerate, onBack,
}: {
  imageSrc: string
  qualityWarning: 'dark' | null
  onGenerate: (imgEl: HTMLImageElement, crop: PixelCrop) => Promise<void>
  onBack: () => void
}) {
  const t = useTranslations('Converter')
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [isGenerating, setIsGenerating] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    const initial = centerCrop(makeAspectCrop({ unit: '%', width: 50 }, 1, width, height), width, height)
    setCrop(initial)
  }

  async function handleGenerate() {
    if (!completedCrop || !imgRef.current) return
    setIsGenerating(true)
    await onGenerate(imgRef.current, completedCrop)
    setIsGenerating(false)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="font-extrabold text-earth"
        style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', lineHeight: 2 }}>
        {t('cropTitle')}
      </h2>
      {qualityWarning === 'dark' && (
        <div className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold"
          style={{ background: 'rgba(255,200,0,0.15)', border: '2px solid rgba(220,170,0,0.6)', color: '#9a6f00' }}>
          <span className="text-xl shrink-0">⚠️</span>
          <span>{t('qualityDark')}</span>
        </div>
      )}
      <div className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm"
        style={{ background: 'rgba(93,124,21,0.10)', border: '1.5px solid var(--color-green-grass)' }}>
        <span className="text-xl shrink-0">🎯</span>
        <p className="font-semibold text-earth text-sm">{t('cropGuide')}</p>
      </div>
      <div className="relative rounded-2xl overflow-hidden shadow-lg w-full">
        <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)}
          aspect={1} circularCrop={false} keepSelection>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={imageSrc} alt="Foto a recortar" onLoad={onImageLoad}
            style={{ maxHeight: '55vh', maxWidth: '100%', display: 'block' }} />
        </ReactCrop>
      </div>
      <div className="flex gap-4 text-xs text-earth-soft justify-center">
        <span>😊 {t('cropFaceHint1')}</span><span>·</span>
        <span>🔍 {t('cropFaceHint2')}</span><span>·</span>
        <span>☀️ {t('cropFaceHint3')}</span>
      </div>
      <div className="flex gap-4 w-full">
        <button onClick={onBack} className="flex-1 py-3 rounded-2xl font-bold transition-all"
          style={{ background: 'var(--color-cream-dark)', color: 'var(--color-earth)' }}>
          {t('cropBack')}
        </button>
        <button onClick={handleGenerate} disabled={!completedCrop || isGenerating}
          className="flex-[2] py-4 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 shadow-md"
          style={{ background: 'var(--color-green-mine)' }}>
          {isGenerating ? `⏳ ${t('generating')}` : `✨ ${t('cropBtn')}`}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Preview step — includes clothing customization
// ─────────────────────────────────────────────
function PreviewStep({
  skinUrl, clothing, isRegenerating, onClothingChange, onRestart,
}: {
  skinUrl: string
  clothing: ClothingConfig
  isRegenerating: boolean
  onClothingChange: (c: ClothingConfig) => void
  onRestart: () => void
}) {
  const t = useTranslations('Converter')
  const [copied, setCopied] = useState(false)

  function download() {
    const a = document.createElement('a')
    a.href = skinUrl; a.download = 'myskin.png'; a.click()
  }

  async function share() {
    try {
      const res = await fetch(skinUrl)
      const blob = await res.blob()
      const file = new File([blob], 'minecraft-skin.png', { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Mi skin de Minecraft', text: '¡Mira mi skin creado con SkinMe!' })
        return
      }
    } catch { /* fall through */ }
    // Fallback: copy data URL to clipboard
    try {
      await navigator.clipboard.writeText(skinUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { download() }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <h2 className="font-extrabold"
        style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', lineHeight: 2, color: 'var(--color-green-mine)' }}>
        {t('previewTitle')} 🎉
      </h2>

      {/* Preview area */}
      <div className="w-full rounded-2xl p-5 flex flex-col items-center gap-4 relative"
        style={{ background: 'var(--color-cream-dark)', border: '2px solid var(--color-green-grass)' }}>
        {isRegenerating && (
          <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(254,249,239,0.82)', zIndex: 10 }}>
            <div className="w-10 h-10 rounded-full animate-spin"
              style={{ border: '3px solid var(--color-green-mine)', borderTopColor: 'transparent' }} />
          </div>
        )}
        <p className="text-xs font-bold opacity-60 text-earth tracking-wide uppercase">{t('previewLabel')}</p>
        <div className="flex items-center justify-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-xl p-3" style={{ background: '#5a6a7a' }}>
              <CharacterPreview skinUrl={skinUrl} />
            </div>
            <p className="text-xs opacity-40 text-earth">{t('previewCharLabel')}</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={skinUrl} alt="Skin" className="pixel-art rounded-lg shadow"
              style={{ width: 128, height: 128, imageRendering: 'pixelated' }} />
            <p className="text-xs opacity-40 text-earth">{t('previewMapLabel')}</p>
          </div>
        </div>
        <p className="text-xs text-center opacity-50 text-earth">{t('downloadHint')}</p>
      </div>

      {/* Clothing customization */}
      <ClothingSelector value={clothing} onChange={onClothingChange} />

      <div className="flex flex-col gap-3 w-full">
        {/* Edit manually button */}
        <Link href="/editor"
          onClick={() => localStorage.setItem('skinme_edit_skin', skinUrl)}
          className="w-full py-3 rounded-2xl font-bold text-center transition-all hover:opacity-90 active:scale-95"
          style={{
            background: 'var(--color-cream-dark)',
            color: 'var(--color-earth)',
            border: '2px solid var(--color-brown-dirt)',
            display: 'block',
          }}>
          ✏️ {t('editBtn')}
        </Link>

        {/* Download + Share row */}
        <div className="flex gap-3 w-full">
          <button onClick={onRestart} className="flex-1 py-3 rounded-2xl font-bold transition-all"
            style={{ background: 'var(--color-cream-dark)', color: 'var(--color-earth)' }}>
            {t('restartBtn')}
          </button>
          <button onClick={download}
            className="flex-[2] py-4 rounded-2xl font-bold text-white text-lg transition-all hover:opacity-90 active:scale-95 shadow-lg"
            style={{ background: 'var(--color-green-mine)' }}>
            ⬇ {t('downloadBtn')}
          </button>
        </div>
        {/* Share button */}
        <button
          onClick={share}
          className="w-full py-3 rounded-2xl font-bold transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
          style={{ background: 'var(--color-cream-dark)', color: 'var(--color-earth)', border: '2px solid var(--color-brown-dirt)' }}>
          <span>{copied ? '✅' : '📤'}</span>
          <span>{copied ? t('shareCopied') : t('shareBtn')}</span>
          <span className="text-xs opacity-50 ml-1">WhatsApp · Email</span>
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Error step
// ─────────────────────────────────────────────
function ErrorStep({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('Converter')
  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <span className="text-5xl">😵</span>
      <div>
        <h2 className="font-extrabold text-earth text-lg mb-2"
          style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', lineHeight: 2 }}>
          {t('errorTitle')}
        </h2>
        <p className="text-sm opacity-60 text-earth max-w-xs mx-auto">{t('errorDesc')}</p>
      </div>
      <button onClick={onRetry}
        className="px-8 py-3 rounded-2xl font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-md"
        style={{ background: 'var(--color-green-mine)' }}>
        {t('errorBtn')}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────────
function StepBar({ step, autoGenerating }: { step: Step; autoGenerating: boolean }) {
  const logicalSteps: Array<'upload' | 'crop' | 'preview'> = ['upload', 'crop', 'preview']
  const idx = autoGenerating ? 1 : (step === 'error' ? 0 : logicalSteps.indexOf(step as 'upload' | 'crop' | 'preview'))
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {logicalSteps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
            style={{
              background: i <= idx ? 'var(--color-green-mine)' : 'var(--color-cream-dark)',
              color: i <= idx ? 'white' : 'var(--color-brown-dirt)',
              border: `2px solid ${i <= idx ? 'var(--color-green-mine)' : 'var(--color-brown-dirt)'}`,
            }}>
            {i < idx ? '✓' : i + 1}
          </div>
          {i < logicalSteps.length - 1 && (
            <div className="w-8 h-1 rounded-full transition-all"
              style={{ background: i < idx ? 'var(--color-green-mine)' : 'var(--color-cream-dark)' }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Generating spinner
// ─────────────────────────────────────────────
function GeneratingScreen() {
  const t = useTranslations('Converter')
  return (
    <div className="flex flex-col items-center gap-6 py-16">
      <div className="w-16 h-16 rounded-full animate-spin"
        style={{ border: '4px solid var(--color-green-mine)', borderTopColor: 'transparent' }} />
      <p className="font-extrabold text-earth"
        style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.85rem', lineHeight: 2 }}>
        {t('generatingTitle')}
      </p>
      <p className="text-sm opacity-50 text-earth">{t('generatingDesc')}</p>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function SkinConverter() {
  const [step, setStep] = useState<Step>('upload')
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [skinUrl, setSkinUrl] = useState<string | null>(null)
  const [autoGenerating, setAutoGenerating] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [qualityWarning, setQualityWarning] = useState<'dark' | null>(null)
  const [clothing, setClothing] = useState<ClothingConfig>(DEFAULT_CLOTHING)

  // Face canvas stored at crop time so re-generation doesn't need the DOM img
  const pendingFace = useRef<HTMLCanvasElement | null>(null)

  const handleFile = useCallback((file: File, skipCrop?: boolean) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      setImageSrc(src)
      if (skipCrop) {
        setAutoGenerating(true)
        const img = new Image()
        img.onload = async () => {
          const crop: PixelCrop = { unit: 'px', x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight }
          pendingFace.current = cropFaceCanvas(img, crop)
          try {
            const url = generateSkinFromCanvas(pendingFace.current, clothing)
            setSkinUrl(url); setStep('preview')
          } catch { setStep('error') }
          finally { setAutoGenerating(false) }
        }
        img.onerror = () => { setAutoGenerating(false); setStep('error') }
        img.src = src
      } else {
        analyzeImageBrightness(src).then(setQualityWarning)
        setStep('crop')
      }
    }
    reader.readAsDataURL(file)
  }, [clothing])

  const handleGenerate = useCallback(async (imgEl: HTMLImageElement, crop: PixelCrop) => {
    pendingFace.current = cropFaceCanvas(imgEl, crop)
    try {
      const url = generateSkinFromCanvas(pendingFace.current, clothing)
      setSkinUrl(url); setStep('preview')
    } catch { setStep('error') }
  }, [clothing])

  const handleClothingChange = useCallback((next: ClothingConfig) => {
    setClothing(next)
    if (!pendingFace.current) return
    setIsRegenerating(true)
    try {
      const url = generateSkinFromCanvas(pendingFace.current, next)
      setSkinUrl(url)
    } catch { /* keep old skin on error */ }
    finally { setIsRegenerating(false) }
  }, [])

  const handleRestart = useCallback(() => {
    setStep('upload'); setImageSrc(null); setSkinUrl(null)
    setAutoGenerating(false); setQualityWarning(null); setIsRegenerating(false)
    pendingFace.current = null
  }, [])

  return (
    <div className="rounded-3xl p-8 shadow-xl"
      style={{ background: 'var(--color-cream)', border: '2px solid var(--color-cream-dark)' }}>
      <StepBar step={step} autoGenerating={autoGenerating} />

      {autoGenerating ? (
        <GeneratingScreen />
      ) : step === 'upload' ? (
        <UploadStep onFile={handleFile} />
      ) : step === 'crop' && imageSrc ? (
        <CropStep imageSrc={imageSrc} qualityWarning={qualityWarning}
          onGenerate={handleGenerate} onBack={handleRestart} />
      ) : step === 'preview' && skinUrl ? (
        <PreviewStep skinUrl={skinUrl} clothing={clothing} isRegenerating={isRegenerating}
          onClothingChange={handleClothingChange} onRestart={handleRestart} />
      ) : step === 'error' ? (
        <ErrorStep onRetry={handleRestart} />
      ) : null}
    </div>
  )
}
