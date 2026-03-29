import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Signal Accuracy | Alpha Screener',
  description: 'Track real-time accuracy of trading signals across all symbols with win rates, hit rates, and outcome breakdowns.',
}

export default function AccuracyLayout({ children }: { children: React.ReactNode }) {
  return children
}
