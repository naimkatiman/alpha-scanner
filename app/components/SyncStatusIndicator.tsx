'use client'

import { useSettingsSyncContext } from '../providers/SettingsSyncProvider'

const STATUS_CONFIG = {
  synced: { dot: 'bg-emerald-500', label: 'Synced', pulse: false },
  syncing: { dot: 'bg-yellow-400', label: 'Syncing...', pulse: true },
  error: { dot: 'bg-rose-500', label: 'Sync Error', pulse: false },
  offline: { dot: 'bg-zinc-500', label: 'Local Only', pulse: false },
} as const

export default function SyncStatusIndicator() {
  const { isLoggedIn, syncStatus, lastSyncTime } = useSettingsSyncContext()

  // Hidden for guests
  if (!isLoggedIn) return null

  const config = STATUS_CONFIG[syncStatus]
  const lastSync = lastSyncTime
    ? new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'never'

  return (
    <div className="group relative flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-1">
      <div className={`h-1.5 w-1.5 rounded-full ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`} />
      <span className="text-[10px] font-medium text-zinc-500 leading-none">Cloud</span>
      {/* Tooltip */}
      <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-md bg-zinc-900 px-2 py-1 text-[10px] text-zinc-400 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 whitespace-nowrap border border-white/[0.06]">
        {config.label} &middot; Last: {lastSync}
      </div>
    </div>
  )
}
