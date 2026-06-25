import { deflateSync } from 'zlib'

type C = [number, number, number, number]

// ── PNG encoder ──────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c >>> 0
  }
  return t
})()

function crc32b(buf: Buffer): number {
  let c = 0xFFFFFFFF
  for (const b of buf) c = (CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)) >>> 0
  return (c ^ 0xFFFFFFFF) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const t = Buffer.from(type, 'ascii')
  const td = Buffer.concat([t, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32b(td))
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  return Buffer.concat([len, t, data, crc])
}

function toPNG(px: Uint8Array, w: number, h: number): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 6
  const stride = w * 4 + 1
  const raw = Buffer.alloc(stride * h)
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4
      const d = y * stride + 1 + x * 4
      raw[d] = px[s]; raw[d+1] = px[s+1]; raw[d+2] = px[s+2]; raw[d+3] = px[s+3]
    }
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

// ── Types ────────────────────────────────────────────────────────────────────

export type SkinPalette = { face: C; hair: C; body: C; legs: C }

export type SkinExtras = {
  whiskers?: boolean   // Naruto-style cheek marks
  blindfold?: boolean  // White cloth band across eyes (Gojo)
  darkMask?: boolean   // Dark hero mask covering upper face
  chestDot?: C         // Small accent dot on chest (arc reactor, star, etc.)
  chestSymbol?: 'star' | 'lightning' | 'bat' | 'S' | 'arc' // Recognizable chest emblem
  venomFace?: boolean  // Black face with teeth/eyes
  clownFace?: boolean  // Joker makeup
  thorHelmet?: boolean // Thor helmet elements
  wolverineMask?: boolean // Wolverine mask
}

// ── Skin painter ─────────────────────────────────────────────────────────────

export function makeCharacterSkin(p: SkinPalette, extras: SkinExtras = {}): Buffer {
  const W = 64, H = 64
  const px = new Uint8Array(W * H * 4)

  const set = (x: number, y: number, c: C) => {
    if (x < 0 || x >= W || y < 0 || y >= H) return
    const i = (y * W + x) * 4
    px[i] = c[0]; px[i+1] = c[1]; px[i+2] = c[2]; px[i+3] = c[3]
  }
  const fill = (x: number, y: number, w: number, h: number, c: C) => {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++)
        set(x+dx, y+dy, c)
  }
  const dim = (c: C, f: number): C =>
    [Math.min(255, Math.round(c[0]*f)), Math.min(255, Math.round(c[1]*f)), Math.min(255, Math.round(c[2]*f)), c[3]]

  const { face, hair, body, legs } = p
  const bodyS  = dim(body, 0.78)
  const legsS  = dim(legs, 0.78)
  const eyeW: C = [230, 228, 220, 255]
  const eyeD: C = [30,  20,  10,  255]
  const brow    = dim(hair, 0.62)
  const noseS   = dim(face, 0.82)
  const mouthC  = dim(face, 0.60)
  const chinS   = dim(face, 0.90)

  // ── HEAD: sides / top / back ─────────────────────────────────────────────
  // Right side (UV 0,8 — 8×8): hair with alternating stripe texture
  for (let dy = 0; dy < 8; dy++)
    fill(0, 8+dy, 8, 1, dim(hair, dy % 2 === 0 ? 0.82 : 0.77))
  // Top (UV 8,0 — 8×8)
  fill(8, 0, 4, 8, hair)
  fill(12, 0, 4, 8, dim(hair, 0.93))
  // Left side (UV 16,8 — 8×8)
  for (let dy = 0; dy < 8; dy++)
    fill(16, 8+dy, 8, 1, dim(hair, dy % 2 === 0 ? 0.88 : 0.83))
  // Back (UV 24,8 — 8×8)
  fill(24, 8, 8, 8, dim(hair, 0.70))
  // Bottom (UV 16,0 — 8×8)
  fill(16, 0, 8, 8, dim(face, 0.88))

  // ── FACE FRONT (UV 8,8 — 8×8) ───────────────────────────────────────────
  fill(8, 8, 8, 8, face)           // base skin color
  fill(8, 8, 8, 1, hair)           // y=8: hairline
  fill(9, 9, 3, 1, brow)           // y=9: left eyebrow
  fill(13, 9, 3, 1, brow)          // y=9: right eyebrow
  fill(9,  10, 2, 2, eyeW)         // y=10–11: left eye white
  fill(13, 10, 2, 2, eyeW)         // y=10–11: right eye white
  set(10, 10, eyeD); set(10, 11, eyeD)  // left pupil
  set(14, 10, eyeD); set(14, 11, eyeD)  // right pupil
  set(12, 12, noseS)               // y=12: nose shadow
  fill(10, 14, 4, 1, mouthC)       // y=14: mouth
  fill(8, 15, 8, 1, chinS)         // y=15: chin shadow

  // Face extras (applied after base face, overriding as needed)
  if (extras.whiskers) {
    const wC = dim(face, 0.52)
    set(8, 11, wC); set(8, 12, wC); set(8, 13, wC)    // left cheek marks
    set(15, 11, wC); set(15, 12, wC); set(15, 13, wC)  // right cheek marks
  }
  if (extras.blindfold) {
    const band: C = [245, 245, 242, 255]
    fill(8, 9,  8, 1, dim(band, 0.72))
    fill(8, 10, 8, 2, band)
    fill(8, 12, 8, 1, dim(band, 0.72))
  }
  if (extras.darkMask) {
    const maskC = dim(hair, 0.85)
    fill(8, 8, 8, 5, maskC)              // forehead + eye zone = mask
    fill(9,  10, 2, 2, eyeW)             // white eye openings
    fill(13, 10, 2, 2, eyeW)
    set(10, 10, dim(maskC, 0.5)); set(10, 11, dim(maskC, 0.5))  // subtle pupils in white
    set(14, 10, dim(maskC, 0.5)); set(14, 11, dim(maskC, 0.5))
  }

  if (extras.thorHelmet) {
    const silver: C = [190, 195, 205, 255]
    const gold:   C = [215, 180, 35,  255]
    // Silver helmet plate over forehead and sides of face
    fill(8, 8, 8, 2, silver)                            // helmet visor top (y=8,9)
    fill(8, 8, 1, 6, silver)                            // left edge plate
    fill(15, 8, 1, 6, silver)                           // right edge plate
    // Redraw eyes visible through helmet opening
    fill(9,  10, 2, 2, eyeW)
    fill(13, 10, 2, 2, eyeW)
    set(10, 10, eyeD); set(10, 11, eyeD)
    set(14, 10, eyeD); set(14, 11, eyeD)
    set(12, 12, noseS)
    fill(10, 14, 4, 1, mouthC)
    // Golden wings on head side UVs
    fill(0,  9, 4, 3, gold)                             // right side wing (outer face)
    fill(20, 9, 4, 3, gold)                             // left side wing
  }

  if (extras.wolverineMask) {
    const yellow: C = [225, 185, 0,   255]
    const black:  C = [12,  12,  12,  255]
    // Yellow cowl covers forehead and upper face
    fill(8, 8, 8, 4, yellow)
    // Eye holes cut into the mask
    fill(9,  10, 2, 2, eyeW)
    fill(13, 10, 2, 2, eyeW)
    set(10, 10, eyeD); set(10, 11, eyeD)
    set(14, 10, eyeD); set(14, 11, eyeD)
    // Black mask frame around eyes
    fill(8,  10, 1, 2, black)
    fill(11, 10, 2, 2, black)
    fill(15, 10, 1, 2, black)
    // Yellow cowl extends to head sides
    fill(0,  8, 8, 4, yellow)
    fill(16, 8, 8, 4, yellow)
    // Ear/cowl peaks on head top (at UV 8,0)
    fill(8,  4, 2, 4, yellow)                           // left ear spike
    fill(14, 4, 2, 4, yellow)                           // right ear spike
    set(9,  3, yellow); set(14, 3, yellow)              // spike tips
  }

  // ── BODY ─────────────────────────────────────────────────────────────────
  fill(20, 16, 8, 4, body);   fill(28, 16, 8, 4, bodyS)   // top / bottom
  fill(16, 20, 4, 12, bodyS); fill(20, 20, 8, 12, body)   // right / front
  fill(28, 20, 4, 12, bodyS); fill(32, 20, 8, 12, bodyS)  // left / back
  fill(20, 30, 8, 2, dim(body, 0.58))                      // belt stripe
  if (extras.chestDot) fill(23, 21, 2, 2, extras.chestDot)

  // Chest emblems — painted on body front (x=20..27, y=20..31)
  if (extras.chestSymbol) {
    const gold:   C = [255, 215, 0,   255]
    const yellow: C = [255, 230, 0,   255]
    const sym = extras.chestSymbol
    // Anchor point: chest center x=23, top y=21
    if (sym === 'star') {
      // 5×5 gold star
      set(23, 21, gold)
      fill(22, 22, 3, 1, gold)
      fill(21, 23, 5, 1, gold)
      fill(22, 24, 3, 1, gold)
      set(22, 25, gold); set(24, 25, gold)
    } else if (sym === 'lightning') {
      // lightning bolt — yellow
      fill(23, 21, 2, 1, yellow)
      fill(22, 22, 3, 1, yellow)
      fill(23, 23, 2, 1, yellow)
      fill(22, 24, 3, 1, yellow)
      fill(23, 25, 2, 1, yellow)
    } else if (sym === 'bat') {
      // bat silhouette — near-black
      const bat: C = [20, 20, 20, 255]
      set(21, 22, bat); set(22, 22, bat); set(25, 22, bat); set(26, 22, bat)
      fill(21, 23, 6, 1, bat)
      fill(22, 24, 4, 1, bat)
      set(23, 25, bat); set(24, 25, bat)
    } else if (sym === 'S') {
      // Superman S — red on yellow diamond
      const sRed: C = [200, 30, 30, 255]
      fill(22, 21, 4, 1, yellow); set(21, 22, yellow); fill(22, 22, 4, 1, sRed); set(26, 22, yellow)
      fill(22, 23, 4, 1, yellow)
      set(21, 24, yellow); fill(22, 24, 4, 1, sRed); set(26, 24, yellow)
      fill(22, 25, 4, 1, yellow)
    } else if (sym === 'arc') {
      // Iron Man arc reactor — blue ring
      const arc: C = [100, 200, 255, 255]
      fill(22, 21, 4, 1, arc); fill(22, 25, 4, 1, arc)
      set(21, 22, arc); set(21, 23, arc); set(21, 24, arc)
      set(26, 22, arc); set(26, 23, arc); set(26, 24, arc)
      fill(23, 22, 2, 3, [180, 230, 255, 255])  // bright core
    }
  }

  // ── ARMS ─────────────────────────────────────────────────────────────────
  fill(40, 16, 4, 4, body);   fill(44, 16, 4, 4, bodyS)
  fill(40, 20, 4, 12, bodyS); fill(44, 20, 4, 12, body)
  fill(48, 20, 4, 12, bodyS); fill(52, 20, 4, 12, bodyS)

  fill(32, 48, 4, 4, body);   fill(36, 48, 4, 4, bodyS)
  fill(32, 52, 4, 12, bodyS); fill(36, 52, 4, 12, body)
  fill(40, 52, 4, 12, bodyS); fill(44, 52, 4, 12, bodyS)

  // ── LEGS ─────────────────────────────────────────────────────────────────
  fill(0,  16, 4, 4, legs);   fill(4,  16, 4, 4, legsS)
  fill(0,  20, 4, 12, legsS); fill(4,  20, 4, 12, legs)
  fill(8,  20, 4, 12, legsS); fill(12, 20, 4, 12, legsS)

  fill(16, 48, 4, 4, legs);   fill(20, 48, 4, 4, legsS)
  fill(16, 52, 4, 12, legsS); fill(20, 52, 4, 12, legs)
  fill(24, 52, 4, 12, legsS); fill(28, 52, 4, 12, legsS)

  // ── OVERLAY: jacket + pants (second skin layer — renders outside base) ────
  // This gives a 3D jacket-over-shirt look in Minecraft
  const jkt  = dim(body, 0.87)
  const jktS = dim(body, 0.67)
  const pnt  = dim(legs, 0.87)
  const pntS = dim(legs, 0.67)

  // Body jacket (UV y=32–47)
  fill(20, 32, 8, 4, jkt);    fill(28, 32, 8, 4, jktS)
  fill(16, 36, 4, 12, jktS);  fill(20, 36, 8, 12, jkt)
  fill(28, 36, 4, 12, jktS);  fill(32, 36, 8, 12, jktS)
  // Right sleeve overlay
  fill(44, 32, 4, 4, jkt);    fill(48, 32, 4, 4, jktS)
  fill(40, 36, 4, 12, jktS);  fill(44, 36, 4, 12, jkt)
  fill(48, 36, 4, 12, jktS);  fill(52, 36, 4, 12, jktS)
  // Left sleeve overlay
  fill(52, 48, 4, 4, jkt);    fill(56, 48, 4, 4, jktS)
  fill(48, 52, 4, 12, jktS);  fill(52, 52, 4, 12, jkt)
  fill(56, 52, 4, 12, jktS);  fill(60, 52, 4, 12, jktS)
  // Right pant overlay
  fill(4,  32, 4, 4, pnt);    fill(8,  32, 4, 4, pntS)
  fill(0,  36, 4, 12, pntS);  fill(4,  36, 4, 12, pnt)
  fill(8,  36, 4, 12, pntS);  fill(12, 36, 4, 12, pntS)
  // Left pant overlay
  fill(4,  48, 4, 4, pnt);    fill(8,  48, 4, 4, pntS)
  fill(0,  52, 4, 12, pntS);  fill(4,  52, 4, 12, pnt)
  fill(8,  52, 4, 12, pntS);  fill(12, 52, 4, 12, pntS)

  return toPNG(px, W, H)
}

// ── Specialized face painters ─────────────────────────────────────────────────

/** Venom: simbionte negro completo con ojos blancos, boca de dientes y símbolo araña */
export function makeVenomSkin(_p: SkinPalette): Buffer {
  const W = 64, H = 64
  const px = new Uint8Array(W * H * 4)

  const set = (x: number, y: number, c: C) => {
    if (x < 0 || x >= W || y < 0 || y >= H) return
    const i = (y * W + x) * 4
    px[i] = c[0]; px[i+1] = c[1]; px[i+2] = c[2]; px[i+3] = c[3]
  }
  const fill = (x: number, y: number, w: number, h: number, c: C) => {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++)
        set(x+dx, y+dy, c)
  }

  const black:  C = [5,   5,   5,   255]
  const blackD: C = [14,  14,  14,  255]
  const white:  C = [240, 240, 240, 255]
  const whiteD: C = [200, 200, 200, 255]
  const tooth:  C = [250, 250, 248, 255]
  const gum:    C = [180, 30,  50,  255]

  // ── HEAD ────────────────────────────────────────────────────────────────────
  for (let dy = 0; dy < 8; dy++) fill(0,  8+dy, 8, 1, black)
  fill(8, 0, 8, 8, black)
  for (let dy = 0; dy < 8; dy++) fill(16, 8+dy, 8, 1, black)
  fill(24, 8, 8, 8, black)
  fill(16, 0, 8, 8, black)
  fill(8, 8, 8, 8, black)

  // Venom eyes: large white ovals
  fill(8,  9, 3, 3, white)
  fill(13, 9, 3, 3, white)
  set(9, 10, whiteD); set(10, 10, whiteD)
  set(14, 10, whiteD); set(15, 10, whiteD)

  // Wide grin with teeth
  fill(8,  13, 8, 1, gum)
  fill(8,  14, 8, 2, gum)
  set(9,  13, tooth); set(9,  14, tooth)
  set(11, 13, tooth); set(11, 14, tooth)
  set(13, 13, tooth); set(13, 14, tooth)
  set(15, 13, tooth); set(15, 14, tooth)
  fill(11, 15, 2, 1, [180, 20, 40, 255])

  // ── BODY ────────────────────────────────────────────────────────────────────
  fill(20, 16, 8, 4, black);   fill(28, 16, 8, 4, black)
  fill(16, 20, 4, 12, black);  fill(20, 20, 8, 12, black)
  fill(28, 20, 4, 12, black);  fill(32, 20, 8, 12, black)
  // Spider symbol on chest — white, front body UV (20,20)+(8×12)
  set(23, 21, white); set(24, 21, white)                                       // head
  fill(22, 22, 4, 1, white)                                                     // thorax
  set(20, 22, white); set(27, 22, white)                                        // legs 1
  set(21, 23, white); set(23, 23, white); set(24, 23, white); set(26, 23, white) // legs 2
  set(22, 24, white); set(25, 24, white)                                        // abdomen legs 3
  set(21, 25, white); set(26, 25, white)                                        // legs 4

  // ── ARMS ────────────────────────────────────────────────────────────────────
  fill(40, 16, 4, 4, black);  fill(44, 16, 4, 4, black)
  fill(40, 20, 4, 12, black); fill(44, 20, 4, 12, black)
  fill(48, 20, 4, 12, black); fill(52, 20, 4, 12, black)

  fill(32, 48, 4, 4, black);  fill(36, 48, 4, 4, black)
  fill(32, 52, 4, 12, black); fill(36, 52, 4, 12, black)
  fill(40, 52, 4, 12, black); fill(44, 52, 4, 12, black)

  // ── LEGS ────────────────────────────────────────────────────────────────────
  fill(0,  16, 4, 4, black);  fill(4,  16, 4, 4, black)
  fill(0,  20, 4, 12, black); fill(4,  20, 4, 12, black)
  fill(8,  20, 4, 12, black); fill(12, 20, 4, 12, black)

  fill(16, 48, 4, 4, black);  fill(20, 48, 4, 4, black)
  fill(16, 52, 4, 12, black); fill(20, 52, 4, 12, black)
  fill(24, 52, 4, 12, black); fill(28, 52, 4, 12, black)

  // ── OVERLAY (slightly darker for 3D depth) ───────────────────────────────────
  fill(20, 32, 8, 4, blackD);  fill(28, 32, 8, 4, blackD)
  fill(16, 36, 4, 12, blackD); fill(20, 36, 8, 12, blackD)
  fill(28, 36, 4, 12, blackD); fill(32, 36, 8, 12, blackD)
  fill(44, 32, 4, 4, blackD);  fill(48, 32, 4, 4, blackD)
  fill(40, 36, 4, 12, blackD); fill(44, 36, 4, 12, blackD)
  fill(48, 36, 4, 12, blackD); fill(52, 36, 4, 12, blackD)
  fill(52, 48, 4, 4, blackD);  fill(56, 48, 4, 4, blackD)
  fill(48, 52, 4, 12, blackD); fill(52, 52, 4, 12, blackD)
  fill(56, 52, 4, 12, blackD); fill(60, 52, 4, 12, blackD)
  fill(4,  32, 4, 4, blackD);  fill(8,  32, 4, 4, blackD)
  fill(0,  36, 4, 12, blackD); fill(4,  36, 4, 12, blackD)
  fill(8,  36, 4, 12, blackD); fill(12, 36, 4, 12, blackD)
  fill(4,  48, 4, 4, blackD);  fill(8,  48, 4, 4, blackD)
  fill(0,  52, 4, 12, blackD); fill(4,  52, 4, 12, blackD)
  fill(8,  52, 4, 12, blackD); fill(12, 52, 4, 12, blackD)

  return toPNG(px, W, H)
}

/** Joker: cara con maquillaje de payaso + traje completo */
export function makeJokerSkin(p: SkinPalette): Buffer {
  const W = 64, H = 64
  const px = new Uint8Array(W * H * 4)

  const set = (x: number, y: number, c: C) => {
    if (x < 0 || x >= W || y < 0 || y >= H) return
    const i = (y * W + x) * 4
    px[i] = c[0]; px[i+1] = c[1]; px[i+2] = c[2]; px[i+3] = c[3]
  }
  const fill = (x: number, y: number, w: number, h: number, c: C) => {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++)
        set(x+dx, y+dy, c)
  }
  const dim = (c: C, f: number): C =>
    [Math.min(255, Math.round(c[0]*f)), Math.min(255, Math.round(c[1]*f)), Math.min(255, Math.round(c[2]*f)), c[3]]

  const { body, legs, hair } = p
  const bodyS = dim(body, 0.78)
  const legsS = dim(legs, 0.78)

  const whiteBase: C = [240, 235, 225, 255]
  const rouge:     C = [200, 30,  50,  255]
  const lipRed:    C = [180, 0,   30,  255]
  const eyeShadow: C = [50,  50,  80,  255]
  const eyeD:      C = [20,  10,  40,  255]

  // ── HEAD ────────────────────────────────────────────────────────────────────
  for (let dy = 0; dy < 8; dy++) fill(0,  8+dy, 8, 1, dim(hair, dy % 2 === 0 ? 0.82 : 0.77))
  fill(8, 0, 8, 8, hair)
  for (let dy = 0; dy < 8; dy++) fill(16, 8+dy, 8, 1, dim(hair, dy % 2 === 0 ? 0.88 : 0.83))
  fill(24, 8, 8, 8, dim(hair, 0.70))
  fill(16, 0, 8, 8, dim(whiteBase, 0.88))

  // Face front — clown white
  fill(8, 8, 8, 8, whiteBase)
  fill(8, 8, 8, 1, dim(hair, 0.9))                // hairline
  fill(8, 9, 3, 3, eyeShadow)                      // left eye shadow
  fill(13, 9, 3, 3, eyeShadow)                     // right eye shadow
  set(9, 10, eyeD); set(10, 10, eyeD)              // pupils in shadow
  set(14, 10, eyeD); set(15, 10, eyeD)
  fill(8,  12, 2, 1, rouge)                        // cheek rouge left
  fill(14, 12, 2, 1, rouge)                        // cheek rouge right
  fill(9,  13, 6, 1, lipRed)                       // wide painted mouth
  fill(10, 14, 4, 1, lipRed)
  set(8,  13, rouge); set(15, 13, rouge)           // extended smile edges

  // ── BODY ────────────────────────────────────────────────────────────────────
  fill(20, 16, 8, 4, body);   fill(28, 16, 8, 4, bodyS)
  fill(16, 20, 4, 12, bodyS); fill(20, 20, 8, 12, body)
  fill(28, 20, 4, 12, bodyS); fill(32, 20, 8, 12, bodyS)
  fill(20, 30, 8, 2, dim(body, 0.58))

  // ── ARMS ────────────────────────────────────────────────────────────────────
  fill(40, 16, 4, 4, body);   fill(44, 16, 4, 4, bodyS)
  fill(40, 20, 4, 12, bodyS); fill(44, 20, 4, 12, body)
  fill(48, 20, 4, 12, bodyS); fill(52, 20, 4, 12, bodyS)
  fill(32, 48, 4, 4, body);   fill(36, 48, 4, 4, bodyS)
  fill(32, 52, 4, 12, bodyS); fill(36, 52, 4, 12, body)
  fill(40, 52, 4, 12, bodyS); fill(44, 52, 4, 12, bodyS)

  // ── LEGS ────────────────────────────────────────────────────────────────────
  fill(0,  16, 4, 4, legs);   fill(4,  16, 4, 4, legsS)
  fill(0,  20, 4, 12, legsS); fill(4,  20, 4, 12, legs)
  fill(8,  20, 4, 12, legsS); fill(12, 20, 4, 12, legsS)
  fill(16, 48, 4, 4, legs);   fill(20, 48, 4, 4, legsS)
  fill(16, 52, 4, 12, legsS); fill(20, 52, 4, 12, legs)
  fill(24, 52, 4, 12, legsS); fill(28, 52, 4, 12, legsS)

  // ── OVERLAY ──────────────────────────────────────────────────────────────────
  const jkt  = dim(body, 0.87)
  const jktS = dim(body, 0.67)
  const pnt  = dim(legs, 0.87)
  const pntS = dim(legs, 0.67)
  fill(20, 32, 8, 4, jkt);   fill(28, 32, 8, 4, jktS)
  fill(16, 36, 4, 12, jktS); fill(20, 36, 8, 12, jkt)
  fill(28, 36, 4, 12, jktS); fill(32, 36, 8, 12, jktS)
  fill(44, 32, 4, 4, jkt);   fill(48, 32, 4, 4, jktS)
  fill(40, 36, 4, 12, jktS); fill(44, 36, 4, 12, jkt)
  fill(48, 36, 4, 12, jktS); fill(52, 36, 4, 12, jktS)
  fill(52, 48, 4, 4, jkt);   fill(56, 48, 4, 4, jktS)
  fill(48, 52, 4, 12, jktS); fill(52, 52, 4, 12, jkt)
  fill(56, 52, 4, 12, jktS); fill(60, 52, 4, 12, jktS)
  fill(4,  32, 4, 4, pnt);   fill(8,  32, 4, 4, pntS)
  fill(0,  36, 4, 12, pntS); fill(4,  36, 4, 12, pnt)
  fill(8,  36, 4, 12, pntS); fill(12, 36, 4, 12, pntS)
  fill(4,  48, 4, 4, pnt);   fill(8,  48, 4, 4, pntS)
  fill(0,  52, 4, 12, pntS); fill(4,  52, 4, 12, pnt)
  fill(8,  52, 4, 12, pntS); fill(12, 52, 4, 12, pntS)

  return toPNG(px, W, H)
}

/** Spider-Man: red/blue suit with web lines and white eye lenses */
export function makeSpiderManSkin(_p: SkinPalette): Buffer {
  const W = 64, H = 64
  const px = new Uint8Array(W * H * 4)

  const set = (x: number, y: number, c: C) => {
    if (x < 0 || x >= W || y < 0 || y >= H) return
    const i = (y * W + x) * 4
    px[i] = c[0]; px[i+1] = c[1]; px[i+2] = c[2]; px[i+3] = c[3]
  }
  const fill = (x: number, y: number, w: number, h: number, c: C) => {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++)
        set(x+dx, y+dy, c)
  }
  const dim = (c: C, f: number): C =>
    [Math.min(255, Math.round(c[0]*f)), Math.min(255, Math.round(c[1]*f)), Math.min(255, Math.round(c[2]*f)), c[3]]

  const red:   C = [180, 0,   0,   255]
  const redD:  C = [130, 0,   0,   255]
  const blue:  C = [0,   0,   180, 255]
  const blueD: C = [0,   0,   130, 255]
  const black: C = [15,  15,  15,  255]
  const eyeW:  C = [230, 235, 240, 255]

  // HEAD: all red sides/top/back
  for (let dy = 0; dy < 8; dy++) fill(0,  8+dy, 8, 1, dim(red, dy % 2 === 0 ? 0.80 : 0.70))
  fill(8, 0, 8, 8, dim(red, 0.85))
  for (let dy = 0; dy < 8; dy++) fill(16, 8+dy, 8, 1, dim(red, dy % 2 === 0 ? 0.88 : 0.75))
  fill(24, 8, 8, 8, dim(red, 0.60))
  fill(16, 0, 8, 8, dim(red, 0.75))
  // Head top: black web lines over red
  set(12, 0, black); set(12, 1, black); set(12, 2, black); set(12, 3, black)
  set(8, 4, black); set(9, 4, black); set(12, 4, black); set(13, 4, black)

  // FACE FRONT: full red mask
  fill(8, 8, 8, 8, red)
  // Web lines on face
  set(12, 8, black); set(12, 9, black)           // vertical center
  set(10, 9, black); set(14, 9, black)            // horizontal upper
  set(9, 10, black); set(15, 10, black)           // spreading out
  set(8, 11, black); set(15, 11, black)
  // Large white eye lenses (Spider-Man's distinctive eyes)
  fill(8,  9, 3, 3, eyeW)
  fill(13, 9, 3, 3, eyeW)
  set(8,  9, dim(eyeW, 0.8)); set(10, 9, dim(eyeW, 0.8))   // lens sheen
  set(13, 9, dim(eyeW, 0.8)); set(15, 9, dim(eyeW, 0.8))
  // Black outline around lenses
  set(8, 12, black); set(9, 12, black); set(10, 12, black)
  set(13, 12, black); set(14, 12, black); set(15, 12, black)
  // Mouth web line
  fill(9, 14, 6, 1, dim(red, 0.70))
  fill(8, 15, 8, 1, dim(red, 0.65))

  // BODY: red with black web lines
  fill(20, 16, 8, 4, red);    fill(28, 16, 8, 4, redD)
  fill(16, 20, 4, 12, redD);  fill(20, 20, 8, 12, red)
  fill(28, 20, 4, 12, redD);  fill(32, 20, 8, 12, redD)
  // Vertical web line down chest center
  fill(23, 20, 1, 10, black); fill(24, 20, 1, 10, black)
  // Horizontal web lines
  set(21, 21, black); set(22, 21, black); set(25, 21, black); set(26, 21, black)
  set(20, 23, black); set(21, 23, black); set(26, 23, black); set(27, 23, black)
  set(20, 26, black); set(21, 26, black); set(26, 26, black); set(27, 26, black)
  set(21, 28, black); set(22, 28, black); set(25, 28, black); set(26, 28, black)

  // ARMS: red
  fill(40, 16, 4, 4, red);   fill(44, 16, 4, 4, redD)
  fill(40, 20, 4, 12, redD); fill(44, 20, 4, 12, red)
  fill(48, 20, 4, 12, redD); fill(52, 20, 4, 12, redD)
  fill(32, 48, 4, 4, red);   fill(36, 48, 4, 4, redD)
  fill(32, 52, 4, 12, redD); fill(36, 52, 4, 12, red)
  fill(40, 52, 4, 12, redD); fill(44, 52, 4, 12, redD)
  // Web lines on arms
  fill(44, 22, 1, 8, black); fill(36, 54, 1, 8, black)

  // LEGS: blue
  fill(0,  16, 4, 4, blue);   fill(4,  16, 4, 4, blueD)
  fill(0,  20, 4, 12, blueD); fill(4,  20, 4, 12, blue)
  fill(8,  20, 4, 12, blueD); fill(12, 20, 4, 12, blueD)
  fill(16, 48, 4, 4, blue);   fill(20, 48, 4, 4, blueD)
  fill(16, 52, 4, 12, blueD); fill(20, 52, 4, 12, blue)
  fill(24, 52, 4, 12, blueD); fill(28, 52, 4, 12, blueD)

  // OVERLAY: darker layer for depth
  const redO:  C = dim(red,  0.85)
  const blueO: C = dim(blue, 0.85)
  fill(20, 32, 8, 4, redO);   fill(28, 32, 8, 4, dim(red, 0.65))
  fill(16, 36, 4, 12, dim(red, 0.65)); fill(20, 36, 8, 12, redO)
  fill(28, 36, 4, 12, dim(red, 0.65)); fill(32, 36, 8, 12, dim(red, 0.65))
  fill(44, 32, 4, 4, redO);   fill(48, 32, 4, 4, dim(red, 0.65))
  fill(40, 36, 4, 12, dim(red, 0.65)); fill(44, 36, 4, 12, redO)
  fill(48, 36, 4, 12, dim(red, 0.65)); fill(52, 36, 4, 12, dim(red, 0.65))
  fill(52, 48, 4, 4, redO);   fill(56, 48, 4, 4, dim(red, 0.65))
  fill(48, 52, 4, 12, dim(red, 0.65)); fill(52, 52, 4, 12, redO)
  fill(56, 52, 4, 12, dim(red, 0.65)); fill(60, 52, 4, 12, dim(red, 0.65))
  fill(4,  32, 4, 4, blueO);  fill(8,  32, 4, 4, dim(blue, 0.65))
  fill(0,  36, 4, 12, dim(blue, 0.65)); fill(4,  36, 4, 12, blueO)
  fill(8,  36, 4, 12, dim(blue, 0.65)); fill(12, 36, 4, 12, dim(blue, 0.65))
  fill(4,  48, 4, 4, blueO);  fill(8,  48, 4, 4, dim(blue, 0.65))
  fill(0,  52, 4, 12, dim(blue, 0.65)); fill(4,  52, 4, 12, blueO)
  fill(8,  52, 4, 12, dim(blue, 0.65)); fill(12, 52, 4, 12, dim(blue, 0.65))

  return toPNG(px, W, H)
}

/** Deadpool: red+black suit, oval eye mask, X pattern on chest */
export function makeDeadpoolSkin(_p: SkinPalette): Buffer {
  const W = 64, H = 64
  const px = new Uint8Array(W * H * 4)

  const set = (x: number, y: number, c: C) => {
    if (x < 0 || x >= W || y < 0 || y >= H) return
    const i = (y * W + x) * 4
    px[i] = c[0]; px[i+1] = c[1]; px[i+2] = c[2]; px[i+3] = c[3]
  }
  const fill = (x: number, y: number, w: number, h: number, c: C) => {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++)
        set(x+dx, y+dy, c)
  }
  const dim = (c: C, f: number): C =>
    [Math.min(255, Math.round(c[0]*f)), Math.min(255, Math.round(c[1]*f)), Math.min(255, Math.round(c[2]*f)), c[3]]

  const red:   C = [180, 0,   0,   255]
  const redD:  C = [130, 0,   0,   255]
  const black: C = [15,  15,  15,  255]
  const blackL: C = [35,  35,  35,  255]
  const eyeW:  C = [230, 235, 240, 255]

  // HEAD: red all around
  for (let dy = 0; dy < 8; dy++) fill(0,  8+dy, 8, 1, dim(red, dy % 2 === 0 ? 0.80 : 0.70))
  fill(8, 0, 8, 8, dim(red, 0.85))
  for (let dy = 0; dy < 8; dy++) fill(16, 8+dy, 8, 1, dim(red, dy % 2 === 0 ? 0.88 : 0.75))
  fill(24, 8, 8, 8, dim(red, 0.60))
  fill(16, 0, 8, 8, dim(red, 0.75))

  // FACE: red base with black oval eye patches
  fill(8, 8, 8, 8, red)
  fill(8, 8, 8, 1, dim(red, 0.7))   // top edge
  // Black oval around each eye (Deadpool's signature look)
  fill(8,  9, 3, 4, black)           // left eye patch
  fill(13, 9, 3, 4, black)           // right eye patch
  // White eye lenses inside the black patches
  fill(9,  10, 2, 2, eyeW)
  fill(14, 10, 2, 2, eyeW)
  // Mouth line
  fill(10, 14, 4, 1, dim(red, 0.55))
  fill(9,  15, 6, 1, dim(red, 0.60))

  // BODY: red with black X on chest and dark panel sides
  fill(20, 16, 8, 4, red);    fill(28, 16, 8, 4, redD)
  fill(16, 20, 4, 12, black); fill(20, 20, 8, 12, red)   // black side panels
  fill(28, 20, 4, 12, black); fill(32, 20, 8, 12, black)
  // X pattern on chest (the Deadpool logo)
  set(20, 20, red); set(21, 21, black); set(22, 22, black); set(23, 23, black)
  set(24, 22, black); set(25, 21, black); set(26, 20, red)
  set(20, 22, red); set(21, 22, black); set(25, 22, black); set(26, 22, red)
  set(21, 23, black); set(25, 23, black)
  set(22, 24, black); set(24, 24, black)
  set(23, 25, black)
  // Belt
  fill(20, 30, 8, 2, dim(red, 0.45))

  // ARMS: red with black hand/wrist
  fill(40, 16, 4, 4, red);   fill(44, 16, 4, 4, redD)
  fill(40, 20, 4, 10, redD); fill(44, 20, 4, 10, red)
  fill(48, 20, 4, 10, redD); fill(52, 20, 4, 10, redD)
  fill(40, 30, 4, 2, black); fill(44, 30, 4, 2, black)   // black wrist
  fill(32, 48, 4, 4, red);   fill(36, 48, 4, 4, redD)
  fill(32, 52, 4, 10, redD); fill(36, 52, 4, 10, red)
  fill(40, 52, 4, 10, redD); fill(44, 52, 4, 10, redD)
  fill(32, 62, 4, 2, black); fill(36, 62, 4, 2, black)   // black wrist

  // LEGS: black
  fill(0,  16, 4, 4, black);  fill(4,  16, 4, 4, blackL)
  fill(0,  20, 4, 12, blackL);fill(4,  20, 4, 12, black)
  fill(8,  20, 4, 12, blackL);fill(12, 20, 4, 12, blackL)
  fill(16, 48, 4, 4, black);  fill(20, 48, 4, 4, blackL)
  fill(16, 52, 4, 12, blackL);fill(20, 52, 4, 12, black)
  fill(24, 52, 4, 12, blackL);fill(28, 52, 4, 12, blackL)

  // OVERLAY
  const redO: C = dim(red, 0.87)
  fill(20, 32, 8, 4, redO);   fill(28, 32, 8, 4, dim(red, 0.67))
  fill(16, 36, 4, 12, black); fill(20, 36, 8, 12, redO)
  fill(28, 36, 4, 12, black); fill(32, 36, 8, 12, black)
  fill(44, 32, 4, 4, redO);   fill(48, 32, 4, 4, dim(red, 0.67))
  fill(40, 36, 4, 12, dim(red, 0.67)); fill(44, 36, 4, 12, redO)
  fill(48, 36, 4, 12, dim(red, 0.67)); fill(52, 36, 4, 12, dim(red, 0.67))
  fill(52, 48, 4, 4, redO);   fill(56, 48, 4, 4, dim(red, 0.67))
  fill(48, 52, 4, 12, dim(red, 0.67)); fill(52, 52, 4, 12, redO)
  fill(56, 52, 4, 12, dim(red, 0.67)); fill(60, 52, 4, 12, dim(red, 0.67))
  const bkO: C = dim(black, 0.87)
  fill(4,  32, 4, 4, bkO);    fill(8,  32, 4, 4, dim(black, 0.67))
  fill(0,  36, 4, 12, dim(black, 0.67)); fill(4,  36, 4, 12, bkO)
  fill(8,  36, 4, 12, dim(black, 0.67)); fill(12, 36, 4, 12, dim(black, 0.67))
  fill(4,  48, 4, 4, bkO);    fill(8,  48, 4, 4, dim(black, 0.67))
  fill(0,  52, 4, 12, dim(black, 0.67)); fill(4,  52, 4, 12, bkO)
  fill(8,  52, 4, 12, dim(black, 0.67)); fill(12, 52, 4, 12, dim(black, 0.67))

  return toPNG(px, W, H)
}

// ── Character colour palettes ─────────────────────────────────────────────────

const L: C = [255, 213, 170, 255]
const M: C = [220, 175, 130, 255]

const BY_CATEGORY: Record<string, SkinPalette> = {
  Marvel:    { face: L, hair: [30,30,30,255],    body: [180,0,0,255],     legs: [20,20,160,255] },
  DC:        { face: L, hair: [30,30,30,255],    body: [30,60,180,255],   legs: [25,25,25,255] },
  Anime:     { face: L, hair: [220,160,0,255],   body: [255,120,0,255],   legs: [25,25,60,255] },
  Gaming:    { face: M, hair: [80,50,20,255],    body: [30,100,180,255],  legs: [20,40,100,255] },
  Películas: { face: L, hair: [30,30,30,255],    body: [80,80,80,255],    legs: [40,40,40,255] },
  Series:    { face: M, hair: [100,70,40,255],   body: [100,120,180,255], legs: [50,50,80,255] },
  YouTubers: { face: L, hair: [240,180,0,255],   body: [220,80,0,255],    legs: [40,40,40,255] },
  Memes:     { face: L, hair: [255,210,0,255],   body: [220,0,0,255],     legs: [0,0,200,255] },
  Minecraft: { face: M, hair: [120,80,40,255],   body: [100,70,30,255],   legs: [60,40,20,255] },
}

const BY_SLUG: Record<string, SkinPalette> = {
  'spider-man':       { face: L, hair: [20,20,20,255],      body: [180,0,0,255],      legs: [0,0,180,255] },
  'iron-man':         { face: [200,30,30,255],  hair: [180,150,0,255],   body: [200,30,30,255],    legs: [150,120,0,255] },
  'captain-america':  { face: L, hair: [180,150,90,255],    body: [30,60,180,255],    legs: [180,0,0,255] },
  'hulk':             { face: [50,180,50,255],  hair: [20,100,20,255],   body: [60,200,60,255],    legs: [30,0,60,255] },
  'thor':             { face: L, hair: [200,170,70,255],    body: [50,50,200,255],    legs: [80,80,80,255] },
  'black-widow':      { face: L, hair: [20,20,20,255],      body: [20,20,20,255],     legs: [15,15,15,255] },
  'venom':            { face: [5,5,5,255],      hair: [5,5,5,255],       body: [5,5,5,255],        legs: [5,5,5,255] },
  'deadpool':         { face: [160,0,0,255],    hair: [140,0,0,255],     body: [180,0,0,255],      legs: [25,25,25,255] },
  'wolverine':        { face: L, hair: [60,30,10,255],      body: [220,180,0,255],    legs: [25,25,25,255] },
  'thanos':           { face: [120,80,120,255], hair: [80,50,80,255],    body: [100,60,100,255],   legs: [70,40,70,255] },
  'doctor-strange':   { face: L, hair: [30,30,30,255],      body: [80,0,0,255],       legs: [20,20,20,255] },
  'black-panther':    { face: [20,10,10,255],   hair: [10,10,10,255],    body: [15,15,15,255],     legs: [10,10,10,255] },
  'wanda':            { face: L, hair: [60,20,20,255],      body: [180,0,0,255],      legs: [100,0,0,255] },
  'loki':             { face: L, hair: [20,20,20,255],      body: [0,80,0,255],       legs: [0,0,0,255] },
  'batman':           { face: L, hair: [20,20,20,255],      body: [25,25,25,255],     legs: [20,20,20,255] },
  'superman':         { face: L, hair: [20,20,20,255],      body: [30,60,180,255],    legs: [180,0,0,255] },
  'wonder-woman':     { face: L, hair: [30,20,20,255],      body: [180,0,0,255],      legs: [0,0,150,255] },
  'joker':            { face: [220,220,210,255],hair: [0,150,0,255],     body: [100,0,100,255],    legs: [70,0,70,255] },
  'flash':            { face: L, hair: [200,150,0,255],     body: [200,30,0,255],     legs: [180,20,0,255] },
  'aquaman':          { face: L, hair: [200,170,50,255],    body: [0,120,100,255],    legs: [0,80,60,255] },
  'naruto':           { face: L, hair: [255,180,0,255],     body: [255,100,0,255],    legs: [0,0,100,255] },
  'goku':             { face: L, hair: [20,20,20,255],      body: [255,140,0,255],    legs: [0,0,80,255] },
  'sasuke':           { face: L, hair: [15,15,15,255],      body: [30,30,100,255],    legs: [20,20,20,255] },
  'luffy':            { face: L, hair: [20,20,20,255],      body: [180,0,0,255],      legs: [40,40,40,255] },
  'zoro':             { face: L, hair: [0,100,0,255],       body: [150,150,150,255],  legs: [20,20,20,255] },
  'tanjiro':          { face: L, hair: [20,20,20,255],      body: [30,60,30,255],     legs: [20,20,20,255] },
  'deku':             { face: L, hair: [0,100,0,255],       body: [0,80,0,255],       legs: [20,20,20,255] },
  'gojo':             { face: L, hair: [220,220,220,255],   body: [20,20,20,255],     legs: [15,15,15,255] },
  'levi-ackerman':    { face: L, hair: [15,15,15,255],      body: [120,120,120,255],  legs: [60,60,60,255] },
  'eren-yeager':      { face: L, hair: [40,30,20,255],      body: [80,70,60,255],     legs: [60,50,40,255] },
  'saitama':          { face: L, hair: [220,220,220,255],   body: [240,200,50,255],   legs: [240,200,50,255] },
  'itachi':           { face: L, hair: [15,15,15,255],      body: [10,10,10,255],     legs: [8,8,8,255] },
  'vegeta':           { face: L, hair: [20,20,20,255],      body: [0,0,100,255],      legs: [0,0,80,255] },
  'master-chief':     { face: [0,100,20,255],   hair: [0,80,15,255],     body: [0,80,15,255],      legs: [0,60,10,255] },
  'mario':            { face: L, hair: [120,50,10,255],     body: [180,0,0,255],      legs: [0,50,180,255] },
  'luigi':            { face: L, hair: [100,50,10,255],     body: [0,130,0,255],      legs: [0,60,150,255] },
  'link-zelda':       { face: L, hair: [200,180,80,255],    body: [0,120,0,255],      legs: [200,180,80,255] },
  'master-sword-link':{ face: L, hair: [200,180,80,255],    body: [0,100,0,255],      legs: [180,160,60,255] },
  'pikachu':          { face: [255,220,0,255],  hair: [240,200,0,255],   body: [255,220,0,255],    legs: [200,150,0,255] },
  'charizard':        { face: [220,100,0,255],  hair: [180,60,0,255],    body: [220,100,0,255],    legs: [180,80,0,255] },
  'sonic':            { face: L, hair: [0,60,200,255],      body: [0,80,220,255],     legs: [20,20,20,255] },
  'kratos':           { face: [200,170,150,255],hair: [200,200,200,255], body: [150,50,30,255],    legs: [80,70,60,255] },
  'geralt':           { face: L, hair: [220,220,220,255],   body: [60,60,60,255],     legs: [50,50,50,255] },
  'jinx-arcane':      { face: L, hair: [0,180,180,255],     body: [100,0,120,255],    legs: [60,0,80,255] },
  'vi-arcane':        { face: L, hair: [220,50,50,255],     body: [30,60,180,255],    legs: [20,20,20,255] },
  'joel-tlou':        { face: M, hair: [80,60,40,255],      body: [80,70,60,255],     legs: [60,50,40,255] },
  'darth-vader':      { face: [15,15,15,255],   hair: [10,10,10,255],    body: [15,15,15,255],     legs: [10,10,10,255] },
  'yoda':             { face: [100,150,80,255], hair: [120,130,100,255], body: [120,110,80,255],   legs: [100,90,60,255] },
  'jack-sparrow':     { face: L, hair: [40,30,20,255],      body: [60,50,40,255],     legs: [40,30,20,255] },
  'shrek':            { face: [100,170,60,255], hair: [70,120,40,255],   body: [120,160,80,255],   legs: [80,100,50,255] },
  'gandalf':          { face: L, hair: [200,200,200,255],   body: [180,180,180,255],  legs: [140,140,140,255] },
  'frodo':            { face: L, hair: [80,60,30,255],      body: [100,80,60,255],    legs: [80,60,40,255] },
  'walter-white':     { face: L, hair: [200,200,200,255],   body: [180,180,180,255],  legs: [100,100,100,255] },
  'eleven':           { face: L, hair: [60,50,40,255],      body: [220,220,240,255],  legs: [100,100,120,255] },
  'wednesday-addams': { face: L, hair: [10,10,10,255],      body: [10,10,10,255],     legs: [8,8,8,255] },
  'lupin':            { face: M, hair: [20,20,20,255],      body: [30,30,30,255],     legs: [20,20,20,255] },
  'dream-smp':        { face: L, hair: [200,200,200,255],   body: [200,200,200,255],  legs: [150,150,150,255] },
  'technoblade':      { face: [220,150,150,255],hair: [180,0,0,255],     body: [200,0,0,255],      legs: [150,0,0,255] },
  'philza':           { face: L, hair: [220,220,220,255],   body: [30,30,30,255],     legs: [20,20,20,255] },
  'ibai':             { face: L, hair: [30,30,30,255],      body: [0,100,200,255],    legs: [20,20,80,255] },
  'rubius':           { face: L, hair: [220,20,20,255],     body: [200,30,30,255],    legs: [20,20,20,255] },
  'among-us-red':     { face: [180,0,0,255],    hair: [150,0,0,255],     body: [180,0,0,255],      legs: [140,0,0,255] },
  'sus-crewmate':     { face: [100,0,180,255],  hair: [80,0,150,255],    body: [100,0,180,255],    legs: [80,0,140,255] },
  'herobrine':        { face: M, hair: [100,70,30,255],     body: [100,70,30,255],    legs: [60,40,20,255] },
  'creeper-humano':   { face: [50,180,50,255],  hair: [30,130,30,255],   body: [60,180,60,255],    legs: [30,100,30,255] },
  'enderman-humano':  { face: [20,0,20,255],    hair: [10,0,10,255],     body: [30,0,30,255],      legs: [20,0,20,255] },
  'notch':            { face: L, hair: [50,30,10,255],      body: [150,120,80,255],   legs: [80,60,30,255] },
  'steve-games':      { face: L, hair: [80,60,40,255],      body: [60,80,140,255],    legs: [40,50,100,255] },
  'denji':            { face: L, hair: [220,180,60,255],    body: [30,30,30,255],     legs: [20,20,20,255] },
  'makima':           { face: L, hair: [160,80,80,255],     body: [20,30,60,255],     legs: [15,20,50,255] },
  'power-csm':        { face: L, hair: [200,50,50,255],     body: [20,20,20,255],     legs: [15,15,15,255] },
  'anya-forger':      { face: L, hair: [180,100,180,255],   body: [210,180,160,255],  legs: [80,60,40,255] },
  'loid-forger':      { face: L, hair: [200,200,180,255],   body: [30,50,30,255],     legs: [20,30,20,255] },
  'sukuna':           { face: [230,180,160,255], hair: [180,30,30,255],   body: [100,20,20,255],    legs: [60,10,10,255] },
  'nezuko':           { face: L, hair: [20,20,20,255],      body: [220,120,180,255],  legs: [20,20,20,255] },
  'zenitsu':          { face: L, hair: [220,200,60,255],    body: [220,180,0,255],    legs: [20,20,20,255] },
  'v-cyberpunk':      { face: L, hair: [20,20,20,255],      body: [40,40,60,255],     legs: [30,30,50,255] },
  'the-tarnished':    { face: L, hair: [60,40,20,255],      body: [100,90,70,255],    legs: [70,60,50,255] },
  'aloy':             { face: L, hair: [180,100,40,255],    body: [80,100,60,255],    legs: [60,70,40,255] },
  '2b-nier':          { face: L, hair: [230,230,230,255],   body: [20,20,20,255],     legs: [15,15,15,255] },
  'gollum':           { face: [180,170,140,255], hair: [100,90,70,255],   body: [140,130,100,255],  legs: [100,90,70,255] },
  'thanos-endgame':   { face: [120,80,120,255],  hair: [80,50,80,255],    body: [80,60,100,255],    legs: [60,40,80,255] },
}

// Per-character extras (face details, chest marks, masks)
const EXTRAS_BY_SLUG: Record<string, SkinExtras> = {
  'naruto':          { whiskers: true },
  'gojo':            { blindfold: true },
  'batman':          { darkMask: true, chestSymbol: 'bat' },
  'wolverine':       { wolverineMask: true },
  'iron-man':        { chestSymbol: 'arc' },
  'captain-america': { chestSymbol: 'star' },
  'doctor-strange':  { chestDot: [220, 180, 20,  255] },
  'flash':           { chestSymbol: 'lightning' },
  'superman':        { chestSymbol: 'S' },
  'herobrine':       { blindfold: true },
  'loki':            { chestDot: [180, 180, 0,   255] },
  'thor':            { thorHelmet: true, chestDot: [200, 200, 50,  255] },
  'wanda':           { chestDot: [220, 50,  50,  255] },
  'black-panther':   { darkMask: true, chestDot: [80, 80, 200, 255] },
  'black-widow':     { darkMask: true, chestDot: [200, 0, 0, 255] },
}

// Slugs that use specialized painters
const SPECIALIZED: Record<string, (p: SkinPalette) => Buffer> = {
  'venom':      makeVenomSkin,
  'joker':      makeJokerSkin,
  'spider-man': makeSpiderManSkin,
  'deadpool':   makeDeadpoolSkin,
}

/** Single entry point: dispatches to specialized painter or generic generator */
export function buildCharacterSkin(slug: string, category: string): Buffer {
  const palette = getPalette(slug, category)
  return SPECIALIZED[slug]?.(palette) ?? makeCharacterSkin(palette, getExtras(slug))
}

export function getPalette(slug: string, category: string): SkinPalette {
  return BY_SLUG[slug] ?? BY_CATEGORY[category] ?? BY_CATEGORY['Series']
}

export function getExtras(slug: string): SkinExtras {
  return EXTRAS_BY_SLUG[slug] ?? {}
}
