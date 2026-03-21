import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const signals = await prisma.signalRecord.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      symbol: true,
      direction: true,
      entryPrice: true,
      tp1: true,
      sl: true,
      confidence: true,
      outcome: true,
      createdAt: true,
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://alpha-scanner.vercel.app'

  const items = signals
    .map((s) => {
      const title = `[${s.symbol}] ${s.direction} Signal`
      const description = [
        `Direction: ${s.direction}`,
        `Entry Price: ${s.entryPrice}`,
        `Take Profit (TP1): ${s.tp1}`,
        `Stop Loss: ${s.sl}`,
        `Confidence: ${s.confidence}%`,
        `Outcome: ${s.outcome}`,
      ].join(' | ')
      const pubDate = new Date(s.createdAt).toUTCString()
      const guid = `${baseUrl}/feed#${s.id}`

      return `    <item>
      <title><![CDATA[${title}]]></title>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${guid}</guid>
    </item>`
    })
    .join('\n')

  const now = new Date().toUTCString()
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Alpha Scanner Signals</title>
    <link>${baseUrl}/feed</link>
    <description>Live BUY/SELL trading signals across all markets from Alpha Scanner</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
    },
  })
}
