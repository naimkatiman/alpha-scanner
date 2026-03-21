import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '../../lib/prisma'
import StrategyShareClient from './StrategyShareClient'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const strategy = await prisma.strategyTemplate.findFirst({
    where: { OR: [{ shareSlug: slug }, { id: slug }], isPublic: true },
  })
  if (!strategy) return { title: 'Strategy Not Found — Alpha Scanner' }

  const config = JSON.parse(strategy.config)
  const description = strategy.description ?? `${config.mode} | ${config.riskProfile} risk | 1:${config.leverage} leverage`

  return {
    title: `${strategy.name} — Alpha Scanner`,
    description,
    openGraph: {
      title: strategy.name,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: strategy.name,
      description,
    },
  }
}

export default async function StrategySharePage({ params }: Props) {
  const { slug } = await params
  const strategy = await prisma.strategyTemplate.findFirst({
    where: { OR: [{ shareSlug: slug }, { id: slug }], isPublic: true },
  })

  if (!strategy) notFound()

  const serialized = {
    ...strategy,
    config: JSON.parse(strategy.config),
    createdAt: strategy.createdAt.toISOString(),
    updatedAt: strategy.updatedAt.toISOString(),
  }

  return <StrategyShareClient strategy={serialized} />
}
