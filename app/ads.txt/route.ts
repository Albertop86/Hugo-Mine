import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-static'

export function GET() {
  return new NextResponse(
    'google.com, pub-7226764584055226, DIRECT, f08c47fec0942fa0\n',
    {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400',
      },
    }
  )
}
