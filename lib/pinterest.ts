const API = 'https://api.pinterest.com/v5'

interface PinOptions {
  title:       string
  description: string
  imageUrl:    string
  link:        string
}

export async function postPin(opts: PinOptions): Promise<string> {
  const token   = process.env.PINTEREST_ACCESS_TOKEN
  const boardId = process.env.PINTEREST_BOARD_ID

  if (!token || !boardId) throw new Error('PINTEREST_ACCESS_TOKEN or PINTEREST_BOARD_ID not set')

  const res = await fetch(`${API}/pins`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      board_id:     boardId,
      title:        opts.title.slice(0, 100),
      description:  opts.description.slice(0, 500),
      link:         opts.link,
      media_source: {
        source_type: 'image_url',
        url:         opts.imageUrl,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Pinterest API error ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json() as { id: string }
  return data.id
}
