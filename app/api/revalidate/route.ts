import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path') ?? '/[locale]/skin-del-dia'

  revalidatePath(path, 'page')
  return NextResponse.json({ revalidated: true, path })
}
