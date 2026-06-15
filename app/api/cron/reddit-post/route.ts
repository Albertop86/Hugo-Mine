import { NextResponse } from 'next/server'
import { getPostForWeek, getWeekNumber } from '@/lib/redditQueue'

async function getRedditToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
  ).toString('base64')

  const body = new URLSearchParams({
    grant_type: 'password',
    username:   process.env.REDDIT_USERNAME!,
    password:   process.env.REDDIT_PASSWORD!,
  })

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent':   'MakeSkins/1.0 (by /u/' + process.env.REDDIT_USERNAME + ')',
    },
    body,
  })

  const data = await res.json()
  if (!data.access_token) throw new Error(`Reddit token error: ${JSON.stringify(data)}`)
  return data.access_token
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Si no hay credenciales de Reddit configuradas, salir limpiamente
  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_USERNAME) {
    return NextResponse.json({ skipped: true, reason: 'Reddit credentials not configured yet' })
  }

  try {
    const post      = getPostForWeek(getWeekNumber())
    const token     = await getRedditToken()

    const body = new URLSearchParams({
      sr:    post.subreddit,
      kind:  post.type === 'link' ? 'link' : 'self',
      title: post.title,
      text:  post.text ?? '',
      url:   post.url ?? '',
      resubmit: 'true',
      nsfw:  'false',
      spoiler: 'false',
    })

    const res = await fetch('https://oauth.reddit.com/api/submit', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':   'MakeSkins/1.0 (by /u/' + process.env.REDDIT_USERNAME + ')',
      },
      body,
    })

    const data = await res.json()
    const url  = data?.jquery?.find?.((j: unknown[]) => Array.isArray(j) && j[3] === 'call' && Array.isArray(j[2]) && String(j[2][0]).includes('reddit.com/r/'))

    return NextResponse.json({
      ok:         true,
      subreddit:  post.subreddit,
      title:      post.title,
      postUrl:    url?.[2]?.[0] ?? 'check Reddit',
    })
  } catch (err) {
    console.error('[reddit-post]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
