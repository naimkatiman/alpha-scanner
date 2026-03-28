'use client'

import { createContext, useContext } from 'react'
import { useSettingsSync } from '../hooks/useSettingsSync'
import type { SyncStatus, SyncableKey, ServerSettings } from '../hooks/useSettingsSync'

interface SettingsSyncContextValue {
  isLoggedIn: boolean
  syncStatus: SyncStatus
  serverData: ServerSettings | null
  lastSyncTime: number | null
  loaded: boolean
  syncToServer: (key: SyncableKey, value: unknown) => void
  syncBatch: (data: Partial<Record<SyncableKey, unknown>>) => Promise<boolean>
}

const SettingsSyncContext = createContext<SettingsSyncContextValue | null>(null)

export function SettingsSyncProvider({ children }: { children: React.ReactNode }) {
  const sync = useSettingsSync()
  return (
    <SettingsSyncContext.Provider value={sync}>
      {children}
    </SettingsSyncContext.Provider>
  )
}

export function useSettingsSyncContext(): SettingsSyncContextValue {
  const ctx = useContext(SettingsSyncContext)
  if (!ctx) {
    // Return a safe fallback for components outside the provider (guest mode)
    return {
      isLoggedIn: false,
      syncStatus: 'offline',
      serverData: null,
      lastSyncTime: null,
      loaded: true,
      syncToServer: () => {},
      syncBatch: () => Promise.resolve(false),
    }
  }
  return ctx
}
