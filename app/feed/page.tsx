import type { Metadata } from 'next'
import FeedClient from './FeedClient'

export const metadata: Metadata = {
  title: 'Alpha Scanner Signal Feed',
  description: 'Live trading signals across all markets',
}

export default function FeedPage() {
  return <FeedClient />
}
