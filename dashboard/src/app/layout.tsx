import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CivicShield AI — Crisis Intelligence Dashboard',
  description: 'Real-time smart-city emergency response platform for Pakistani metropolitan environments',
  keywords: 'emergency, crisis, Pakistan, AI, flooding, fire, response',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}
