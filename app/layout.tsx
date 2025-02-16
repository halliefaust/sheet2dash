import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dashify',
  description: 'Instantly create dynamic dashboard from sheets',
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
