'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useCallback, useRef } from 'react'

export interface UserSettingsData {
  watchlist: string[]
  preferredMode: string
  riskProfile: string
  leverage: number
  capital: number
  telegramBotToken: string | null
  telegramChatId: string | null
}

const DEFAULTS: UserSettingsData = {
  watchlist: [],
  preferredMode: 'swing',
  riskProfile: 'balanced',
  leverage: 100,
  capital: 10000,
  telegramBotToken: null,
  telegramChatId: null,
}

export function useUserSettings() {
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated' && !!session?.user
  const [settings, setSettings] = useState<UserSettingsData>(DEFAULTS)
  const [loaded, setLoaded] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load settings on login
  useEffect(() => {
    if (!isLoggedIn) {
      setLoaded(true)
      return
    }

    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSettings(data)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [isLoggedIn])

  // Debounced save to server
  const saveToServer = useCallback(
    (data: Partial<UserSettingsData>) => {
      if (!isLoggedIn) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch(() => {})
      }, 500)
    },
    [isLoggedIn],
  )

  const updateSettings = useCallback(
    (patch: Partial<UserSettingsData>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch }
        saveToServer(patch)
        return next
      })
    },
    [saveToServer],
  )

  return { settings, updateSettings, isLoggedIn, loaded }
}
