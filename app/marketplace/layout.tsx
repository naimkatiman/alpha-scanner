import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Strategy Marketplace | Alpha Screener',
  description: 'Browse, buy, and sell trading strategies with verified backtest results. Community-driven strategy marketplace.',
}

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return children
}
