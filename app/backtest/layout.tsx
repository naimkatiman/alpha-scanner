import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Backtest Engine | Alpha Screener',
  description: 'Replay trading signals against historical data to evaluate strategy performance before going live.',
}

export default function BacktestLayout({ children }: { children: React.ReactNode }) {
  return children
}
