import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ServiceWorkerRegistrar } from './components/ServiceWorkerRegistrar'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Alpha Scanner | Multi-Asset Trading Signal Dashboard',
  description:
    'Real-time trading signals for Gold, Silver, Bitcoin, Ethereum, Forex and more. Multi-asset opportunity scanner with technical analysis, support/resistance detection, and risk management.',
  keywords: [
    'trading signals',
    'forex scanner',
    'crypto signals',
    'gold trading',
    'technical analysis',
    'XAUUSD',
    'BTCUSD',
    'trading dashboard',
    'signal scanner',
    'risk management',
  ],
  authors: [{ name: 'Alpha Scanner' }],
  metadataBase: new URL('https://alpha-scanner.vercel.app'),
  openGraph: {
    title: 'Alpha Scanner | Multi-Asset Trading Signal Dashboard',
    description:
      'Real-time trading signals for Gold, Silver, Bitcoin, Ethereum, Forex and more. Multi-asset opportunity scanner with TP/SL, paper trading, and broker integration.',
    type: 'website',
    url: 'https://alpha-scanner.vercel.app',
    siteName: 'Alpha Scanner',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Alpha Scanner — Trading Signal Dashboard',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alpha Scanner | Multi-Asset Trading Signal Dashboard',
    description:
      'Real-time trading signals for Gold, Silver, Bitcoin, Forex and more.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192' }],
  },
  manifest: '/manifest.json',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Alpha Scanner',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="bg-background text-white antialiased">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
