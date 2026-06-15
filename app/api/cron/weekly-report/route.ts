import { NextResponse } from 'next/server'
import { getGSCToken, querySearchConsole } from '@/lib/gsc'

const SITE      = 'https://makeskins.com/'
const REPORT_TO = 'salvaescalerasperea@gmail.com'

function dateStr(daysAgo: number) {
  return new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10)
}

function formatNum(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n))
}

function arrow(current: number, prev: number) {
  if (prev === 0) return ''
  const pct = ((current - prev) / prev) * 100
  if (pct > 5)  return `<span style="color:#16a34a">▲ ${pct.toFixed(0)}%</span>`
  if (pct < -5) return `<span style="color:#dc2626">▼ ${Math.abs(pct).toFixed(0)}%</span>`
  return `<span style="color:#6b7280">→ ${pct.toFixed(0)}%</span>`
}

export async function GET(req: Request) {
  // Verificar cron secret
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const token = await getGSCToken()

    const [rows7, rows28, rowsPrev28, rowsPages, rowsCountries] = await Promise.all([
      querySearchConsole(token, SITE, {
        startDate: dateStr(7), endDate: dateStr(0),
        dimensions: ['query'], rowLimit: 10,
        orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }],
      }),
      querySearchConsole(token, SITE, {
        startDate: dateStr(28), endDate: dateStr(0),
        dimensions: ['query'], rowLimit: 20,
        orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }],
      }),
      querySearchConsole(token, SITE, {
        startDate: dateStr(56), endDate: dateStr(28),
        dimensions: ['query'], rowLimit: 20,
        orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }],
      }),
      querySearchConsole(token, SITE, {
        startDate: dateStr(7), endDate: dateStr(0),
        dimensions: ['page'], rowLimit: 10,
      }),
      querySearchConsole(token, SITE, {
        startDate: dateStr(7), endDate: dateStr(0),
        dimensions: ['country'], rowLimit: 5,
      }),
    ])

    // Totales
    const total7  = rows7.reduce((a, r)  => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }), { clicks: 0, impressions: 0 })
    const total28 = rows28.reduce((a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }), { clicks: 0, impressions: 0 })
    const totalP  = rowsPrev28.reduce((a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }), { clicks: 0, impressions: 0 })

    // Oportunidades (pos 5-20, alta impresión, CTR bajo)
    const opps = rows28
      .filter(r => r.position >= 5 && r.position <= 20 && r.impressions >= 5)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 5)

    const weekOf = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })

    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MakeSkins — Reporte semanal ${weekOf}</title>
</head>
<body style="font-family:system-ui,sans-serif;background:#f9fafb;margin:0;padding:24px">
<div style="max-width:600px;margin:0 auto">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#2d5016,#5d7c15);border-radius:16px;padding:28px;margin-bottom:20px;text-align:center">
    <div style="font-size:32px;margin-bottom:8px">🟩</div>
    <h1 style="color:white;margin:0;font-size:20px">MakeSkins</h1>
    <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">Reporte semanal — ${weekOf}</p>
  </div>

  <!-- KPIs -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
    <div style="background:white;border-radius:12px;padding:20px;border:1px solid #e5e7eb">
      <p style="margin:0 0 4px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase">Clics (7 días)</p>
      <p style="margin:0;font-size:28px;font-weight:800;color:#111">${formatNum(total7.clicks)}</p>
    </div>
    <div style="background:white;border-radius:12px;padding:20px;border:1px solid #e5e7eb">
      <p style="margin:0 0 4px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase">Impresiones (7 días)</p>
      <p style="margin:0;font-size:28px;font-weight:800;color:#111">${formatNum(total7.impressions)}</p>
    </div>
    <div style="background:white;border-radius:12px;padding:20px;border:1px solid #e5e7eb">
      <p style="margin:0 0 4px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase">Clics (28 días)</p>
      <p style="margin:0;font-size:24px;font-weight:800;color:#111">${formatNum(total28.clicks)} ${arrow(total28.clicks, totalP.clicks)}</p>
    </div>
    <div style="background:white;border-radius:12px;padding:20px;border:1px solid #e5e7eb">
      <p style="margin:0 0 4px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase">Impresiones (28 días)</p>
      <p style="margin:0;font-size:24px;font-weight:800;color:#111">${formatNum(total28.impressions)} ${arrow(total28.impressions, totalP.impressions)}</p>
    </div>
  </div>

  <!-- Top keywords -->
  ${rows7.length ? `
  <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #e5e7eb">
    <h2 style="margin:0 0 16px;font-size:15px;color:#111">🔍 Top búsquedas esta semana</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <tr style="color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase">
        <td style="padding:4px 0">Keyword</td>
        <td style="padding:4px 8px;text-align:right">Clics</td>
        <td style="padding:4px 8px;text-align:right">Imp.</td>
        <td style="padding:4px 0;text-align:right">Pos.</td>
      </tr>
      ${rows7.map(r => `
      <tr style="border-top:1px solid #f3f4f6">
        <td style="padding:8px 0;color:#111;font-weight:500">${r.keys[0]}</td>
        <td style="padding:8px;text-align:right;color:#16a34a;font-weight:700">${r.clicks}</td>
        <td style="padding:8px;text-align:right;color:#6b7280">${r.impressions}</td>
        <td style="padding:8px 0;text-align:right;color:${r.position <= 3 ? '#16a34a' : r.position <= 10 ? '#ca8a04' : '#6b7280'}">#${r.position.toFixed(0)}</td>
      </tr>`).join('')}
    </table>
  </div>` : `
  <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #e5e7eb;text-align:center;color:#6b7280">
    <p style="margin:0">📊 Sin datos todavía — Google necesita 2-4 semanas para indexar el sitio nuevo</p>
  </div>`}

  <!-- Oportunidades -->
  ${opps.length ? `
  <div style="background:#fefce8;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #fde68a">
    <h2 style="margin:0 0 12px;font-size:15px;color:#111">⭐ Oportunidades (posición 5-20)</h2>
    <p style="margin:0 0 12px;font-size:12px;color:#6b7280">Estos keywords están cerca del top 5 — merecen más contenido</p>
    ${opps.map(r => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid #fde68a;font-size:13px">
      <span style="color:#111;font-weight:500">${r.keys[0]}</span>
      <span style="color:#ca8a04;font-weight:700">Pos. #${r.position.toFixed(0)} · ${r.impressions} imp.</span>
    </div>`).join('')}
  </div>` : ''}

  <!-- Páginas -->
  ${rowsPages.length ? `
  <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #e5e7eb">
    <h2 style="margin:0 0 16px;font-size:15px;color:#111">📄 Páginas más visitadas</h2>
    ${rowsPages.map(r => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid #f3f4f6;font-size:12px">
      <span style="color:#6b7280">${r.keys[0].replace('https://makeskins.com', '') || '/'}</span>
      <span style="color:#111;font-weight:600">${r.clicks} clics</span>
    </div>`).join('')}
  </div>` : ''}

  <!-- Países -->
  ${rowsCountries.length ? `
  <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #e5e7eb">
    <h2 style="margin:0 0 16px;font-size:15px;color:#111">🌍 Top países</h2>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${rowsCountries.map(r => `<span style="background:#f3f4f6;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600">${r.keys[0].toUpperCase()} · ${r.clicks} clics</span>`).join('')}
    </div>
  </div>` : ''}

  <!-- Footer -->
  <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:24px">
    Reporte automático de MakeSkins · <a href="https://makeskins.com" style="color:#5d7c15">makeskins.com</a>
  </p>
</div>
</body></html>`

    // Enviar email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'MakeSkins Report <report@makeskins.com>',
        to:      [REPORT_TO],
        subject: `📊 MakeSkins — Semana del ${weekOf} · ${formatNum(total7.clicks)} clics`,
        html,
      }),
    })

    const emailData = await emailRes.json()

    return NextResponse.json({
      ok:          true,
      emailId:     emailData.id,
      stats:       { clicks7: total7.clicks, impressions7: total7.impressions },
      opportunities: opps.length,
    })
  } catch (err) {
    console.error('[weekly-report]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
