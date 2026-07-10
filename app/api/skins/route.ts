import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { storagePut, storageGetJson } from '@/lib/storage'

export interface CommunitySkin {
  id:        string
  url:       string
  name:      string
  createdAt: number
}

const MAX_SKINS   = 50
const USE_GITHUB  = !!process.env.GITHUB_STORAGE_TOKEN
const LIST_PATH   = 'skinme/community-list.json'

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

// ── GitHub storage backend (production) ──────────────────────────────
async function readSkinsGitHub(): Promise<CommunitySkin[]> {
  return storageGetJson<CommunitySkin[]>(LIST_PATH, [])
}

async function writeSkinsGitHub(skins: CommunitySkin[]) {
  await storagePut(LIST_PATH, JSON.stringify(skins))
}

async function uploadImageGitHub(id: string, buffer: Buffer): Promise<string> {
  return storagePut(`skinme/community/${id}.png`, buffer)
}

// ── GET /api/skins ────────────────────────────────────────────────────
export async function GET() {
  const skins = USE_GITHUB ? await readSkinsGitHub() : readSkinsFs()
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

    if (USE_GITHUB) {
      url = await uploadImageGitHub(id, buffer)
    } else {
      mkdirSync(SKINS_DIR, { recursive: true })
      writeFileSync(join(SKINS_DIR, `${id}.png`), buffer)
      url = `/skins/community/${id}.png`
    }

    const skin: CommunitySkin = { id, url, name, createdAt: Date.now() }

    const skins = [skin, ...(USE_GITHUB ? await readSkinsGitHub() : readSkinsFs())].slice(0, MAX_SKINS)
    USE_GITHUB ? await writeSkinsGitHub(skins) : writeSkinsFs(skins)

    return NextResponse.json({ ok: true, skin })
  } catch (err) {
    console.error('[POST /api/skins]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// ── PUT /api/skins — update image + name for an existing entry ────────
export async function PUT(req: NextRequest) {
  try {
    const form = await req.formData()
    const id   = (form.get('id') as string | null)?.trim()
    const file = form.get('skin') as File | null
    const name = ((form.get('name') as string | null) ?? '').slice(0, 32).trim() || 'Anónimo'

    if (!id || !file || file.type !== 'image/png' || file.size > 60_000) {
      return NextResponse.json({ error: 'Invalid' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    if (USE_GITHUB) {
      await storagePut(`skinme/community/${id}.png`, buffer)
      const skins = await readSkinsGitHub()
      const idx = skins.findIndex(s => s.id === id)
      if (idx >= 0) { skins[idx].name = name; await writeSkinsGitHub(skins) }
    } else {
      mkdirSync(SKINS_DIR, { recursive: true })
      writeFileSync(join(SKINS_DIR, `${id}.png`), buffer)
      const skins = readSkinsFs()
      const idx = skins.findIndex(s => s.id === id)
      if (idx >= 0) { skins[idx].name = name; writeSkinsFs(skins) }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PUT /api/skins]', err)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
