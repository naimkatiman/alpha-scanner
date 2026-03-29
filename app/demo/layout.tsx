import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Demo | Alpha Screener',
  description: 'Try Alpha Screener trading signals without signing up. See real-time BUY/SELL signals for Gold, Bitcoin, Forex, and more.',
  openGraph: {
    title: 'Live Demo | Alpha Screener',
    description: 'Try Alpha Screener trading signals without signing up.',
    type: 'website',
  },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
