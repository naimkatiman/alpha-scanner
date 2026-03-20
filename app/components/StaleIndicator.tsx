'use client'

import React from 'react'

interface StaleIndicatorProps {
  rateLimited: boolean
  staleSince?: number | null
}

export function StaleIndicator({ rateLimited, staleSince }: StaleIndicatorProps) {
  if (!rateLimited) return null

  const staleMinutes = staleSince
    ? Math.round((Date.now() - staleSince) / 60_000)
    : null

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-yellow-400">
      <span aria-hidden="true">⚠</span>
      CACHED
      {staleMinutes !== null && staleMinutes > 0 && (
        <span className="text-yellow-500/60">{staleMinutes}m ago</span>
      )}
    </span>
  )
}

export default StaleIndicator
