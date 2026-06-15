import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MakeSkins',
  description: 'Crea tu skin de Minecraft desde una foto',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://makeskins.com'),
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? '',
  },
  other: {
    'google-adsense-account': 'ca-pub-7226764584055226',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
