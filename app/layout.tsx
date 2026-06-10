import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SkinMe',
  description: 'Crea tu skin de Minecraft desde una foto',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://skinme.app'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
