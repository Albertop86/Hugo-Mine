const OWNER  = 'Albertop86'
const REPO   = 'Hugo-Mine'
const BRANCH = 'data'

export const STORAGE_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`

export function storageUrl(path: string): string {
  return `${STORAGE_BASE}/${path}`
}

function getToken(): string {
  const t = process.env.GITHUB_STORAGE_TOKEN
  if (!t) throw new Error('GITHUB_STORAGE_TOKEN not set')
  return t
}

function apiUrl(path: string) {
  return `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`
}

// Write a file to the data branch. Returns the public CDN URL.
export async function storagePut(path: string, content: Buffer | string): Promise<string> {
  const token   = getToken()
  const url     = apiUrl(path)
  const headers = {
    Authorization: `token ${token}`,
    Accept:        'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }

  // Fetch current SHA (required for updates, omitted for creates)
  let sha: string | undefined
  const existing = await fetch(`${url}?ref=${BRANCH}`, { headers })
  if (existing.ok) {
    const data = await existing.json() as { sha: string }
    sha = data.sha
  }

  const encoded = Buffer.isBuffer(content)
    ? content.toString('base64')
    : Buffer.from(content as string, 'utf8').toString('base64')

  const body: Record<string, unknown> = {
    message: `data: ${path}`,
    content: encoded,
    branch:  BRANCH,
  }
  if (sha) body.sha = sha

  const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GitHub write failed (${path}): ${res.status} ${err.slice(0, 200)}`)
  }

  return storageUrl(path)
}

// Read a JSON file from the data branch using the authenticated API (always fresh).
export async function storageGetJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const token = process.env.GITHUB_STORAGE_TOKEN
    if (token) {
      const res = await fetch(`${apiUrl(path)}?ref=${BRANCH}`, {
        headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
      })
      if (!res.ok) return fallback
      const data = await res.json() as { content: string }
      return JSON.parse(Buffer.from(data.content, 'base64').toString('utf8')) as T
    }
    // Dev fallback: read from public CDN (may be cached up to 5 min)
    const res = await fetch(storageUrl(path), { cache: 'no-store' })
    if (!res.ok) return fallback
    return (await res.json()) as T
  } catch {
    return fallback
  }
}

// Check if a file exists in the data branch.
export async function storageExists(path: string): Promise<boolean> {
  try {
    const token = process.env.GITHUB_STORAGE_TOKEN
    if (token) {
      const res = await fetch(`${apiUrl(path)}?ref=${BRANCH}`, {
        headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
      })
      return res.ok
    }
    const res = await fetch(storageUrl(path), { method: 'HEAD', cache: 'no-store' })
    return res.ok
  } catch {
    return false
  }
}
