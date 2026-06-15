import { deflateSync } from 'zlib'

// Pure Node.js Minecraft skin generator — no browser APIs, no external packages

type C = [number, number, number, number] // RGBA

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
  ihdr[8] = 8; ihdr[9] = 6 // 8-bit RGBA
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

// ── Skin painter ─────────────────────────────────────────────────────────────

export type SkinPalette = { face: C; hair: C; body: C; legs: C }

export function makeCharacterSkin(p: SkinPalette): Buffer {
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
  const bodyS = dim(body, 0.78)
  const legsS = dim(legs, 0.78)
  const eyes: C  = [35, 25, 15, 255]
  const white: C = [225, 222, 215, 255]

  // HEAD (UV 0-31, 0-15)
  fill(0,  8, 8, 8, dim(hair, 0.82)) // right side
  fill(8,  0, 8, 8, hair)             // top
  fill(8,  8, 8, 8, face)             // FRONT ← visible
  fill(16, 8, 8, 8, dim(hair, 0.88)) // left side
  fill(24, 8, 8, 8, dim(hair, 0.72)) // back
  fill(16, 0, 8, 8, dim(face, 0.88)) // bottom
  // Eyes: row 10, two 2x2 white squares then dark pupils
  fill(9,  10, 2, 2, white); fill(13, 10, 2, 2, white)
  set(10, 10, eyes); set(10, 11, eyes)
  set(14, 10, eyes); set(14, 11, eyes)

  // BODY
  fill(20, 16,  8,  4, body);  fill(28, 16,  8,  4, bodyS)
  fill(16, 20,  4, 12, bodyS); fill(20, 20,  8, 12, body)
  fill(28, 20,  4, 12, bodyS); fill(32, 20,  8, 12, bodyS)

  // RIGHT LEG
  fill(0,  16, 4, 4, legs);  fill(4, 16, 4, 4, legsS)
  fill(0,  20, 4, 12, legsS); fill(4, 20, 4, 12, legs) // front ← visible
  fill(8,  20, 4, 12, legsS); fill(12, 20, 4, 12, legsS)

  // LEFT LEG (new format, bottom half)
  fill(16, 48, 4, 4, legs);  fill(20, 48, 4, 4, legsS)
  fill(16, 52, 4, 12, legsS); fill(20, 52, 4, 12, legs) // front ← visible
  fill(24, 52, 4, 12, legsS); fill(28, 52, 4, 12, legsS)

  // RIGHT ARM
  fill(40, 16, 4, 4, body);  fill(44, 16, 4, 4, bodyS)
  fill(40, 20, 4, 12, bodyS); fill(44, 20, 4, 12, body) // front ← visible
  fill(48, 20, 4, 12, bodyS); fill(52, 20, 4, 12, bodyS)

  // LEFT ARM (new format)
  fill(32, 48, 4, 4, body);  fill(36, 48, 4, 4, bodyS)
  fill(32, 52, 4, 12, bodyS); fill(36, 52, 4, 12, body) // front ← visible
  fill(40, 52, 4, 12, bodyS); fill(44, 52, 4, 12, bodyS)

  return toPNG(px, W, H)
}

// ── Character colour palettes ─────────────────────────────────────────────────

const L: C = [255, 213, 170, 255] // light skin
const M: C = [220, 175, 130, 255] // medium skin

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
  'deadpool':         { face: [160,0,0,255],    hair: [140,0,0,255],     body: [180,0,0,255],      legs: [25,25,25,255] },
  'wolverine':        { face: L, hair: [60,30,10,255],      body: [220,180,0,255],    legs: [25,25,25,255] },
  'thanos':           { face: [120,80,120,255], hair: [80,50,80,255],    body: [100,60,100,255],   legs: [70,40,70,255] },
  'doctor-strange':   { face: L, hair: [30,30,30,255],      body: [80,0,0,255],       legs: [20,20,20,255] },
  'black-panther':    { face: [40,20,20,255],   hair: [10,10,10,255],    body: [15,15,15,255],     legs: [10,10,10,255] },
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
}

export function getPalette(slug: string, category: string): SkinPalette {
  return BY_SLUG[slug] ?? BY_CATEGORY[category] ?? BY_CATEGORY['Series']
}
