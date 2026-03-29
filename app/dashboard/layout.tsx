import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | Alpha Screener',
  description: 'Real-time trading signals, paper trading, and portfolio analytics for forex, crypto, metals, and indices.',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
