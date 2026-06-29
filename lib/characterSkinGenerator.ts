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

/** Dream (dream-smp): iconic white smiley mask + green hoodie */
export function makeDreamSkin(_p: SkinPalette): Buffer {
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

  const white:  C = [248, 248, 245, 255]
  const whiteD: C = [210, 210, 208, 255]
  const black:  C = [15,  15,  15,  255]
  const blond:  C = [210, 185, 100, 255]
  const green:  C = [100, 185, 65,  255]
  const greenD: C = [70,  140, 45,  255]
  const gray:   C = [200, 200, 200, 255]
  const grayD:  C = [150, 150, 150, 255]

  // HEAD: blond hair sides/top/back
  for (let dy = 0; dy < 8; dy++) fill(0,  8+dy, 8, 1, dim(blond, dy%2===0 ? 0.82 : 0.75))
  fill(8, 0, 8, 8, blond)
  for (let dy = 0; dy < 8; dy++) fill(16, 8+dy, 8, 1, dim(blond, dy%2===0 ? 0.88 : 0.80))
  fill(24, 8, 8, 8, dim(blond, 0.65))
  fill(16, 0, 8, 8, dim(blond, 0.75))

  // FACE: solid white mask — Dream's signature
  fill(8, 8, 8, 8, white)
  fill(8, 8, 8, 1, dim(blond, 0.85))      // hairline
  // Black oval eyes (simple, no whites)
  fill(9,  10, 2, 2, black)
  fill(13, 10, 2, 2, black)
  // Curved smile: corners + bottom arc
  set(9,  13, black); set(14, 13, black)
  fill(10, 14, 4, 1, black)
  // Chin shadow
  fill(8,  15, 8, 1, whiteD)

  // BODY: green hoodie
  fill(20, 16, 8, 4, green);    fill(28, 16, 8, 4, greenD)
  fill(16, 20, 4, 12, greenD);  fill(20, 20, 8, 12, green)
  fill(28, 20, 4, 12, greenD);  fill(32, 20, 8, 12, greenD)
  fill(20, 30, 8, 2, dim(green, 0.55))     // belt/waistband

  // ARMS: green hoodie sleeves
  fill(40, 16, 4, 4, green);   fill(44, 16, 4, 4, greenD)
  fill(40, 20, 4, 10, greenD); fill(44, 20, 4, 10, green)
  fill(48, 20, 4, 10, greenD); fill(52, 20, 4, 10, greenD)
  fill(40, 30, 4, 2, white);   fill(44, 30, 4, 2, whiteD)  // white wrist cuffs
  fill(32, 48, 4, 4, green);   fill(36, 48, 4, 4, greenD)
  fill(32, 52, 4, 10, greenD); fill(36, 52, 4, 10, green)
  fill(40, 52, 4, 10, greenD); fill(44, 52, 4, 10, greenD)
  fill(32, 62, 4, 2, white);   fill(36, 62, 4, 2, whiteD)

  // LEGS: light gray
  fill(0,  16, 4, 4, gray);    fill(4,  16, 4, 4, grayD)
  fill(0,  20, 4, 12, grayD);  fill(4,  20, 4, 12, gray)
  fill(8,  20, 4, 12, grayD);  fill(12, 20, 4, 12, grayD)
  fill(16, 48, 4, 4, gray);    fill(20, 48, 4, 4, grayD)
  fill(16, 52, 4, 12, grayD);  fill(20, 52, 4, 12, gray)
  fill(24, 52, 4, 12, grayD);  fill(28, 52, 4, 12, grayD)

  // OVERLAY
  const gO  = dim(green, 0.85); const gOS = dim(green, 0.65)
  const gyO = dim(gray,  0.85); const gyS = dim(gray,  0.65)
  fill(20, 32, 8, 4, gO);   fill(28, 32, 8, 4, gOS)
  fill(16, 36, 4, 12, gOS); fill(20, 36, 8, 12, gO)
  fill(28, 36, 4, 12, gOS); fill(32, 36, 8, 12, gOS)
  fill(44, 32, 4, 4, gO);   fill(48, 32, 4, 4, gOS)
  fill(40, 36, 4, 12, gOS); fill(44, 36, 4, 12, gO)
  fill(48, 36, 4, 12, gOS); fill(52, 36, 4, 12, gOS)
  fill(52, 48, 4, 4, gO);   fill(56, 48, 4, 4, gOS)
  fill(48, 52, 4, 12, gOS); fill(52, 52, 4, 12, gO)
  fill(56, 52, 4, 12, gOS); fill(60, 52, 4, 12, gOS)
  fill(4,  32, 4, 4, gyO);  fill(8,  32, 4, 4, gyS)
  fill(0,  36, 4, 12, gyS); fill(4,  36, 4, 12, gyO)
  fill(8,  36, 4, 12, gyS); fill(12, 36, 4, 12, gyS)
  fill(4,  48, 4, 4, gyO);  fill(8,  48, 4, 4, gyS)
  fill(0,  52, 4, 12, gyS); fill(4,  52, 4, 12, gyO)
  fill(8,  52, 4, 12, gyS); fill(12, 52, 4, 12, gyS)

  return toPNG(px, W, H)
}

/** Technoblade: pig face with crown + maroon royal cape */
export function makeTechnobladeSkin(_p: SkinPalette): Buffer {
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

  const pig:   C = [235, 155, 155, 255]
  const pigD:  C = [195, 115, 115, 255]
  const pigE:  C = [210, 100, 100, 255]  // ear/snout
  const snout: C = [215, 130, 130, 255]
  const nostrl:C = [160,  70,  70, 255]
  const maroon:C = [140,  10,  10, 255]
  const maroonD:C= [100,   5,   5, 255]
  const gold:  C = [220, 185,  20, 255]
  const goldD: C = [170, 135,  10, 255]
  const black: C = [15,  15,  15,  255]
  const gray:  C = [60,  60,  60,  255]

  // HEAD sides: pig pink
  for (let dy = 0; dy < 8; dy++) fill(0,  8+dy, 8, 1, dim(pig, dy%2===0 ? 0.85 : 0.78))
  fill(8, 0, 8, 8, pig)
  for (let dy = 0; dy < 8; dy++) fill(16, 8+dy, 8, 1, dim(pig, dy%2===0 ? 0.90 : 0.83))
  fill(24, 8, 8, 8, dim(pig, 0.65))
  fill(16, 0, 8, 8, dim(pig, 0.80))
  // CROWN: gold zigzag on head top (UV 8,0–15,7)
  fill(8, 0, 8, 1, gold)           // base row of crown
  set(8, 1, goldD); set(10, 1, goldD); set(12, 1, goldD); set(14, 1, goldD)  // points
  set(9, 2, gold);  set(11, 2, gold);  set(13, 2, gold);  set(15, 2, gold)   // gaps
  // Pig ears on head right side (UV 0,8–7,15)
  fill(0, 8, 3, 3, pigE)           // left ear
  fill(5, 8, 3, 3, pigE)           // right ear

  // FACE: pig pink
  fill(8, 8, 8, 8, pig)
  fill(8, 8, 8, 1, pigE)           // top band (ears connect)
  // Eyes: small dark eyes
  fill(9,  10, 2, 1, black)
  fill(13, 10, 2, 1, black)
  // Pig snout: oval at nose area
  fill(10, 12, 5, 2, snout)
  set(11, 12, nostrl); set(13, 12, nostrl)  // nostrils
  // Chin
  fill(8, 15, 8, 1, pigD)

  // BODY: maroon royal cape
  fill(20, 16, 8, 4, maroon);   fill(28, 16, 8, 4, maroonD)
  fill(16, 20, 4, 12, maroonD); fill(20, 20, 8, 12, maroon)
  fill(28, 20, 4, 12, maroonD); fill(32, 20, 8, 12, maroonD)
  // Gold trim on chest
  fill(20, 20, 8, 1, gold)
  fill(20, 31, 8, 1, gold)
  set(20, 21, gold); set(27, 21, gold)   // vertical gold trim
  set(20, 30, gold); set(27, 30, gold)

  // ARMS: maroon
  fill(40, 16, 4, 4, maroon);   fill(44, 16, 4, 4, maroonD)
  fill(40, 20, 4, 12, maroonD); fill(44, 20, 4, 12, maroon)
  fill(48, 20, 4, 12, maroonD); fill(52, 20, 4, 12, maroonD)
  fill(32, 48, 4, 4, maroon);   fill(36, 48, 4, 4, maroonD)
  fill(32, 52, 4, 12, maroonD); fill(36, 52, 4, 12, maroon)
  fill(40, 52, 4, 12, maroonD); fill(44, 52, 4, 12, maroonD)

  // LEGS: dark gray
  fill(0,  16, 4, 4, gray);    fill(4,  16, 4, 4, dim(gray,0.8))
  fill(0,  20, 4, 12, dim(gray,0.8)); fill(4,  20, 4, 12, gray)
  fill(8,  20, 4, 12, dim(gray,0.8)); fill(12, 20, 4, 12, dim(gray,0.8))
  fill(16, 48, 4, 4, gray);    fill(20, 48, 4, 4, dim(gray,0.8))
  fill(16, 52, 4, 12, dim(gray,0.8)); fill(20, 52, 4, 12, gray)
  fill(24, 52, 4, 12, dim(gray,0.8)); fill(28, 52, 4, 12, dim(gray,0.8))

  // OVERLAY
  const mO = dim(maroon, 0.87); const mOS = dim(maroon, 0.67)
  const gO = dim(gray,   0.87); const gOS = dim(gray,   0.67)
  fill(20, 32, 8, 4, mO);   fill(28, 32, 8, 4, mOS)
  fill(16, 36, 4, 12, mOS); fill(20, 36, 8, 12, mO)
  fill(28, 36, 4, 12, mOS); fill(32, 36, 8, 12, mOS)
  fill(44, 32, 4, 4, mO);   fill(48, 32, 4, 4, mOS)
  fill(40, 36, 4, 12, mOS); fill(44, 36, 4, 12, mO)
  fill(48, 36, 4, 12, mOS); fill(52, 36, 4, 12, mOS)
  fill(52, 48, 4, 4, mO);   fill(56, 48, 4, 4, mOS)
  fill(48, 52, 4, 12, mOS); fill(52, 52, 4, 12, mO)
  fill(56, 52, 4, 12, mOS); fill(60, 52, 4, 12, mOS)
  fill(4,  32, 4, 4, gO);   fill(8,  32, 4, 4, gOS)
  fill(0,  36, 4, 12, gOS); fill(4,  36, 4, 12, gO)
  fill(8,  36, 4, 12, gOS); fill(12, 36, 4, 12, gOS)
  fill(4,  48, 4, 4, gO);   fill(8,  48, 4, 4, gOS)
  fill(0,  52, 4, 12, gOS); fill(4,  52, 4, 12, gO)
  fill(8,  52, 4, 12, gOS); fill(12, 52, 4, 12, gOS)

  return toPNG(px, W, H)
}

/** Philza: angel — black robes with white wing overlay on arms */
export function makePhilzaSkin(_p: SkinPalette): Buffer {
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

  const skin:  C = [255, 215, 172, 255]
  const hair:  C = [220, 220, 220, 255]
  const hairD: C = [170, 170, 170, 255]
  const black: C = [18,  18,  18,  255]
  const blackL:C = [38,  38,  38,  255]
  const eyeW:  C = [230, 228, 220, 255]
  const eyeD:  C = [30,  20,  10,  255]
  const brow   = dim(hairD, 0.7)
  const wing:  C = [245, 245, 242, 255]
  const wingD: C = [195, 195, 193, 255]

  // HEAD: white/silver hair
  for (let dy = 0; dy < 8; dy++) fill(0,  8+dy, 8, 1, dim(hair, dy%2===0 ? 0.82 : 0.75))
  fill(8, 0, 8, 8, hair)
  for (let dy = 0; dy < 8; dy++) fill(16, 8+dy, 8, 1, dim(hair, dy%2===0 ? 0.88 : 0.82))
  fill(24, 8, 8, 8, dim(hair, 0.65))
  fill(16, 0, 8, 8, dim(hair, 0.80))

  // FACE: normal skin
  fill(8, 8, 8, 8, skin)
  fill(8, 8, 8, 1, hair)
  fill(9, 9, 3, 1, brow); fill(13, 9, 3, 1, brow)
  fill(9,  10, 2, 2, eyeW); fill(13, 10, 2, 2, eyeW)
  set(10, 10, eyeD); set(10, 11, eyeD); set(14, 10, eyeD); set(14, 11, eyeD)
  set(12, 12, dim(skin, 0.82))
  fill(10, 14, 4, 1, dim(skin, 0.60))
  fill(8,  15, 8, 1, dim(skin, 0.90))

  // BODY: black robes
  fill(20, 16, 8, 4, black);    fill(28, 16, 8, 4, blackL)
  fill(16, 20, 4, 12, blackL);  fill(20, 20, 8, 12, black)
  fill(28, 20, 4, 12, blackL);  fill(32, 20, 8, 12, blackL)
  fill(20, 30, 8, 2, dim(black, 0.6))

  // ARMS: black sleeves (wing whites are on OVERLAY)
  fill(40, 16, 4, 4, black);   fill(44, 16, 4, 4, blackL)
  fill(40, 20, 4, 12, blackL); fill(44, 20, 4, 12, black)
  fill(48, 20, 4, 12, blackL); fill(52, 20, 4, 12, blackL)
  fill(32, 48, 4, 4, black);   fill(36, 48, 4, 4, blackL)
  fill(32, 52, 4, 12, blackL); fill(36, 52, 4, 12, black)
  fill(40, 52, 4, 12, blackL); fill(44, 52, 4, 12, blackL)

  // LEGS: black
  fill(0,  16, 4, 4, black);   fill(4,  16, 4, 4, blackL)
  fill(0,  20, 4, 12, blackL); fill(4,  20, 4, 12, black)
  fill(8,  20, 4, 12, blackL); fill(12, 20, 4, 12, blackL)
  fill(16, 48, 4, 4, black);   fill(20, 48, 4, 4, blackL)
  fill(16, 52, 4, 12, blackL); fill(20, 52, 4, 12, black)
  fill(24, 52, 4, 12, blackL); fill(28, 52, 4, 12, blackL)

  // OVERLAY: white wing feathers on arm outer faces
  // Right arm overlay (UV 44,32 – outer face at 44,36)
  fill(44, 32, 4, 4, wing)                          // shoulder feathers
  fill(44, 36, 4, 12, wing);  fill(48, 36, 4, 12, wingD) // wing primary
  fill(52, 36, 4, 12, wingD)
  // Left arm overlay (UV 52,48 — outer at 52,52)
  fill(52, 48, 4, 4, wing)
  fill(52, 52, 4, 12, wing);  fill(56, 52, 4, 12, wingD)
  fill(60, 52, 4, 12, wingD)
  // Body overlay: black robe
  const bkO = dim(black, 0.87)
  fill(20, 32, 8, 4, bkO);   fill(28, 32, 8, 4, dim(black,0.67))
  fill(16, 36, 4, 12, dim(black,0.67)); fill(20, 36, 8, 12, bkO)
  fill(28, 36, 4, 12, dim(black,0.67)); fill(32, 36, 8, 12, dim(black,0.67))
  // Left sleeve overlay: also black (under wing)
  fill(40, 36, 4, 12, dim(black,0.67)); fill(44, 36, 4, 12, bkO)   // overwritten by wing above
  // Legs overlay
  const lgO = dim(black, 0.87)
  fill(4,  32, 4, 4, lgO);   fill(8,  32, 4, 4, dim(black,0.67))
  fill(0,  36, 4, 12, dim(black,0.67)); fill(4,  36, 4, 12, lgO)
  fill(8,  36, 4, 12, dim(black,0.67)); fill(12, 36, 4, 12, dim(black,0.67))
  fill(4,  48, 4, 4, lgO);   fill(8,  48, 4, 4, dim(black,0.67))
  fill(0,  52, 4, 12, dim(black,0.67)); fill(4,  52, 4, 12, lgO)
  fill(8,  52, 4, 12, dim(black,0.67)); fill(12, 52, 4, 12, dim(black,0.67))

  return toPNG(px, W, H)
}

/** Among Us crewmate — full suit, large dark visor with blue reflection, backpack */
export function makeAmongUsSkin(p: SkinPalette): Buffer {
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

  const suit:  C = p.body
  const suitD: C = dim(suit, 0.78)
  const suitDD:C = dim(suit, 0.60)
  const visor: C = [10, 15, 35, 255]      // near-black dark blue visor
  const shine: C = [130, 210, 255, 255]   // bright blue visor reflection
  const shineD:C = [60, 150, 220, 255]    // softer reflection

  // HEAD: all suit color (no hair — it's a space suit helmet)
  fill(8,  0, 8, 8, suit)                // head top
  fill(0,  8, 8, 8, suitD)              // head right side
  fill(16, 8, 8, 8, suitD)              // head left side
  fill(24, 8, 8, 8, suitDD)             // head back
  fill(16, 0, 8, 8, suitD)              // head bottom

  // FACE FRONT (8,8)–(15,15): suit base with large dark visor
  fill(8, 8, 8, 8, suit)                // suit helmet base
  // Visor — large oval covering most of face
  fill(9,  9, 6, 5, visor)              // visor main body (6 wide × 5 tall)
  fill(10, 14, 4, 1, visor)             // visor bottom rounded
  // Light blue shine (top-left corner of visor)
  set(10, 10, shine)
  set(11, 10, shineD)
  set(10, 11, shineD)

  // BODY
  fill(20, 16, 8, 4, suit);   fill(28, 16, 8, 4, suitD)    // top / bottom
  fill(16, 20, 4, 12, suitD); fill(20, 20, 8, 12, suit)    // right side / front
  fill(28, 20, 4, 12, suitD)                                // left side
  // BACKPACK on body back — distinctive Among Us oxygen tank
  fill(32, 20, 8, 12, suitDD)                               // back base
  fill(33, 22, 4, 7, dim(suit, 0.45))                       // tank cylinder (darker)
  fill(34, 21, 2, 1, dim(suit, 0.35))                       // tank top cap
  fill(34, 29, 2, 1, dim(suit, 0.35))                       // tank bottom cap

  // ARMS (slightly shorter-looking by making them fully suit-colored)
  fill(44, 16, 4, 4, suit);   fill(40, 16, 4, 4, suitD)
  fill(44, 20, 4, 12, suit);  fill(40, 20, 4, 12, suitD)
  fill(48, 20, 4, 12, suitD); fill(52, 20, 4, 12, suitDD)
  fill(36, 48, 4, 4, suit);   fill(32, 48, 4, 4, suitD)
  fill(36, 52, 4, 12, suit);  fill(32, 52, 4, 12, suitD)
  fill(40, 52, 4, 12, suitD); fill(44, 52, 4, 12, suitDD)

  // LEGS
  fill(4,  16, 4, 4, suit);   fill(0,  16, 4, 4, suitD)
  fill(4,  20, 4, 12, suit);  fill(0,  20, 4, 12, suitD)
  fill(8,  20, 4, 12, suitD); fill(12, 20, 4, 12, suitDD)
  fill(20, 48, 4, 4, suit);   fill(16, 48, 4, 4, suitD)
  fill(20, 52, 4, 12, suit);  fill(16, 52, 4, 12, suitD)
  fill(24, 52, 4, 12, suitD); fill(28, 52, 4, 12, suitDD)

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
  'ibai':             { face: L, hair: [20,20,20,255],      body: [0,130,230,255],    legs: [15,15,80,255] },
  'rubius':           { face: L, hair: [210,30,30,255],     body: [190,25,25,255],    legs: [15,15,15,255] },
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
  'ibai':            { chestDot: [140, 200, 255, 255] },  // Twitch purple-blue mic
  'rubius':          { chestDot: [255, 80,  80,  255] },  // red accent
}

// Slugs that use specialized painters
const SPECIALIZED: Record<string, (p: SkinPalette) => Buffer> = {
  'venom':        makeVenomSkin,
  'joker':        makeJokerSkin,
  'spider-man':   makeSpiderManSkin,
  'deadpool':     makeDeadpoolSkin,
  'dream-smp':    makeDreamSkin,
  'technoblade':  makeTechnobladeSkin,
  'philza':       makePhilzaSkin,
  'among-us-red': makeAmongUsSkin,
  'sus-crewmate': makeAmongUsSkin,
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
