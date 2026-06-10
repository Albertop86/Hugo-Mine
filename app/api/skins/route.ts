import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export interface CommunitySkin {
  id:        string
  url:       string
  name:      string
  createdAt: number
}

const MAX_SKINS = 50
const USE_BLOB  = !!process.env.BLOB_STORE_ID

// ── Filesystem backend (local dev) ───────────────────────────────────
const DATA_FILE = join(process.cwd(), 'data', 'community-skins.json')
const SKINS_DIR = join(process.cwd(), 'public', 'skins', 'community')

function readSkinsFs(): CommunitySkin[] {
  try {
    if (!existsSync(DATA_FILE)) return []
    return JSON.parse(readFileSync(DATA_FILE, 'utf8')) as CommunitySkin[]
  } catch { return [] }
}

function writeSkinsFs(skins: CommunitySkin[]) {
  mkdirSync(join(process.cwd(), 'data'), { recursive: true })
  writeFileSync(DATA_FILE, JSON.stringify(skins, null, 2), 'utf8')
}

// ── Vercel Blob backend (production) ─────────────────────────────────
const LIST_BLOB_PATH = 'skinme/community-list.json'

async function readSkinsBlob(): Promise<CommunitySkin[]> {
  try {
    const { list } = await import('@vercel/blob')
    const { blobs } = await list({ prefix: LIST_BLOB_PATH })
    if (!blobs.length) return []
    const res = await fetch(blobs[0].url, { cache: 'no-store' })
    return await res.json() as CommunitySkin[]
  } catch { return [] }
}

async function writeSkinsBlob(skins: CommunitySkin[]) {
  const { put } = await import('@vercel/blob')
  await put(LIST_BLOB_PATH, JSON.stringify(skins), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  })
}

async function uploadImageBlob(id: string, buffer: Buffer): Promise<string> {
  const { put } = await import('@vercel/blob')
  const { url } = await put(`skinme/community/${id}.png`, buffer, {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'image/png',
  })
  return url
}

// ── GET /api/skins ────────────────────────────────────────────────────
export async function GET() {
  const skins = USE_BLOB ? await readSkinsBlob() : readSkinsFs()
  return NextResponse.json({ skins })
}

// ── POST /api/skins ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('skin') as File | null
    const name = ((form.get('name') as string | null) ?? 'Anónimo').slice(0, 32).trim() || 'Anónimo'

    if (!file || file.type !== 'image/png' || file.size > 60_000) {
      return NextResponse.json({ error: 'Invalid file' }, { status: 400 })
    }

    const id     = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const buffer = Buffer.from(await file.arrayBuffer())

    let url: string

    if (USE_BLOB) {
      url = await uploadImageBlob(id, buffer)
    } else {
      mkdirSync(SKINS_DIR, { recursive: true })
      writeFileSync(join(SKINS_DIR, `${id}.png`), buffer)
      url = `/skins/community/${id}.png`
    }

    const skin: CommunitySkin = { id, url, name, createdAt: Date.now() }

    const skins = [skin, ...(USE_BLOB ? await readSkinsBlob() : readSkinsFs())].slice(0, MAX_SKINS)
    USE_BLOB ? await writeSkinsBlob(skins) : writeSkinsFs(skins)

    return NextResponse.json({ ok: true, skin })
  } catch (err) {
    console.error('[POST /api/skins]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
