import type { PixelCrop } from 'react-image-crop'
import type { ClothingConfig, ShirtId, PantsId, ShoeId } from './clothingConfig'
import { DEFAULT_CLOTHING } from './clothingConfig'

const W = 64
const H = 64

interface RGB { r: number; g: number; b: number }

// ─── UV regions [x, y, w, h] — Steve / 64×64 ─────────────────────────────
const UV = {
  headTop:    [8,  0,  8, 8] as const,
  headBottom: [16, 0,  8, 8] as const,
  headRight:  [0,  8,  8, 8] as const,
  headFront:  [8,  8,  8, 8] as const,
  headLeft:   [16, 8,  8, 8] as const,
  headBack:   [24, 8,  8, 8] as const,
  bodyTop:    [20, 16, 8, 4]  as const,
  bodyBottom: [28, 16, 8, 4]  as const,
  bodyRight:  [16, 20, 4, 12] as const,
  bodyFront:  [20, 20, 8, 12] as const,
  bodyLeft:   [28, 20, 4, 12] as const,
  bodyBack:   [32, 20, 8, 12] as const,
  rArmTop:    [44, 16, 4, 4]  as const,
  rArmBottom: [48, 16, 4, 4]  as const,
  rArmRight:  [40, 20, 4, 12] as const,
  rArmFront:  [44, 20, 4, 12] as const,
  rArmLeft:   [48, 20, 4, 12] as const,
  rArmBack:   [52, 20, 4, 12] as const,
  rLegTop:    [4,  16, 4, 4]  as const,
  rLegBottom: [8,  16, 4, 4]  as const,
  rLegRight:  [0,  20, 4, 12] as const,
  rLegFront:  [4,  20, 4, 12] as const,
  rLegLeft:   [8,  20, 4, 12] as const,
  rLegBack:   [12, 20, 4, 12] as const,
  lArmTop:    [36, 48, 4, 4]  as const,
  lArmBottom: [40, 48, 4, 4]  as const,
  lArmRight:  [32, 52, 4, 12] as const,
  lArmFront:  [36, 52, 4, 12] as const,
  lArmLeft:   [40, 52, 4, 12] as const,
  lArmBack:   [44, 52, 4, 12] as const,
  lLegTop:    [20, 48, 4, 4]  as const,
  lLegBottom: [24, 48, 4, 4]  as const,
  lLegRight:  [16, 52, 4, 12] as const,
  lLegFront:  [20, 52, 4, 12] as const,
  lLegLeft:   [24, 52, 4, 12] as const,
  lLegBack:   [28, 52, 4, 12] as const,
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

function clamp(v: number) { return Math.round(Math.max(0, Math.min(255, v))) }
function luma(c: RGB)     { return c.r * 0.299 + c.g * 0.587 + c.b * 0.114 }
function shade(c: RGB, f: number): RGB { return { r:clamp(c.r*f), g:clamp(c.g*f), b:clamp(c.b*f) } }
function mix(a: RGB, b: RGB, t: number): RGB {
  return { r:clamp(a.r+(b.r-a.r)*t), g:clamp(a.g+(b.g-a.g)*t), b:clamp(a.b+(b.b-a.b)*t) }
}
function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt((a.r-b.r)**2 + (a.g-b.g)**2 + (a.b-b.b)**2)
}
function hueShade(c: RGB, f: number): RGB {
  if (f >= 1) { const t=f-1; return { r:clamp(c.r+(255-c.r)*t*.55), g:clamp(c.g+(255-c.g)*t*.28), b:clamp(c.b*f) } }
  return { r:clamp(c.r*f), g:clamp(c.g*(f+.02)), b:clamp(c.b*(f+.06)) }
}
function px(ctx: CanvasRenderingContext2D, x: number, y: number, c: RGB) {
  ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`; ctx.fillRect(x, y, 1, 1)
}
function fill(ctx: CanvasRenderingContext2D, [x,y,w,h]: readonly number[], c: RGB) {
  ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`; ctx.fillRect(x, y, w, h)
}

// ─── Colour extraction ────────────────────────────────────────────────────────

function sampleZone(face: HTMLCanvasElement, x0: number, y0: number, x1: number, y1: number) {
  const ctx = face.getContext('2d')!
  const { width: fw, height: fh } = face
  const sw = Math.max(1, Math.floor(fw*(x1-x0)))
  const sh = Math.max(1, Math.floor(fh*(y1-y0)))
  const id = ctx.getImageData(Math.floor(fw*x0), Math.floor(fh*y0), sw, sh)
  return { data: id.data, w: sw, h: sh }
}

function weightedAvg(data: Uint8ClampedArray, w: number, h: number, fallback: RGB, exp = 2.5): RGB {
  let r=0, g=0, b=0, n=0
  for (let y=0; y<h; y++) for (let x=0; x<w; x++) {
    const i = (y*w+x)*4
    if (data[i+3] < 100) continue
    const dx = (x/w - .5)*2, dy = (y/h - .5)*2
    const wt = Math.exp(-(dx*dx+dy*dy)*exp)
    r+=data[i]*wt; g+=data[i+1]*wt; b+=data[i+2]*wt; n+=wt
  }
  return n > 0 ? { r:Math.round(r/n), g:Math.round(g/n), b:Math.round(b/n) } : fallback
}

function extractDominantDark(
  data: Uint8ClampedArray, w: number, h: number, skinLuma: number, fallback: RGB
): RGB | null {
  let r=0, g=0, b=0, n=0
  for (let y=0; y<h; y++) for (let x=0; x<w; x++) {
    const i = (y*w+x)*4
    if (data[i+3] < 100) continue
    const dx = (x/w - .5)*2, dy = (y/h - .5)*2
    const wt = Math.exp(-(dx*dx+dy*dy)*2.0)
    if (wt < 0.08) continue
    const pixLuma = data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114
    if (pixLuma < skinLuma - 28) {
      r+=data[i]*wt; g+=data[i+1]*wt; b+=data[i+2]*wt; n+=wt
    }
  }
  return n > 2 ? { r:Math.round(r/n), g:Math.round(g/n), b:Math.round(b/n) } : null
}

interface Palette { skin: RGB; hair: RGB }

function extractPalette(face: HTMLCanvasElement): Palette {
  // ── Skin: center face zone ────────────────────────────────────────────
  const sZone = sampleZone(face, .25, .38, .75, .62)
  const skin  = weightedAvg(sZone.data, sZone.w, sZone.h, { r:210, g:170, b:130 }, 2.5)
  const skinLuma_ = luma(skin)

  // ── Background: image corners (almost always background in portrait photos) ──
  const cZones = [
    sampleZone(face, .00, .00, .12, .12), sampleZone(face, .88, .00, 1.0, .12),
    sampleZone(face, .00, .88, .12, 1.0), sampleZone(face, .88, .88, 1.0, 1.0),
  ]
  const cColors = cZones.map(z => weightedAvg(z.data, z.w, z.h, { r:180, g:180, b:180 }, 0.2))
  const bg: RGB = {
    r: Math.round(cColors.reduce((a,c) => a+c.r, 0) / 4),
    g: Math.round(cColors.reduce((a,c) => a+c.g, 0) / 4),
    b: Math.round(cColors.reduce((a,c) => a+c.b, 0) / 4),
  }

  // Weighted avg excluding pixels near background or near skin color.
  // Works for any hair color including blonde (lighter than skin).
  function sampleExBg(
    data: Uint8ClampedArray, w: number, h: number, exp = 1.2
  ): RGB | null {
    let r=0, g=0, b=0, n=0
    for (let y=0; y<h; y++) for (let x=0; x<w; x++) {
      const i = (y*w+x)*4
      if (data[i+3] < 80) continue
      const px3: RGB = { r: data[i], g: data[i+1], b: data[i+2] }
      if (colorDistance(px3, bg)   < 36) continue   // exclude background
      const dx = (x/w-.5)*2, dy = (y/h-.5)*2
      const wt = Math.exp(-(dx*dx+dy*dy)*exp)
      // Down-weight pixels very close to skin (ear bleed, cheek bleed)
      const skinWt = colorDistance(px3, skin) < 40 ? 0.18 : 1.0
      r += data[i]*wt*skinWt; g += data[i+1]*wt*skinWt; b += data[i+2]*wt*skinWt; n += wt*skinWt
    }
    return n > 1 ? { r: Math.round(r/n), g: Math.round(g/n), b: Math.round(b/n) } : null
  }

  // ── Strategy 1: top zone, dark pixels only — precise for dark/brown hair ──
  const topZone = sampleZone(face, .16, .01, .84, .26)
  const darkHair = extractDominantDark(topZone.data, topZone.w, topZone.h, skinLuma_, { r:60, g:40, b:20 })

  // ── Strategy 2: temple zones — reliable for ALL hair colors (including blonde) ──
  // The sides of the face (0–16 % and 84–100 % width, 28–65 % height) almost
  // always contain hair, regardless of whether it is darker or lighter than skin.
  const tL  = sampleZone(face, .00, .28, .16, .65)
  const tR  = sampleZone(face, .84, .28, 1.0, .65)
  const tLc = sampleExBg(tL.data, tL.w, tL.h, 0.7)
  const tRc = sampleExBg(tR.data, tR.w, tR.h, 0.7)
  const templeHair = tLc && tRc ? mix(tLc, tRc, 0.5) : (tLc ?? tRc)

  // ── Strategy 3: full top zone minus background (secondary light-hair signal) ──
  const topExBg = sampleExBg(topZone.data, topZone.w, topZone.h, 1.5)

  // ── Merge ─────────────────────────────────────────────────────────────────
  let rawHair: RGB
  if (darkHair && templeHair) {
    rawHair = mix(darkHair, templeHair, 0.30)   // dark hair: trust extractor, season with temple
  } else if (darkHair) {
    rawHair = darkHair
  } else if (templeHair) {
    rawHair = topExBg ? mix(templeHair, topExBg, 0.22) : templeHair   // light/blonde path
  } else {
    rawHair = topExBg ?? weightedAvg(topZone.data, topZone.w, topZone.h, { r:60, g:40, b:20 }, 1.8)
  }

  // If result is still indistinguishable from skin (rare edge case), default to dark
  const hair = colorDistance(rawHair, skin) < 22 ? shade(skin, 0.48) : rawHair

  return { skin, hair }
}

// ─── Face tile — structured Minecraft-style layout ────────────────────────────

/**
 * Builds an 8×8 face tile using a fixed Minecraft-idiomatic pixel layout.
 * Colours are extracted from the photo but placed in a structured grid so
 * the result is crisp and readable rather than a blurry photo smear.
 *
 * Layout (col 0–7):
 *   row 0: H  H  H  H  H  H  H  H   ← hair
 *   row 1: H  H  H  H  H  H  H  H   ← hair
 *   row 2: Fh Bw Bw Fh Fh Bw Bw Fh  ← forehead + eyebrows
 *   row 3: S  Sc Sc S  S  Sc Sc S   ← eye whites (sclera)
 *   row 4: S  Ir Ir S  S  Ir Ir S   ← iris / pupil
 *   row 5: S  S  Ns Ns S  S  S  S   ← nose shadow
 *   row 6: Ck Ck Ck Ck Ck Ck Ck Ck  ← cheeks
 *   row 7: S  Lp Lp Lp Lp Lp Lp S   ← mouth / lips
 */
function buildFaceTile(
  face: HTMLCanvasElement, skin: RGB, hair: RGB, gender: 'auto' | 'm' | 'f' = 'auto'
): HTMLCanvasElement {
  const isFemale = gender === 'f'
  const skinLuma_ = luma(skin)

  // Extract iris colour from eye zone
  const eyeZone = sampleZone(face, 0.10, 0.34, 0.90, 0.56)
  const rawEye = extractDominantDark(eyeZone.data, eyeZone.w, eyeZone.h, skinLuma_, skin)
  const maxEyeLuma = Math.min(skinLuma_ * 0.35, 55)
  const iris: RGB = (() => {
    const c = rawEye ?? { r: 55, g: 38, b: 22 }
    const l = luma(c)
    return l <= maxEyeLuma ? c : shade(c, maxEyeLuma / Math.max(1, l))
  })()

  // Shared derived colours
  const sclera: RGB = { r: 228, g: 218, b: 205 }
  const brow: RGB   = luma(hair) < 135
    ? mix(hair, { r: 8, g: 6, b: 3 }, 0.10)
    : shade(skin, 0.64)
  const Fh = hueShade(skin, 1.03)
  const Ns = shade(skin, 0.82)

  // Gender-specific derived colours
  // Female: more blush, richer lips, dark lash corners at eye edges
  const blushStrength = isFemale ? 0.13 : 0.06
  const Ck  = mix(skin, { r: 255, g: 148, b: 115 }, blushStrength)
  const Lp: RGB = isFemale
    ? { r: clamp(skin.r*0.74+20), g: clamp(skin.g*0.58+2),  b: clamp(skin.b*0.55) }
    : { r: clamp(skin.r*0.80+14), g: clamp(skin.g*0.66),    b: clamp(skin.b*0.63) }
  // Lash pixel: very dark, drawn at eye corners (female only, just a hint)
  const Ls: RGB = shade(iris, 0.50)

  const H=hair, Bw=brow, S=skin, Sc=sclera, Ir=iris

  // Female layout: thinner arched brow (1 brow pixel + dark lash corners),
  //   more blush, richer lip colour.
  // Male layout: wider flat brow (2 pixels), subtle cheeks, standard lips.
  const layout: RGB[][] = isFemale ? [
    [H,  H,  H,  H,  H,  H,  H,  H ],
    [H,  H,  H,  H,  H,  H,  H,  H ],
    [Ls, S,  Bw, Fh, Fh, Bw, S,  Ls],  // thin arched brow + lash corners
    [S,  Sc, Sc, S,  S,  Sc, Sc, S ],
    [S,  Ir, Ir, S,  S,  Ir, Ir, S ],
    [S,  S,  Ns, Ns, S,  S,  S,  S ],
    [Ck, Ck, Ck, Ck, Ck, Ck, Ck, Ck],
    [S,  Lp, Lp, Lp, Lp, Lp, Lp, S ],
  ] : [
    [H,  H,  H,  H,  H,  H,  H,  H ],
    [H,  H,  H,  H,  H,  H,  H,  H ],
    [Fh, Bw, Bw, Fh, Fh, Bw, Bw, Fh],  // wide flat brow (male)
    [S,  Sc, Sc, S,  S,  Sc, Sc, S ],
    [S,  Ir, Ir, S,  S,  Ir, Ir, S ],
    [S,  S,  Ns, Ns, S,  S,  S,  S ],
    [Ck, Ck, Ck, Ck, Ck, Ck, Ck, Ck],
    [S,  Lp, Lp, Lp, Lp, Lp, Lp, S ],
  ]

  const tile = document.createElement('canvas')
  tile.width = 8; tile.height = 8
  const tc = tile.getContext('2d')!
  for (let row = 0; row < 8; row++)
    for (let col = 0; col < 8; col++)
      px(tc, col, row, layout[row][col])
  return tile
}

// ─── Hair top tile ────────────────────────────────────────────────────────────

function buildHairTopTile(face: HTMLCanvasElement, hair: RGB): HTMLCanvasElement {
  // Solid hair colour for the top of the head — avoids photo bleed
  const tile = document.createElement('canvas')
  tile.width = 8; tile.height = 8
  const tc = tile.getContext('2d')!
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
    // Slight texture: alternate lighter/darker pixels every 2×2 block
    const lighter = (Math.floor(row/2) + Math.floor(col/2)) % 2 === 0
    px(tc, col, row, lighter ? hueShade(hair, 1.05) : shade(hair, 0.82))
  }
  return tile
}

// ─── Clothing colour palettes ─────────────────────────────────────────────────

const SHIRT_PRESETS = {
  auto_dark:  { r:65,  g:82,  b:140 },
  auto_med:   { r:55,  g:100, b:65  },
  auto_warm:  { r:110, g:60,  b:65  },
  auto_light: { r:75,  g:80,  b:90  },
  white:      { r:220, g:220, b:218 },
  black:      { r:38,  g:40,  b:46  },
  navy:       { r:50,  g:70,  b:140 },
  red:        { r:140, g:42,  b:48  },
  green:      { r:55,  g:100, b:65  },
  hoodie:     { r:82,  g:88,  b:100 },
  stripe:     { r:50,  g:70,  b:140 },
  polo:       { r:165, g:40,  b:55  },
  flannel:    { r:95,  g:52,  b:38  },
  tuxedo:     { r:28,  g:30,  b:36  },
  camo:       { r:52,  g:72,  b:38  },
  denim:      { r:58,  g:78,  b:108 },
}

const PANTS_RGB: Record<PantsId, RGB> = {
  jeans: { r:52,  g:76,  b:120 },
  black: { r:35,  g:36,  b:44  },
  khaki: { r:140, g:112, b:72  },
  gray:  { r:74,  g:76,  b:90  },
  navy:  { r:28,  g:45,  b:80  },
}

const SHOE_RGB: Record<ShoeId, RGB> = {
  brown:    { r:52,  g:36,  b:24  },
  black:    { r:24,  g:22,  b:20  },
  white:    { r:196, g:192, b:185 },
  red:      { r:120, g:30,  b:32  },
  sneakers: { r:240, g:237, b:230 },
  boots:    { r:42,  g:28,  b:16  },
  heels:    { r:105, g:20,  b:42  },
  loafers:  { r:108, g:72,  b:44  },
}

// Number of leg rows the shoe occupies (boots extend higher up the leg)
const SHOE_ROWS: Partial<Record<ShoeId, number>> = { boots: 4 }

function shirtColor(shirtId: ShirtId, hair: RGB): RGB {
  if (shirtId === 'auto') {
    const h = luma(hair), isCool = hair.b > hair.r
    if (h < 60)  return SHIRT_PRESETS.auto_dark
    if (h < 110) return SHIRT_PRESETS.auto_med
    if (h < 170) return isCool ? SHIRT_PRESETS.auto_light : SHIRT_PRESETS.auto_warm
    return SHIRT_PRESETS.auto_light
  }
  return SHIRT_PRESETS[shirtId as keyof typeof SHIRT_PRESETS] ?? SHIRT_PRESETS.navy
}

// ─── Body drawing ─────────────────────────────────────────────────────────────

function fillGrad(ctx: CanvasRenderingContext2D, [x,y,w,h]: readonly number[], base: RGB, lF=1.08, dF=0.78) {
  for (let r=0;r<h;r++) {
    const t=h===1?.5:r/(h-1), c=hueShade(base,lF*(1-t)+dF*t)
    ctx.fillStyle=`rgb(${c.r},${c.g},${c.b})`; ctx.fillRect(x,y+r,w,1)
  }
}

function drawShirtSolid(ctx: CanvasRenderingContext2D, [x,y,w,h]: readonly number[], shirt: RGB) {
  const collar=shade(shirt,.56), logo: RGB={r:255,g:220,b:60}, logoDk=shade(logo,.72)
  const diamond=[[0,1,0],[1,1,1],[0,1,0]]
  for (let r=0;r<h;r++) for (let c=0;c<w;c++) {
    const dr=r-3, dc=c-2
    if (dr>=0&&dr<3&&dc>=0&&dc<3&&diamond[dr][dc]) { px(ctx,x+c,y+r,dr===0?logoDk:logo); continue }
    if (r===0&&(c===0||c===w-1)) { px(ctx,x+c,y+r,collar); continue }
    const t=r/(h-1); let col=hueShade(shirt,1.10-t*0.32)
    if (c===0||c===w-1) col=shade(col,.85)
    px(ctx,x+c,y+r,col)
  }
}

function drawShirtStripe(ctx: CanvasRenderingContext2D, [x,y,w,h]: readonly number[], shirt: RGB) {
  const stripe2: RGB={r:240,g:240,b:244}, collar=shade(shirt,.52)
  for (let r=0;r<h;r++) for (let c=0;c<w;c++) {
    if (r===0&&(c===0||c===w-1)) { px(ctx,x+c,y+r,collar); continue }
    const base = Math.floor(c/2)%2===1 ? stripe2 : shirt
    px(ctx,x+c,y+r,hueShade(base,1.08-r/(h-1)*0.28))
  }
}

function drawShirtHoodie(ctx: CanvasRenderingContext2D, [x,y,w,h]: readonly number[], shirt: RGB) {
  const pocket=shade(shirt,.72), lace: RGB={r:200,g:195,b:185}
  for (let r=0;r<h;r++) for (let c=0;c<w;c++) {
    if (r<=1&&(c===3||c===4)) { px(ctx,x+c,y+r,lace); continue }
    if (r>=7&&r<=10&&c>=2&&c<=5) {
      px(ctx,x+c,y+r,(r===7||r===10||c===2||c===5)?pocket:shade(pocket,.88)); continue
    }
    let col=hueShade(shirt,1.08-r/(h-1)*0.30)
    if (c===0||c===w-1) col=shade(col,.82)
    px(ctx,x+c,y+r,col)
  }
}

// Polo shirt — visible collar at top + centre button placket
function drawShirtPolo(ctx: CanvasRenderingContext2D, [x,y,w,h]: readonly number[], shirt: RGB) {
  const collar = shade(shirt, 0.54)
  const placket = shade(shirt, 0.82)
  const btn: RGB = { r: 225, g: 222, b: 215 }
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    if (r === 0 && (c === 0 || c === w-1)) { px(ctx,x+c,y+r,collar); continue }
    if (r === 1 && (c === 0 || c === w-1)) { px(ctx,x+c,y+r,shade(collar,1.08)); continue }
    const mid = Math.floor(w/2)
    if (r > 0 && r < 6 && (c === mid-1 || c === mid)) {
      if (r === 2 || r === 4) { px(ctx,x+c,y+r,btn); continue }
      px(ctx,x+c,y+r,placket); continue
    }
    const t = r / (h-1)
    let col = hueShade(shirt, 1.10 - t*0.32)
    if (c === 0 || c === w-1) col = shade(col, 0.85)
    px(ctx,x+c,y+r,col)
  }
}

// Flannel — plaid checkered pattern
function drawShirtFlannel(ctx: CanvasRenderingContext2D, [x,y,w,h]: readonly number[], shirt: RGB) {
  const plaid: RGB = mix(shirt, { r:200, g:55, b:45 }, 0.40)
  const cross = shade(mix(shirt, plaid, 0.5), 0.72)
  const collar = shade(shirt, 0.52)
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    if (r === 0 && (c === 0 || c === w-1)) { px(ctx,x+c,y+r,collar); continue }
    const t = r / (h-1)
    const rowStripe = Math.floor(r/3) % 2 === 1
    const colStripe = Math.floor(c/2) % 2 === 1
    let base: RGB
    if (rowStripe && colStripe) base = cross
    else if (rowStripe || colStripe) base = plaid
    else base = shirt
    let col = hueShade(base, 1.06 - t*0.28)
    if (c === 0 || c === w-1) col = shade(col, 0.82)
    px(ctx,x+c,y+r,col)
  }
}

// Tuxedo — V-shaped white lapels + red tie
function drawShirtTuxedo(ctx: CanvasRenderingContext2D, [x,y,w,h]: readonly number[], shirt: RGB) {
  const lapel: RGB = { r: 238, g: 234, b: 226 }
  const tie: RGB   = { r: 165, g: 25,  b: 32  }
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const t = r / (h-1)
    const lLapel = r < 7 && c <= Math.floor(r/2)
    const rLapel = r < 7 && c >= w-1-Math.floor(r/2)
    if (lLapel || rLapel) { px(ctx,x+c,y+r,lapel); continue }
    const mid = Math.floor(w/2)
    if (r >= 1 && r <= h-2 && c === mid) { px(ctx,x+c,y+r, r <= 4 ? tie : shade(tie,0.82)); continue }
    let col = hueShade(shirt, 1.06 - t*0.28)
    if (c === 0 || c === w-1) col = shade(col, 0.80)
    px(ctx,x+c,y+r,col)
  }
}

// Camouflage — green/brown/dark pixel patches
function drawShirtCamo(ctx: CanvasRenderingContext2D, [x,y,w,h]: readonly number[], shirt: RGB) {
  const c2: RGB = mix(shirt, { r:140, g:105, b:60 }, 0.55)
  const c3 = shade(shirt, 0.58)
  const collar = shade(shirt, 0.52)
  function camoBase(r: number, c: number): RGB {
    const n = (r*13 + c*7 + r*c*3) % 7
    return n < 2 ? c3 : n < 4 ? c2 : shirt
  }
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    if (r === 0 && (c === 0 || c === w-1)) { px(ctx,x+c,y+r,collar); continue }
    const t = r / (h-1)
    let col = hueShade(camoBase(r,c), 1.04 - t*0.26)
    if (c === 0 || c === w-1) col = shade(col, 0.82)
    px(ctx,x+c,y+r,col)
  }
}

// Denim jacket — woven texture + stitching + chest pocket
function drawShirtDenim(ctx: CanvasRenderingContext2D, [x,y,w,h]: readonly number[], shirt: RGB) {
  const stitch: RGB = { r:195, g:168, b:95  }
  const pocket = shade(shirt, 0.72)
  const collar = shade(shirt, 0.52)
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    if (r === 0 && (c === 0 || c === w-1)) { px(ctx,x+c,y+r,collar); continue }
    const t = r / (h-1)
    let base: RGB = (r+c)%2===0 ? shirt : shade(shirt, 0.88)
    if ((c===1||c===w-2) && r%2===0) base = stitch
    if (r>=2&&r<=5&&c>=5&&c<=7) base = r===2 ? shade(pocket,0.90) : pocket
    let col = hueShade(base, 1.08 - t*0.30)
    if (c===0||c===w-1) col=shade(col,0.82)
    px(ctx,x+c,y+r,col)
  }
}

function drawShirtFront(ctx: CanvasRenderingContext2D, uv: readonly number[], shirt: RGB, design: ShirtId) {
  switch (design) {
    case 'stripe':  drawShirtStripe(ctx, uv, shirt); break
    case 'hoodie':  drawShirtHoodie(ctx, uv, shirt); break
    case 'polo':    drawShirtPolo(ctx, uv, shirt); break
    case 'flannel': drawShirtFlannel(ctx, uv, shirt); break
    case 'tuxedo':  drawShirtTuxedo(ctx, uv, shirt); break
    case 'camo':    drawShirtCamo(ctx, uv, shirt); break
    case 'denim':   drawShirtDenim(ctx, uv, shirt); break
    default:        drawShirtSolid(ctx, uv, shirt); break
  }
}

function drawBodySide(ctx: CanvasRenderingContext2D, [x,y,w,h]: readonly number[], shirt: RGB, design: ShirtId) {
  for (let r=0;r<h;r++) for (let c=0;c<w;c++) {
    const t=r/(h-1)
    let base: RGB = shirt
    if (design==='stripe' && Math.floor(c/2)%2===1) base={r:235,g:235,b:240}
    else if (design==='flannel') { if (Math.floor(r/3)%2===1) base=mix(shirt,{r:200,g:55,b:45},0.40) }
    else if (design==='camo')   { const n=(r*13+c*7+r*c*3)%7; if(n<2) base=shade(shirt,0.58); else if(n<4) base=mix(shirt,{r:140,g:105,b:60},0.55) }
    else if (design==='tuxedo') base=shade(shirt,0.65)
    else if (design==='denim')  base=(r+c)%2===0?shirt:shade(shirt,0.88)
    let col=hueShade(shade(base,.84),1.04-t*.26)
    if (c===0||c===w-1) col=shade(col,.80)
    px(ctx,x+c,y+r,col)
  }
}

function drawArmFace(ctx: CanvasRenderingContext2D, [x,y,w,h]: readonly number[], skin: RGB, sf=1.0, handRows=2) {
  const hand=hueShade(skin,.80)
  for (let r=0;r<h;r++) {
    const t=r/(h-1), col=hueShade(shade(r>=h-handRows?hand:skin,sf),1.06-t*.28)
    ctx.fillStyle=`rgb(${col.r},${col.g},${col.b})`; ctx.fillRect(x,y+r,w,1)
  }
}

function drawHeadSide(ctx: CanvasRenderingContext2D, ox: number, oy: number, s: RGB, h: RGB, hairOnRight: boolean) {
  const sL=hueShade(s,1.10),sD=hueShade(s,.82),hD=shade(h,.70),hL=hueShade(h,1.08)
  const ear=mix(s,{r:255,g:180,b:150},.15)
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    const hs=hairOnRight?c>=4:c<=3; let col:RGB
    if (r<=1) col=(r+c)%2===0?h:hD
    else if (r===2) col=(hairOnRight?c>=3:c<=4)?(c%2===0?h:hD):sL
    else if (r===3) col=(hairOnRight?c>=5:c<=2)?hD:(c===(hairOnRight?4:3)?sL:s)
    else if (r===4) { const ec=hairOnRight?2:5; col=(c===ec||c===ec+(hairOnRight?1:-1))?ear:hs?hL:s }
    else if (r===5) col=hs?shade(h,.80):sL
    else col=hs?shade(h,.72):sD
    px(ctx,ox+c,oy+r,col)
  }
}

function drawHeadBack(ctx: CanvasRenderingContext2D, ox: number, oy: number, h: RGB, s: RGB) {
  const hD=shade(h,.70),hL=hueShade(h,1.06),nape=shade(s,.82)
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    let col:RGB
    if (r>=7&&c>=2&&c<=5) col=nape
    else { col=hueShade(h,(1.06+(1-Math.abs(c-3.5)/4)*.06)-r/7*.32); if((r+c)%4===0)col=hD; if((r+c)%7===0)col=hL }
    px(ctx,ox+c,oy+r,col)
  }
}

// ─── Leg + shoe drawing ────────────────────────────────────────────────────────

function drawLegs(
  ctx: CanvasRenderingContext2D,
  uvSets: readonly (readonly number[])[][],
  pants: RGB, shoe: RGB, shoeId: ShoeId
) {
  const shoeH = SHOE_ROWS[shoeId] ?? 2

  for (const [front,right,left,back,top,bot] of uvSets) {
    const legH  = front[3]           // 12
    const shoeStart = legH - shoeH   // first row of shoe

    for (let r = 0; r < legH; r++) {
      const isShoe   = r >= shoeStart
      const isSole   = r === legH - 1
      const shoeRow  = r - shoeStart  // index within shoe section
      const t = r / (legH - 1)

      // Base colour selection
      let base: RGB
      if (!isShoe) {
        base = pants
      } else if (shoeId === 'boots' && shoeRow === 0) {
        base = mix(shoe, { r:215, g:195, b:175 }, 0.22)  // boot rim highlight
      } else if (shoeId === 'sneakers' && isSole) {
        base = { r:158, g:155, b:148 }  // grey rubber sole
      } else {
        base = shoe
      }

      const fF = hueShade(base, 1.08 - t*0.30)
      const fS = hueShade(shade(base, 0.86), 1.05 - t*0.26)
      const fB = hueShade(shade(base, 0.76), 1.02 - t*0.24)

      // Front face — per-pixel detail per shoe type
      for (let c = 0; c < front[2]; c++) {
        let col = fF

        // Pants: centre crease line
        if (!isShoe && c === Math.floor(front[2]/2)) col = shade(fF, 0.88)

        // Sneakers: lace area at shoe top row
        if (shoeId === 'sneakers' && shoeRow === 0 && !isSole && (c === 1 || c === 2))
          col = { r:172, g:169, b:162 }

        // Black shoes: toe gloss highlight
        if (shoeId === 'black' && shoeRow === 0 && c === 0)
          col = mix(shoe, { r:85, g:85, b:95 }, 0.38)

        // Brown shoes: lighter toe cap
        if (shoeId === 'brown' && shoeRow === 0 && c === 0)
          col = mix(shoe, { r:180, g:130, b:85 }, 0.25)

        // Heels: darker back column (suggests stiletto heel)
        if (shoeId === 'heels' && isSole && c === front[2]-1)
          col = shade(shoe, 0.42)

        // Loafers: centre seam on upper
        if (shoeId === 'loafers' && !isSole && shoeRow === 0 && c === 1)
          col = shade(fF, 0.80)

        // Boots: darker sole row
        if (shoeId === 'boots' && isSole) col = shade(fF, 0.78)

        px(ctx, front[0]+c, front[1]+r, col)
      }

      ctx.fillStyle=`rgb(${fS.r},${fS.g},${fS.b})`
      ctx.fillRect(right[0],right[1]+r,right[2],1)
      ctx.fillRect(left[0], left[1]+r, left[2], 1)
      ctx.fillStyle=`rgb(${fB.r},${fB.g},${fB.b})`
      ctx.fillRect(back[0], back[1]+r, back[2], 1)
    }

    // Top cap: pants or boot colour
    fill(ctx, top, shoeId==='boots' ? shade(shoe,0.65) : shade(pants,0.68))

    // Bottom cap (sole underside)
    const soleRGB = shoeId==='sneakers' ? { r:145, g:142, b:135 } : shoe
    fill(ctx, bot, shade(soleRGB, 0.82))
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Extracts and returns the cropped face as a canvas using the correct natural
 * pixel scale. Must be called while the img element is still in the DOM so
 * that img.width reflects the CSS-rendered size (not naturalWidth).
 */
export function cropFaceCanvas(img: HTMLImageElement, crop: PixelCrop): HTMLCanvasElement {
  const scaleX = img.naturalWidth  / img.width
  const scaleY = img.naturalHeight / img.height
  const faceSize = Math.max(Math.round(crop.width*scaleX), Math.round(crop.height*scaleY))
  const face = document.createElement('canvas')
  face.width = faceSize; face.height = faceSize
  face.getContext('2d')!.drawImage(img,
    crop.x*scaleX, crop.y*scaleY, crop.width*scaleX, crop.height*scaleY,
    0, 0, faceSize, faceSize)
  return face
}

/**
 * Generates a 64×64 Minecraft skin from a pre-cropped face canvas.
 * Safe to call after the original img element has been removed from the DOM.
 */
export function generateSkinFromCanvas(
  face: HTMLCanvasElement,
  clothing: ClothingConfig = DEFAULT_CLOTHING
): string {
  const { skin, hair } = extractPalette(face)
  const shirt = shirtColor(clothing.shirt, hair)
  const pants = PANTS_RGB[clothing.pants]
  const shoe  = SHOE_RGB[clothing.shoes]

  // Structured face tile + hair-coloured top tile
  const faceTile    = buildFaceTile(face, skin, hair, clothing.gender)
  const hairTopTile = buildHairTopTile(face, hair)

  const skin64 = document.createElement('canvas')
  skin64.width = W; skin64.height = H
  const ctx = skin64.getContext('2d')!
  ctx.clearRect(0, 0, W, H)
  ctx.imageSmoothingEnabled = false

  // ── HEAD ─────────────────────────────────────────────────
  ctx.drawImage(hairTopTile, UV.headTop[0],   UV.headTop[1])
  ctx.drawImage(faceTile,    UV.headFront[0], UV.headFront[1])
  fill(ctx, UV.headBottom, shade(skin, .88))
  drawHeadSide(ctx, UV.headRight[0], UV.headRight[1], skin, hair, false)
  drawHeadSide(ctx, UV.headLeft[0],  UV.headLeft[1],  skin, hair, true)
  drawHeadBack(ctx, UV.headBack[0],  UV.headBack[1],  hair, skin)

  // ── BODY ─────────────────────────────────────────────────
  drawShirtFront(ctx, UV.bodyFront, shirt, clothing.shirt)
  fillGrad(ctx, UV.bodyBack,   shade(shirt,.78), 1.04, 0.74)
  drawBodySide(ctx, UV.bodyRight, shirt, clothing.shirt)
  drawBodySide(ctx, UV.bodyLeft,  shirt, clothing.shirt)
  fill(ctx, UV.bodyTop,    shade(shirt,.68))
  fill(ctx, UV.bodyBottom, shade(shirt,.60))

  // ── ARMS ─────────────────────────────────────────────────
  for (const [front,right,left,back,top,bot] of [
    [UV.rArmFront,UV.rArmRight,UV.rArmLeft,UV.rArmBack,UV.rArmTop,UV.rArmBottom],
    [UV.lArmFront,UV.lArmRight,UV.lArmLeft,UV.lArmBack,UV.lArmTop,UV.lArmBottom],
  ] as const) {
    drawArmFace(ctx, front, skin, 1.00, 2)
    drawArmFace(ctx, right, skin, 0.86, 2)
    drawArmFace(ctx, left,  skin, 0.86, 2)
    drawArmFace(ctx, back,  skin, 0.74, 2)
    fill(ctx, top, shade(skin,.76))
    fill(ctx, bot, shade(hueShade(skin,.80),.90))
  }

  // ── LEGS ─────────────────────────────────────────────────
  drawLegs(ctx, [
    [UV.rLegFront,UV.rLegRight,UV.rLegLeft,UV.rLegBack,UV.rLegTop,UV.rLegBottom],
    [UV.lLegFront,UV.lLegRight,UV.lLegLeft,UV.lLegBack,UV.lLegTop,UV.lLegBottom],
  ], pants, shoe, clothing.shoes)

  return skin64.toDataURL('image/png')
}

/** Convenience wrapper — only use when the img element is still in the DOM. */
export async function generateSkin(
  img: HTMLImageElement,
  crop: PixelCrop,
  clothing: ClothingConfig = DEFAULT_CLOTHING
): Promise<string> {
  return generateSkinFromCanvas(cropFaceCanvas(img, crop), clothing)
}
