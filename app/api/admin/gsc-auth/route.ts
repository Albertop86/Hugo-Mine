import { NextResponse } from 'next/server'

const REDIRECT_URI = 'https://makeskins.com/api/admin/gsc-auth'
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'

export async function GET(req: Request) {
  const url    = new URL(req.url)
  const secret = url.searchParams.get('secret')
  const code   = url.searchParams.get('code')
  const state  = url.searchParams.get('state')

  const nonce = process.env.GSC_ADMIN_NONCE
  if (!nonce) return new NextResponse('GSC_ADMIN_NONCE not set', { status: 500 })

  // Step 2: Google redirects back here with ?code=...&state=NONCE
  if (code) {
    if (state !== nonce) return new NextResponse('Invalid state', { status: 403 })

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GSC_CLIENT_ID!,
        client_secret: process.env.GSC_CLIENT_SECRET!,
        redirect_uri:  REDIRECT_URI,
        grant_type:    'authorization_code',
      }),
    })
    const data = await res.json()

    if (!data.refresh_token) {
      return new NextResponse(
        `<h2>Error — no refresh_token</h2><pre>${JSON.stringify(data, null, 2)}</pre>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    return new NextResponse(`
<!DOCTYPE html><html><body style="font-family:monospace;padding:24px;background:#f0fdf4">
<h2>✅ Nuevo GSC_REFRESH_TOKEN obtenido</h2>
<p>Díselo a Claude para que lo actualice en Vercel, o ejecuta tú:</p>
<pre style="background:#1e1e1e;color:#fbbf24;padding:16px;border-radius:8px;word-break:break-all">${data.refresh_token}</pre>
</body></html>`, { headers: { 'Content-Type': 'text/html' } })
  }

  // Step 1: require nonce to start the flow
  if (secret !== nonce) return new NextResponse('Unauthorized', { status: 401 })

  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
      client_id:     process.env.GSC_CLIENT_ID!,
      redirect_uri:  REDIRECT_URI,
      response_type: 'code',
      scope:         SCOPE,
      access_type:   'offline',
      prompt:        'consent',
      state:         nonce,
    })

  return NextResponse.redirect(authUrl)
}
