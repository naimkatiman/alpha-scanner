import type { Metadata } from 'next'
import LeaderboardClient from './LeaderboardClient'

export const metadata: Metadata = {
  title: 'Alpha Scanner Leaderboard',
  description: 'See which trading pairs have the highest signal accuracy',
  openGraph: {
    title: 'Alpha Scanner Leaderboard',
    description: 'See which trading pairs have the highest signal accuracy',
  },
}

export default function LeaderboardPage() {
  return <LeaderboardClient />
}
