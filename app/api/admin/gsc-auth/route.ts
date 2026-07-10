import { NextResponse } from 'next/server'

const REDIRECT_URI = 'https://makeskins.com/api/admin/gsc-auth'
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'

export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret')
  if (!process.env.GSC_ADMIN_NONCE || secret !== process.env.GSC_ADMIN_NONCE) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const code = new URL(req.url).searchParams.get('code')

  // Step 2: exchange code for tokens
  if (code) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GSC_CLIENT_ID!,
        client_secret: process.env.GSC_CLIENT_SECRET!,
        redirect_uri:  `${REDIRECT_URI}?secret=${process.env.GSC_ADMIN_NONCE}`,
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
<p>Ejecuta estos comandos en la terminal del proyecto:</p>
<pre style="background:#1e1e1e;color:#4ade80;padding:16px;border-radius:8px;white-space:pre-wrap">npx vercel env rm GSC_REFRESH_TOKEN production --yes
</pre>
<p>Luego ejecuta: <code>npx vercel env add GSC_REFRESH_TOKEN production</code><br>
y cuando pregunte el valor, pega esto:</p>
<pre style="background:#1e1e1e;color:#fbbf24;padding:16px;border-radius:8px;word-break:break-all">${data.refresh_token}</pre>
<p style="color:#6b7280">Después de actualizar, haz un commit vacío para forzar redeploy:<br>
<code>git commit --allow-empty -m "chore: refresh GSC token" && git push</code></p>
</body></html>`, { headers: { 'Content-Type': 'text/html' } })
  }

  // Step 1: redirect to Google OAuth
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id:     process.env.GSC_CLIENT_ID!,
      redirect_uri:  `${REDIRECT_URI}?secret=${process.env.GSC_ADMIN_NONCE}`,
      response_type: 'code',
      scope:         SCOPE,
      access_type:   'offline',
      prompt:        'consent',
    })

  return NextResponse.redirect(authUrl)
}
