import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing | Alpha Screener',
  description: 'Choose your plan. Free tier with 3 signals/day, Pro with unlimited signals and all assets, or Elite with broker integration.',
  openGraph: {
    title: 'Pricing | Alpha Screener',
    description: 'Unlock unlimited trading signals, all assets, and advanced tools.',
    type: 'website',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
