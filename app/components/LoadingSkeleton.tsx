'use client'

import React from 'react'

/** Single skeleton line */
export function SkeletonText({ width = '100%', height = '14px' }: { width?: string; height?: string }) {
  return <div className="skeleton" style={{ width, height }} />
}

/** Multiple skeleton lines */
export function SkeletonLines({ lines = 3, gap = '8px' }: { lines?: number; gap?: string }) {
  return (
    <div className="flex flex-col" style={{ gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonText key={i} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  )
}

/** Card-shaped skeleton placeholder */
export function SkeletonCard({ height = '200px' }: { height?: string }) {
  return (
    <div
      className="rounded-xl border border-white/[0.06] bg-[#111] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
      style={{ minHeight: height }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="skeleton h-5 w-5 rounded-full" />
        <SkeletonText width="120px" height="16px" />
      </div>
      <SkeletonLines lines={4} />
    </div>
  )
}

/** Table skeleton with rows */
export function SkeletonTable({ rows = 4, cols = 3 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      {/* Header */}
      <div className="mb-4 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonText key={i} width={`${100 / cols}%`} height="12px" />
        ))}
      </div>
      {/* Rows */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonText key={c} width={`${100 / cols}%`} height="14px" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Inline skeleton for panels that are lazy-loaded */
export function PanelSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111] p-5 animate-pulse shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-[#222]" />
        <div className="h-4 w-24 rounded bg-[#222]" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-full rounded bg-[#1a1a1a]" />
        <div className="h-3 w-4/5 rounded bg-[#1a1a1a]" />
        <div className="h-3 w-3/5 rounded bg-[#1a1a1a]" />
      </div>
    </div>
  )
}
