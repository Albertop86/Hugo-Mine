'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import CharacterPreview from './CharacterPreview'

type Tool    = 'pencil' | 'eraser' | 'fill' | 'eyedropper'
type ViewMode = 'body' | 'uv'

const SKIN_W = 64, SKIN_H = 64
const BODY_W = 16, BODY_H = 32

// Front-face body parts: body-space coords → UV texture coords
const BODY_PARTS = [
  { name: 'Cabeza',   bx: 4,  by: 0,  bw: 8, bh: 8,  ux: 8,  uy: 8  },
  { name: 'Cuerpo',   bx: 4,  by: 8,  bw: 8, bh: 12, ux: 20, uy: 20 },
  { name: 'Brazo D',  bx: 0,  by: 8,  bw: 4, bh: 12, ux: 44, uy: 20 },
  { name: 'Brazo I',  bx: 12, by: 8,  bw: 4, bh: 12, ux: 36, uy: 52 },
  { name: 'Pierna D', bx: 4,  by: 20, bw: 4, bh: 12, ux: 4,  uy: 20 },
  { name: 'Pierna I', bx: 8,  by: 20, bw: 4, bh: 12, ux: 20, uy: 52 },
] as const

// UV zones shown in the raw texture view
const UV_ZONES = [
  { label: 'Cabeza',   color: '#4682dc', rects: [[8,0,8,8],[16,0,8,8],[0,8,8,8],[8,8,8,8],[16,8,8,8],[24,8,8,8]] },
  { label: 'Cuerpo',   color: '#46b446', rects: [[20,16,8,4],[28,16,8,4],[16,20,4,12],[20,20,8,12],[28,20,4,12],[32,20,8,12]] },
  { label: 'Brazo D',  color: '#dc8246', rects: [[44,16,4,4],[48,16,4,4],[40,20,4,12],[44,20,4,12],[48,20,4,12],[52,20,4,12]] },
  { label: 'Pierna D', color: '#9846dc', rects: [[4,16,4,4],[8,16,4,4],[0,20,4,12],[4,20,4,12],[8,20,4,12],[12,20,4,12]] },
  { label: 'Brazo I',  color: '#dcb446', rects: [[36,48,4,4],[40,48,4,4],[32,52,4,12],[36,52,4,12],[40,52,4,12],[44,52,4,12]] },
  { label: 'Pierna I', color: '#dc4690', rects: [[20,48,4,4],[24,48,4,4],[16,52,4,12],[20,52,4,12],[24,52,4,12],[28,52,4,12]] },
] as const

const PALETTE = [
  '#ffffff','#c8c8c8','#808080','#404040','#000000',
  '#ff4444','#ff8c44','#ffcc00','#88cc44','#44cc88',
  '#44cccc','#4488ff','#8844ff','#cc44ff','#ff44cc',
  '#884400','#aa7733','#cc9966','#ffcc99','#ffeecc',
]

function hexToRgba(hex: string): [number,number,number,number] {
  const c = hex.replace('#','')
  return [parseInt(c.slice(0,2),16), parseInt(c.slice(2,4),16), parseInt(c.slice(4,6),16), 255]
}
function rgbaToHex(r: number, g: number, b: number) {
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('')
}
function pIdx(x: number, y: number) { return (y * SKIN_W + x) * 4 }

function floodFill(buf: Uint8ClampedArray, x: number, y: number, fill: [number,number,number,number]) {
  const i = pIdx(x,y)
  const [tr,tg,tb,ta] = [buf[i],buf[i+1],buf[i+2],buf[i+3]]
  if (tr===fill[0]&&tg===fill[1]&&tb===fill[2]&&ta===fill[3]) return
  const stack: [number,number][] = [[x,y]]
  const seen = new Uint8Array(SKIN_W*SKIN_H)
  seen[y*SKIN_W+x] = 1
  while (stack.length) {
    const [cx,cy] = stack.pop()!
    const ci = pIdx(cx,cy)
    buf[ci]=fill[0]; buf[ci+1]=fill[1]; buf[ci+2]=fill[2]; buf[ci+3]=fill[3]
    for (const [nx,ny] of [[cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]] as [number,number][]) {
      if (nx<0||nx>=SKIN_W||ny<0||ny>=SKIN_H) continue
      const k = ny*SKIN_W+nx
      if (seen[k]) continue
      const ni = k*4
      if (buf[ni]===tr&&buf[ni+1]===tg&&buf[ni+2]===tb&&buf[ni+3]===ta) { seen[k]=1; stack.push([nx,ny]) }
    }
  }
}

// Total front-face UV pixels used to measure completion
const TOTAL_FRONT_PX = BODY_PARTS.reduce((s, p) => s + p.bw * p.bh, 0)

export default function SkinEditor() {
  const locale = useLocale()

  const [tool,      setTool]      = useState<Tool>('pencil')
  const [color,     setColor]     = useState('#4a90d9')
  const [viewMode,  setViewMode]  = useState<ViewMode>('body')
  const [zoom,      setZoom]      = useState(14)
  const [showGrid,  setShowGrid]  = useState(true)
  const [canUndo,   setCanUndo]   = useState(false)
  const [canRedo,   setCanRedo]   = useState(false)
  const [skinUrl,   setSkinUrl]   = useState<string | null>(null)
  const [showModal,      setShowModal]      = useState(false)
  const [adClicked,      setAdClicked]      = useState(false)
  const [fillCount,      setFillCount]      = useState(0)
  const [autoUploadDone, setAutoUploadDone] = useState(false)
  const [toast,          setToast]          = useState<string | null>(null)
  const [dlState,        setDlState]        = useState<'idle'|'done'>('idle')
  const [skinName,       setSkinName]       = useState('')
  const skinNameRef      = useRef('')         // for use inside async/timer closures
  const skinCompleteRef  = useRef(false)
  const autoUploadedRef  = useRef(false)
  const uploadedIdRef    = useRef<string | null>(null)
  const debounceTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastTimer       = useRef<ReturnType<typeof setTimeout> | null>(null)

  const buf      = useRef(new Uint8ClampedArray(SKIN_W * SKIN_H * 4))
  const offRef   = useRef<HTMLCanvasElement | null>(null)
  const hist     = useRef<Uint8ClampedArray[]>([new Uint8ClampedArray(SKIN_W * SKIN_H * 4)])
  const histPos  = useRef(0)
  const drawing  = useRef(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)

  // Refs mirroring state for event handlers (avoid stale closures)
  const toolRef     = useRef(tool)
  const colorRef    = useRef(color)
  const zoomRef     = useRef(zoom)
  const viewRef     = useRef(viewMode)
  const gridRef     = useRef(showGrid)

  // ── Repaint ───────────────────────────────────────────────────────────────

  const repaint = useCallback(() => {
    const canvas = canvasRef.current
    const off    = offRef.current
    if (!canvas || !off) return
    const z    = zoomRef.current
    const mode = viewRef.current
    const ctx  = canvas.getContext('2d')!

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (mode === 'body') {
      // Checkered background for empty areas
      for (let by = 0; by < BODY_H; by++) {
        for (let bx = 0; bx < BODY_W; bx++) {
          ctx.fillStyle = (Math.floor(bx/2)+Math.floor(by/2))%2===0 ? '#d8d8d8' : '#c0c0c0'
          ctx.fillRect(bx*z, by*z, z, z)
        }
      }

      // Draw each body part from the UV buffer
      for (const part of BODY_PARTS) {
        for (let dy = 0; dy < part.bh; dy++) {
          for (let dx = 0; dx < part.bw; dx++) {
            const i = pIdx(part.ux+dx, part.uy+dy)
            const a = buf.current[i+3]
            // Checkered underneath transparent pixels
            if (a === 0) {
              const bx = part.bx+dx, by2 = part.by+dy
              ctx.fillStyle = (Math.floor(bx/2)+Math.floor(by2/2))%2===0 ? '#e8e8e8' : '#d0d0d0'
              ctx.fillRect(bx*z, by2*z, z, z)
            } else {
              ctx.fillStyle = `rgba(${buf.current[i]},${buf.current[i+1]},${buf.current[i+2]},${a/255})`
              ctx.fillRect((part.bx+dx)*z, (part.by+dy)*z, z, z)
            }
          }
        }
      }

      // Grid lines
      if (gridRef.current && z >= 8) {
        ctx.strokeStyle = 'rgba(0,0,0,0.08)'
        ctx.lineWidth = 0.5
        for (let x = 0; x <= BODY_W; x++) { ctx.beginPath(); ctx.moveTo(x*z,0); ctx.lineTo(x*z,BODY_H*z); ctx.stroke() }
        for (let y = 0; y <= BODY_H; y++) { ctx.beginPath(); ctx.moveTo(0,y*z); ctx.lineTo(BODY_W*z,y*z); ctx.stroke() }
      }

      // Body part outlines + labels
      for (const part of BODY_PARTS) {
        ctx.strokeStyle = 'rgba(0,0,0,0.22)'
        ctx.lineWidth = 1
        ctx.strokeRect(part.bx*z+0.5, part.by*z+0.5, part.bw*z-1, part.bh*z-1)
        if (z >= 12) {
          ctx.fillStyle = 'rgba(0,0,0,0.28)'
          ctx.font = `bold ${Math.max(8, Math.round(z*0.5))}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(part.name, (part.bx + part.bw/2)*z, (part.by + part.bh/2)*z)
        }
      }

    } else {
      // Raw UV map view
      for (let y = 0; y < SKIN_H; y++) {
        for (let x = 0; x < SKIN_W; x++) {
          ctx.fillStyle = (Math.floor(x/2)+Math.floor(y/2))%2===0 ? '#e0e0e0' : '#c8c8c8'
          ctx.fillRect(x*z, y*z, z, z)
        }
      }
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(off, 0, 0, SKIN_W*z, SKIN_H*z)

      if (gridRef.current && z >= 4) {
        ctx.strokeStyle = 'rgba(0,0,0,0.10)'
        ctx.lineWidth = 0.5
        for (let x = 0; x <= SKIN_W; x++) { ctx.beginPath(); ctx.moveTo(x*z,0); ctx.lineTo(x*z,SKIN_H*z); ctx.stroke() }
        for (let y = 0; y <= SKIN_H; y++) { ctx.beginPath(); ctx.moveTo(0,y*z); ctx.lineTo(SKIN_W*z,y*z); ctx.stroke() }
      }

      ctx.lineWidth = 1.5
      for (const zone of UV_ZONES) {
        ctx.strokeStyle = zone.color
        for (const [rx,ry,rw,rh] of zone.rects) ctx.strokeRect(rx*z+0.75, ry*z+0.75, rw*z-1.5, rh*z-1.5)
      }
    }
  }, [])

  function syncOffscreen() {
    const off = offRef.current; if (!off) return
    const ctx = off.getContext('2d')!
    const id  = ctx.createImageData(SKIN_W, SKIN_H)
    id.data.set(buf.current); ctx.putImageData(id, 0, 0)
  }

  function canvasToUrl() { return offRef.current?.toDataURL('image/png') ?? '' }

  function resizeCanvas() {
    const canvas = canvasRef.current; if (!canvas) return
    const z = zoomRef.current, mode = viewRef.current
    canvas.width  = mode === 'body' ? BODY_W * z : SKIN_W * z
    canvas.height = mode === 'body' ? BODY_H * z : SKIN_H * z
  }

  // ── Completion tracking + auto-gallery ───────────────────────────────────

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }

  async function autoUploadToGallery() {
    if (autoUploadedRef.current) return
    autoUploadedRef.current = true
    try {
      const dataUrl = canvasToUrl()
      const blob = await (await fetch(dataUrl)).blob()
      const form = new FormData()
      form.append('skin', new File([blob], 'skin.png', { type: 'image/png' }))
      form.append('name', skinNameRef.current || 'Anónimo')
      const r = await fetch('/api/skins', { method: 'POST', body: form })
      if (r.ok) {
        const data = await r.json()
        uploadedIdRef.current = data.skin?.id ?? null
        setAutoUploadDone(true)
        showToast('¡Skin añadida a la galería de la comunidad! 🎉')
      } else {
        autoUploadedRef.current = false
      }
    } catch {
      autoUploadedRef.current = false
    }
  }

  async function reUploadToGallery() {
    const id = uploadedIdRef.current
    if (!id || !skinCompleteRef.current) return
    try {
      const dataUrl = canvasToUrl()
      const blob = await (await fetch(dataUrl)).blob()
      const form = new FormData()
      form.append('id', id)
      form.append('skin', new File([blob], 'skin.png', { type: 'image/png' }))
      form.append('name', skinNameRef.current || 'Anónimo')
      await fetch('/api/skins', { method: 'PUT', body: form })
    } catch { /* silent */ }
  }

  function scheduleReUpload() {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(reUploadToGallery, 2500)
  }

  function checkCompletion() {
    let filled = 0
    for (const part of BODY_PARTS) {
      for (let dy = 0; dy < part.bh; dy++) {
        for (let dx = 0; dx < part.bw; dx++) {
          if (buf.current[pIdx(part.ux + dx, part.uy + dy) + 3] > 0) filled++
        }
      }
    }
    setFillCount(filled)
    const wasComplete = skinCompleteRef.current
    skinCompleteRef.current = filled === TOTAL_FRONT_PX
    if (!wasComplete && skinCompleteRef.current) {
      autoUploadToGallery()
    } else if (wasComplete && skinCompleteRef.current && uploadedIdRef.current) {
      scheduleReUpload()
    } else if (!skinCompleteRef.current) {
      if (debounceTimer.current) { clearTimeout(debounceTimer.current); debounceTimer.current = null }
    }
  }

  // ── History ───────────────────────────────────────────────────────────────

  function pushHistory() {
    const next = hist.current.slice(0, histPos.current + 1)
    next.push(new Uint8ClampedArray(buf.current))
    if (next.length > 50) next.shift()
    hist.current = next; histPos.current = next.length - 1
    setCanUndo(histPos.current > 0); setCanRedo(false)
    checkCompletion()
  }

  function undo() {
    if (histPos.current <= 0) return
    histPos.current--
    buf.current.set(hist.current[histPos.current])
    syncOffscreen(); repaint(); setSkinUrl(canvasToUrl())
    setCanUndo(histPos.current > 0); setCanRedo(true)
  }

  function redo() {
    if (histPos.current >= hist.current.length - 1) return
    histPos.current++
    buf.current.set(hist.current[histPos.current])
    syncOffscreen(); repaint(); setSkinUrl(canvasToUrl())
    setCanUndo(true); setCanRedo(histPos.current < hist.current.length - 1)
  }

  // ── Coordinate resolution ─────────────────────────────────────────────────

  function resolveUV(cx: number, cy: number): [number,number] | null {
    if (viewRef.current === 'uv') return [cx, cy]
    for (const part of BODY_PARTS) {
      if (cx >= part.bx && cx < part.bx+part.bw && cy >= part.by && cy < part.by+part.bh)
        return [part.ux+(cx-part.bx), part.uy+(cy-part.by)]
    }
    return null
  }

  // ── Drawing ───────────────────────────────────────────────────────────────

  function applyAt(cx: number, cy: number) {
    const t = toolRef.current, c = colorRef.current

    if (t === 'eyedropper') {
      const uv = resolveUV(cx, cy); if (!uv) return
      const i = pIdx(uv[0], uv[1])
      if (buf.current[i+3] > 0) { const hex = rgbaToHex(buf.current[i],buf.current[i+1],buf.current[i+2]); setColor(hex); colorRef.current = hex }
      setTool('pencil'); toolRef.current = 'pencil'; return
    }

    const uv = resolveUV(cx, cy); if (!uv) return

    if (t === 'fill') {
      floodFill(buf.current, uv[0], uv[1], hexToRgba(c))
    } else {
      const i = pIdx(uv[0], uv[1])
      if (t === 'eraser') { buf.current[i]=0; buf.current[i+1]=0; buf.current[i+2]=0; buf.current[i+3]=0 }
      else { const [r,g,b,a]=hexToRgba(c); buf.current[i]=r; buf.current[i+1]=g; buf.current[i+2]=b; buf.current[i+3]=a }
    }

    syncOffscreen(); repaint()
    if (t === 'fill') { pushHistory(); setSkinUrl(canvasToUrl()) }
  }

  function clientToCell(clientX: number, clientY: number): [number,number] {
    const rect = canvasRef.current!.getBoundingClientRect(), z = zoomRef.current
    const maxX = viewRef.current === 'body' ? BODY_W-1 : SKIN_W-1
    const maxY = viewRef.current === 'body' ? BODY_H-1 : SKIN_H-1
    return [
      Math.max(0, Math.min(maxX, Math.floor((clientX-rect.left)/z))),
      Math.max(0, Math.min(maxY, Math.floor((clientY-rect.top)/z))),
    ]
  }

  // ── Events ────────────────────────────────────────────────────────────────

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    e.preventDefault(); drawing.current = true; applyAt(...clientToCell(e.clientX, e.clientY))
  }
  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing.current || toolRef.current==='fill' || toolRef.current==='eyedropper') return
    applyAt(...clientToCell(e.clientX, e.clientY))
  }
  function onMouseUp() {
    if (!drawing.current) return; drawing.current = false
    if (toolRef.current!=='fill' && toolRef.current!=='eyedropper') { pushHistory(); setSkinUrl(canvasToUrl()) }
  }
  function onTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault(); drawing.current = true; const t=e.touches[0]; applyAt(...clientToCell(t.clientX,t.clientY))
  }
  function onTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!drawing.current || toolRef.current==='fill' || toolRef.current==='eyedropper') return
    const t=e.touches[0]; applyAt(...clientToCell(t.clientX,t.clientY))
  }
  function onTouchEnd() { onMouseUp() }

  // ── File import ───────────────────────────────────────────────────────────

  function loadFromFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    autoUploadedRef.current = false
    uploadedIdRef.current = null
    setAutoUploadDone(false)
    const img = new Image()
    img.onload = () => {
      const off=offRef.current!; const ctx=off.getContext('2d')!
      ctx.clearRect(0,0,SKIN_W,SKIN_H); ctx.drawImage(img,0,0,SKIN_W,SKIN_H)
      const id=ctx.getImageData(0,0,SKIN_W,SKIN_H); buf.current.set(id.data)
      repaint(); pushHistory(); setSkinUrl(canvasToUrl())
    }
    img.src = URL.createObjectURL(file); e.target.value = ''
  }

  // ── Download ──────────────────────────────────────────────────────────────

  function startDownload() {
    setShowModal(true); setAdClicked(false); setDlState('idle')
  }

  function doDownload() {
    const a = document.createElement('a')
    a.href = canvasToUrl(); a.download = 'minecraft-skin.png'; a.click()
    setDlState('done')
  }

  // ── Clear all ─────────────────────────────────────────────────────────────

  function clearAll() {
    buf.current.fill(0)
    autoUploadedRef.current = false
    uploadedIdRef.current = null
    setAutoUploadDone(false)
    syncOffscreen(); repaint(); pushHistory(); setSkinUrl(canvasToUrl())
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return
      if (e.ctrlKey||e.metaKey) {
        if (e.key==='z') { e.preventDefault(); undo() }
        if (e.key==='y') { e.preventDefault(); redo() }
        return
      }
      const map: Record<string,Tool> = {p:'pencil',e:'eraser',f:'fill',i:'eyedropper'}
      const t = map[e.key.toLowerCase()]
      if (t) { setTool(t); toolRef.current=t }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Initialisation ────────────────────────────────────────────────────────

  useEffect(() => {
    const off = document.createElement('canvas'); off.width=SKIN_W; off.height=SKIN_H; offRef.current=off
    resizeCanvas()
    const saved = localStorage.getItem('skinme_edit_skin')
    if (saved) {
      localStorage.removeItem('skinme_edit_skin')
      const img = new Image()
      img.onload = () => {
        const ctx=off.getContext('2d')!; ctx.clearRect(0,0,SKIN_W,SKIN_H); ctx.drawImage(img,0,0,SKIN_W,SKIN_H)
        const id=ctx.getImageData(0,0,SKIN_W,SKIN_H); buf.current.set(id.data)
        hist.current=[new Uint8ClampedArray(buf.current)]; histPos.current=0
        repaint(); setSkinUrl(off.toDataURL('image/png'))
      }
      img.src = saved
    } else { repaint(); setSkinUrl(off.toDataURL('image/png')) }
  }, [repaint]) // eslint-disable-line react-hooks/exhaustive-deps

  // Zoom change
  useEffect(() => {
    zoomRef.current = zoom; resizeCanvas(); repaint()
  }, [zoom, repaint]) // eslint-disable-line react-hooks/exhaustive-deps

  // View mode change — snap to a sensible zoom for each mode
  useEffect(() => {
    viewRef.current = viewMode
    if (viewMode==='body' && zoom > 20) setZoom(14)
    if (viewMode==='uv'   && zoom > 12) setZoom(8)
    resizeCanvas(); repaint()
  }, [viewMode, repaint]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { gridRef.current=showGrid; repaint() }, [showGrid, repaint])
  useEffect(() => { toolRef.current=tool   }, [tool])
  useEffect(() => { colorRef.current=color }, [color])

  // ── Zoom options per view ─────────────────────────────────────────────────
  const zoomOptions = viewMode === 'body' ? ([10,14,18] as const) : ([4,8,12] as const)

  // ── Render ────────────────────────────────────────────────────────────────
  const tools: [Tool, string, string][] = [
    ['pencil',     '✏️', 'Pincel (P)'],
    ['eraser',     '⌫',  'Borrador (E)'],
    ['fill',       '🪣', 'Relleno (F)'],
    ['eyedropper', '💉', 'Cuentagotas (I)'],
  ]

  return (
    <div className="flex flex-col gap-4">

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl font-bold text-white text-sm pointer-events-none"
          style={{ background: '#059669', transform: 'translateX(-50%)' }}>
          {toast}
        </div>
      )}

      {/* Download modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.72)' }}>
          <div className="rounded-3xl p-6 flex flex-col items-center gap-4 w-full max-w-sm shadow-2xl"
            style={{ background: 'var(--color-cream)', border: '2px solid var(--color-cream-dark)' }}>

            {dlState === 'done' ? (
              <>
                <p className="font-extrabold text-center"
                  style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.85rem', lineHeight: 2, color: 'var(--color-earth)' }}>
                  ✓ ¡Skin descargada!
                </p>
                {autoUploadDone && (
                  <a href={`/${locale}/gallery`}
                    className="w-full py-3 rounded-2xl font-bold text-white text-sm text-center transition-all hover:opacity-90"
                    style={{ background: 'var(--color-green-mine)' }}>
                    Ver en la galería →
                  </a>
                )}
                <button onClick={() => setShowModal(false)}
                  className="w-full py-3 rounded-2xl font-bold text-sm"
                  style={{ background: 'var(--color-cream-dark)', color: 'var(--color-earth)', border: '2px solid var(--color-brown-dirt)' }}>
                  Cerrar
                </button>
              </>
            ) : (
              <>
                <p className="font-extrabold text-center"
                  style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.85rem', lineHeight: 2, color: 'var(--color-earth)' }}>
                  ¡Tu skin está lista! 🎉
                </p>

                {autoUploadDone && (
                  <p className="text-xs text-center font-bold" style={{ color: '#059669' }}>
                    ✨ Ya está en la galería de la comunidad
                  </p>
                )}

                {/* Ad block */}
                <div
                  onClick={() => setAdClicked(true)}
                  className="w-full rounded-2xl flex flex-col items-center justify-center gap-1 transition-all"
                  style={{
                    height: 100,
                    background: adClicked ? '#d1fae5' : '#f0f0f0',
                    border: adClicked ? '2px solid #34d399' : '2px dashed #d0d0d0',
                    cursor: adClicked ? 'default' : 'pointer',
                  }}>
                  {adClicked
                    ? <span className="text-sm font-bold" style={{ color: '#059669' }}>✓ ¡Gracias!</span>
                    : <>
                        <span className="text-xs font-bold opacity-50" style={{ color: 'var(--color-earth)' }}>Publicidad</span>
                        <span className="text-xs opacity-40" style={{ color: 'var(--color-earth)' }}>👆 Haz clic aquí para desbloquear</span>
                      </>
                  }
                </div>

                <button onClick={adClicked ? doDownload : undefined} disabled={!adClicked}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-40 shadow-md"
                  style={{ background: 'var(--color-green-mine)' }}>
                  {adClicked ? '⬇ Descargar skin' : '🔒 Haz clic en el anuncio primero'}
                </button>

                <button onClick={() => setShowModal(false)} className="text-xs opacity-40 hover:opacity-70" style={{ color: 'var(--color-earth)' }}>Cancelar</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* View toggle */}
        {(['body','uv'] as const).map(v => (
          <button key={v} onClick={() => setViewMode(v)}
            className="h-9 px-3 rounded-xl text-xs font-bold transition-all"
            style={{
              background: viewMode===v ? 'var(--color-green-mine)' : 'var(--color-cream-dark)',
              color:      viewMode===v ? 'white' : 'var(--color-earth)',
              border: `2px solid ${viewMode===v ? 'var(--color-green-mine)' : 'var(--color-brown-dirt)'}`,
            }}>
            {v==='body' ? '🧍 Personaje' : '🗺️ Textura UV'}
          </button>
        ))}

        <div className="w-px h-8 mx-1 opacity-30" style={{ background: 'var(--color-brown-dirt)' }} />

        {/* Tools */}
        {tools.map(([t,icon,label]) => (
          <button key={t} title={label} onClick={() => { setTool(t); toolRef.current=t }}
            className="w-10 h-10 rounded-xl text-lg transition-all hover:scale-105 active:scale-95"
            style={{
              background: tool===t ? 'var(--color-green-mine)' : 'var(--color-cream-dark)',
              border: `2px solid ${tool===t ? 'var(--color-green-mine)' : 'var(--color-brown-dirt)'}`,
            }}>
            {icon}
          </button>
        ))}

        <div className="w-px h-8 mx-1 opacity-30" style={{ background: 'var(--color-brown-dirt)' }} />

        <button onClick={undo} disabled={!canUndo} title="Deshacer (Ctrl+Z)"
          className="w-10 h-10 rounded-xl text-lg transition-all disabled:opacity-30"
          style={{ background:'var(--color-cream-dark)', border:'2px solid var(--color-brown-dirt)' }}>↩</button>
        <button onClick={redo} disabled={!canRedo} title="Rehacer (Ctrl+Y)"
          className="w-10 h-10 rounded-xl text-lg transition-all disabled:opacity-30"
          style={{ background:'var(--color-cream-dark)', border:'2px solid var(--color-brown-dirt)' }}>↪</button>

        <div className="w-px h-8 mx-1 opacity-30" style={{ background: 'var(--color-brown-dirt)' }} />

        {/* Zoom */}
        {zoomOptions.map(z => (
          <button key={z} onClick={() => setZoom(z)}
            className="h-8 px-2.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: zoom===z ? 'var(--color-green-mine)' : 'var(--color-cream-dark)',
              color:      zoom===z ? 'white' : 'var(--color-earth)',
              border: `2px solid ${zoom===z ? 'var(--color-green-mine)' : 'var(--color-brown-dirt)'}`,
            }}>
            {z}×
          </button>
        ))}

        <div className="w-px h-8 mx-1 opacity-30" style={{ background: 'var(--color-brown-dirt)' }} />

        <button onClick={() => setShowGrid(g=>!g)}
          className="h-8 px-2.5 rounded-xl text-xs font-bold transition-all"
          style={{
            background: showGrid ? 'var(--color-green-mine)' : 'var(--color-cream-dark)',
            color:      showGrid ? 'white' : 'var(--color-earth)',
            border: `2px solid ${showGrid ? 'var(--color-green-mine)' : 'var(--color-brown-dirt)'}`,
          }}>
          Grid
        </button>
      </div>

      {/* Canvas + sidebar */}
      <div className="flex gap-5 items-start flex-col xl:flex-row">

        <div className="overflow-auto rounded-2xl flex-shrink-0 max-w-full"
          style={{ border: '2px solid var(--color-cream-dark)' }}>
          <canvas ref={canvasRef}
            style={{ display:'block', cursor:'crosshair', touchAction:'none' }}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove}
            onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 w-full xl:w-64 flex-shrink-0">

          {/* Color picker */}
          <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background:'var(--color-cream-dark)' }}>
            <p className="text-xs font-extrabold tracking-wide uppercase opacity-60 text-earth">Color</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex-shrink-0"
                style={{ background:color, border:'2px solid var(--color-brown-dirt)' }} />
              <input type="color" value={color}
                onChange={e => { setColor(e.target.value); colorRef.current=e.target.value }}
                className="w-full h-10 rounded-lg cursor-pointer border-0 p-0"
                style={{ background:'transparent' }} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PALETTE.map(c => (
                <button key={c} onClick={() => { setColor(c); colorRef.current=c }}
                  className="w-7 h-7 rounded-lg transition-all hover:scale-110 active:scale-95"
                  style={{
                    background: c,
                    border: color===c ? '2.5px solid var(--color-green-mine)' : '1.5px solid rgba(0,0,0,0.20)',
                    boxShadow: color===c ? '0 0 0 1.5px var(--color-green-grass)' : 'none',
                  }} />
              ))}
            </div>
          </div>

          {/* Preview + completion */}
          {skinUrl && (
            <div className="rounded-2xl p-4 flex flex-col items-center gap-3" style={{ background:'var(--color-cream-dark)' }}>
              <p className="text-xs font-extrabold tracking-wide uppercase opacity-60 text-earth">Vista previa</p>
              <div className="rounded-xl p-3" style={{ background:'#5a6a7a' }}>
                <CharacterPreview skinUrl={skinUrl} />
              </div>
              {/* Completion bar */}
              {/* Name input */}
              <div className="w-full flex flex-col gap-1.5">
                <label className="text-xs font-extrabold tracking-wide uppercase opacity-60" style={{ color: 'var(--color-earth)' }}>
                  Nombre para la galería
                </label>
                <input
                  type="text" maxLength={32} value={skinName}
                  onChange={e => { setSkinName(e.target.value); skinNameRef.current = e.target.value }}
                  placeholder="Ej: Mi dragón épico..."
                  className="w-full px-3 py-2 rounded-xl text-sm border-2 outline-none"
                  style={{ borderColor: 'var(--color-brown-dirt)', background: 'var(--color-cream)', color: 'var(--color-earth)' }}
                />
              </div>

              {/* Completion bar */}
              <div className="w-full flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold opacity-60" style={{ color: 'var(--color-earth)' }}>
                    {autoUploadDone
                      ? '✓ En la galería'
                      : fillCount === TOTAL_FRONT_PX
                        ? '⏳ Guardando...'
                        : `${fillCount} / ${TOTAL_FRONT_PX} píxeles`}
                  </span>
                  <span className="text-xs font-bold" style={{ color: fillCount === TOTAL_FRONT_PX ? '#059669' : 'var(--color-earth)', opacity: fillCount === TOTAL_FRONT_PX ? 1 : 0.5 }}>
                    {Math.round(fillCount / TOTAL_FRONT_PX * 100)}%
                  </span>
                </div>
                <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: 'var(--color-cream)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${fillCount / TOTAL_FRONT_PX * 100}%`,
                      background: autoUploadDone ? '#059669' : fillCount === TOTAL_FRONT_PX ? '#34d399' : 'var(--color-green-mine)',
                    }} />
                </div>
                {!autoUploadDone && fillCount < TOTAL_FRONT_PX && fillCount > 0 && (
                  <p className="text-xs opacity-40" style={{ color: 'var(--color-earth)' }}>
                    Rellena todos los píxeles para añadirla a la galería
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button onClick={() => fileRef.current?.click()}
              className="py-3 rounded-2xl font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ background:'var(--color-cream-dark)', color:'var(--color-earth)', border:'2px solid var(--color-brown-dirt)' }}>
              📂 Cargar skin PNG
            </button>
            <input ref={fileRef} type="file" accept="image/png" className="hidden" onChange={loadFromFile} />
            <button onClick={clearAll}
              className="py-3 rounded-2xl font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ background:'#fee2e2', color:'#991b1b', border:'2px solid #fca5a5' }}>
              🗑️ Borrar todo
            </button>
            <button onClick={startDownload}
              className="py-4 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-95 shadow-md"
              style={{ background:'var(--color-green-mine)' }}>
              ⬇ Descargar skin
            </button>
          </div>

          {/* Shortcuts */}
          <div className="rounded-2xl p-3 flex flex-col gap-1" style={{ background:'var(--color-cream-dark)' }}>
            <p className="text-xs font-extrabold tracking-wide uppercase opacity-60 text-earth mb-1">Atajos</p>
            {[['P','Pincel'],['E','Borrador'],['F','Relleno'],['I','Cuentagotas'],['Ctrl+Z','Deshacer'],['Ctrl+Y','Rehacer']].map(([k,v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-xs opacity-50 text-earth">{v}</span>
                <kbd className="text-xs px-1.5 py-0.5 rounded font-mono"
                  style={{ background:'var(--color-cream)', color:'var(--color-earth)', border:'1px solid rgba(0,0,0,0.15)' }}>
                  {k}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
