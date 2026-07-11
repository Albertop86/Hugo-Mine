import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const reqUrl = new URL(req.url)
  if (reqUrl.searchParams.get('key') !== 'ms-pinterest-check-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token   = process.env.PINTEREST_ACCESS_TOKEN
  const boardId = process.env.PINTEREST_BOARD_ID

  if (!token) return NextResponse.json({ error: 'PINTEREST_ACCESS_TOKEN not set' })
  if (!boardId) return NextResponse.json({ error: 'PINTEREST_BOARD_ID not set' })

  // Check user account (requires user_accounts:read)
  const userRes = await fetch('https://api.pinterest.com/v5/user_account', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const userData = await userRes.json()

  // Try to list boards (requires boards:read)
  const boardsRes = await fetch('https://api.pinterest.com/v5/boards?page_size=5', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const boardsData = await boardsRes.json()

  return NextResponse.json({
    tokenPrefix:  token.slice(0, 8) + '...',
    boardId,
    user: { status: userRes.status, data: userRes.ok ? { username: (userData as { username?: string }).username } : userData },
    boards: { status: boardsRes.status, data: boardsRes.ok ? (boardsData as { items?: unknown[] }).items?.slice(0, 3) : boardsData },
  })
}
