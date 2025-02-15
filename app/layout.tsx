import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sheet2Dash',
  description: 'Created with v0',
  icons: {
    icon: '/favicon.ico',
  },
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
