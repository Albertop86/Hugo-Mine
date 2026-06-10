'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onCapture: (file: File, skipCrop: boolean) => void
  onClose: () => void
}

export default function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady]       = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [flash, setFlash]       = useState(false)
  const [tooDark, setTooDark]   = useState(false)

  // Start camera
  useEffect(() => {
    let mounted = true
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1080 } }, audio: false })
      .then(stream => {
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => {
        if (mounted) setError('No se pudo acceder a la cámara.\nComprueba los permisos del navegador.')
      })
    return () => { mounted = false; stopStream() }
  }, [])

  // Real-time brightness check — warn user if lighting is too dark
  useEffect(() => {
    if (!ready) return
    const canvas = document.createElement('canvas')
    canvas.width = 32; canvas.height = 32
    const ctx = canvas.getContext('2d')!

    const interval = setInterval(() => {
      const video = videoRef.current
      if (!video || video.readyState < 2) return
      ctx.drawImage(video, 0, 0, 32, 32)
      const { data } = ctx.getImageData(0, 0, 32, 32)
      let total = 0
      for (let i = 0; i < data.length; i += 4)
        total += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      setTooDark(total / (32 * 32) < 58)
    }, 800)

    return () => clearInterval(interval)
  }, [ready])

  function stopStream() {
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  function capture() {
    const video = videoRef.current
    if (!video || !ready) return

    setFlash(true)
    setTimeout(() => setFlash(false), 200)

    // Draw the mirrored square centre of the video frame
    const size = Math.min(video.videoWidth, video.videoHeight)
    const full = document.createElement('canvas')
    full.width = size; full.height = size
    const fc = full.getContext('2d')!
    fc.translate(size, 0)
    fc.scale(-1, 1)
    fc.drawImage(
      video,
      (video.videoWidth - size) / 2, (video.videoHeight - size) / 2,
      size, size, 0, 0, size, size
    )

    // Crop to the face oval bounding box:
    // Oval: cx=50%, cy=47%, rx=35%, ry=41%  → bbox x=15%,y=6%,w=70%,h=82%
    // Square crop centred at oval centre with side = 82% of frame
    const faceSize = Math.round(size * 0.82)
    const faceX    = Math.round(size * 0.09)  // 50% - 41%
    const faceY    = Math.round(size * 0.06)  // 47% - 41%
    const face = document.createElement('canvas')
    face.width = faceSize; face.height = faceSize
    face.getContext('2d')!.drawImage(full, faceX, faceY, faceSize, faceSize, 0, 0, faceSize, faceSize)

    face.toBlob(blob => {
      if (blob) onCapture(new File([blob], 'selfie.jpg', { type: 'image/jpeg' }), true)
    }, 'image/jpeg', 0.92)
    stopStream()
  }

  function handleClose() { stopStream(); onClose() }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center bg-black"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {/* Flash */}
      {flash && <div className="fixed inset-0 z-60 bg-white pointer-events-none" style={{ opacity: 0.85 }} />}

      {/* Header */}
      <div className="w-full flex items-center justify-between px-4 py-3 shrink-0">
        <button onClick={handleClose}
          className="text-white text-xl w-10 h-10 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          ✕
        </button>
        <p className="text-white font-bold text-sm">Coloca tu cara aquí</p>
        <div className="w-10" />
      </div>

      {/* Main area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-4 px-4">

        {error ? (
          /* ── Error state ── */
          <div className="flex flex-col items-center gap-4 text-white text-center p-8">
            <span className="text-6xl">📷</span>
            <p className="font-bold text-lg">Sin acceso a la cámara</p>
            <p className="opacity-70 text-sm whitespace-pre-line">{error}</p>
            <button onClick={handleClose}
              className="mt-4 px-6 py-3 rounded-2xl font-bold text-white"
              style={{ background: 'var(--color-green-mine)' }}>
              Usar foto de galería
            </button>
          </div>
        ) : (
          <>
            {/* ── Dark-light warning banner ── */}
            {tooDark && (
              <div className="w-full max-w-sm flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold"
                style={{ background: 'rgba(255,200,0,0.2)', border: '2px solid rgba(255,200,0,0.7)', color: '#ffe066' }}>
                <span className="text-xl shrink-0">⚠️</span>
                <span>Está muy oscuro — acércate a una ventana o enciende la luz para mejor resultado.</span>
              </div>
            )}

            {/*
              Square viewfinder.
              The video is object-fit:cover inside a square container.
              The CAPTURE is exactly this square, so what you see = what you get.
            */}
            <div className="relative rounded-2xl overflow-hidden"
              style={{ width: 'min(85vw, 65vh)', height: 'min(85vw, 65vh)', flexShrink: 0 }}>

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onCanPlay={() => setReady(true)}
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Face oval guide — purely decorative, inside the square */}
              {ready && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Dark vignette outside the oval */}
                  <defs>
                    <mask id="face-mask">
                      <rect width="100%" height="100%" fill="white" />
                      <ellipse cx="50%" cy="47%" rx="35%" ry="41%" fill="black" />
                    </mask>
                  </defs>
                  <rect width="100%" height="100%" fill="rgba(0,0,0,0.30)" mask="url(#face-mask)" />
                  {/* Oval border */}
                  <ellipse cx="50%" cy="47%" rx="35%" ry="41%"
                    fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeDasharray="10 5" />
                  {/* Corner crop marks on the square edges */}
                  <line x1="0"   y1="0"   x2="20"  y2="0"   stroke="white" strokeWidth="3" />
                  <line x1="0"   y1="0"   x2="0"   y2="20"  stroke="white" strokeWidth="3" />
                  <line x1="100%" y1="0"  x2="calc(100% - 20px)" y2="0" stroke="white" strokeWidth="3" />
                  <line x1="100%" y1="0"  x2="100%" y2="20" stroke="white" strokeWidth="3" />
                  <line x1="0"   y1="100%" x2="20"  y2="100%" stroke="white" strokeWidth="3" />
                  <line x1="0"   y1="100%" x2="0"   y2="calc(100% - 20px)" stroke="white" strokeWidth="3" />
                  <line x1="100%" y1="100%" x2="calc(100% - 20px)" y2="100%" stroke="white" strokeWidth="3" />
                  <line x1="100%" y1="100%" x2="100%" y2="calc(100% - 20px)" stroke="white" strokeWidth="3" />
                </svg>
              )}

              {/* Loading */}
              {!ready && !error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white opacity-60 text-sm">Iniciando cámara…</p>
                </div>
              )}
            </div>

            {/* Hint below the square */}
            {ready && (
              <p className="text-white text-xs font-medium opacity-70 text-center max-w-xs">
                Lo que ves en el cuadrado = lo que se captura
              </p>
            )}
          </>
        )}
      </div>

      {/* Capture button */}
      {!error && (
        <div className="shrink-0 flex items-center justify-center py-6">
          <button
            onClick={capture}
            disabled={!ready}
            aria-label="Tomar foto"
            className="relative transition-all active:scale-90 disabled:opacity-30"
            style={{ width: 76, height: 76 }}>
            <div className="absolute inset-0 rounded-full border-4 border-white" />
            <div className="absolute inset-2 rounded-full transition-colors"
              style={{ background: ready ? 'var(--color-green-mine)' : '#555' }} />
          </button>
        </div>
      )}
    </div>
  )
}
