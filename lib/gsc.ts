// Google Search Console helpers reutilizables en API routes

export async function getGSCToken(): Promise<string> {
  const body = new URLSearchParams({
    client_id:     process.env.GSC_CLIENT_ID!,
    client_secret: process.env.GSC_CLIENT_SECRET!,
    refresh_token: process.env.GSC_REFRESH_TOKEN!,
    grant_type:    'refresh_token',
  })
  const res  = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body })
  const data = await res.json()
  if (!data.access_token) throw new Error(`GSC token error: ${JSON.stringify(data)}`)
  return data.access_token
}

export interface SearchRow { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }

export async function querySearchConsole(
  token: string,
  siteUrl: string,
  body: object
): Promise<SearchRow[]> {
  const enc = encodeURIComponent(siteUrl)
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${enc}/searchAnalytics/query`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    }
  )
  const data = await res.json()
  return data.rows ?? []
}
