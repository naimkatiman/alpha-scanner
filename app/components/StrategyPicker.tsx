'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import type { TradingMode } from './ModeSelector'
import type { RiskProfile } from './RiskSelector'

export interface StrategyConfig {
  symbols: string[]
  mode: TradingMode
  riskProfile: RiskProfile
  leverage: number
  capital: number
}

export interface Strategy {
  id: string
  name: string
  description?: string | null
  config: StrategyConfig
  isPublic: boolean
  shareSlug?: string | null
  userId?: string | null
  createdAt: string
  updatedAt: string
}

interface StrategyPickerProps {
  currentSymbol: string
  currentMode: TradingMode
  currentRisk: RiskProfile
  currentLeverage: number
  currentCapital: number
  onApply: (config: StrategyConfig) => void
}

const STORAGE_KEY = 'alpha_strategies_guest'
const GUEST_MAX = 5

function loadGuestStrategies(): Strategy[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveGuestStrategies(list: Strategy[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export default function StrategyPicker({
  currentSymbol,
  currentMode,
  currentRisk,
  currentLeverage,
  currentCapital,
  onApply,
}: StrategyPickerProps) {
  const { data: session } = useSession()
  const isAuthed = !!session?.user

  const [open, setOpen] = useState(false)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [publicPresets, setPublicPresets] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(false)

  const [saveName, setSaveName] = useState('')
  const [saveDesc, setSaveDesc] = useState('')
  const [savePublic, setSavePublic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchStrategies = useCallback(async () => {
    if (!isAuthed) {
      setStrategies(loadGuestStrategies())
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/strategies')
      const data = await res.json()
      setStrategies(data.userStrategies ?? [])
      setPublicPresets(data.publicStrategies ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [isAuthed])

  useEffect(() => {
    if (open) void fetchStrategies()
  }, [open, fetchStrategies])

  const handleSave = async () => {
    if (!saveName.trim()) {
      setSaveError('Name is required')
      return
    }
    setSaving(true)
    setSaveError('')

    const config: StrategyConfig = {
      symbols: [currentSymbol],
      mode: currentMode,
      riskProfile: currentRisk,
      leverage: currentLeverage,
      capital: currentCapital,
    }

    if (!isAuthed) {
      const current = loadGuestStrategies()
      if (current.length >= GUEST_MAX) {
        setSaveError(`Guest limit is ${GUEST_MAX} strategies. Sign in to save more.`)
        setSaving(false)
        return
      }
      const newStrategy: Strategy = {
        id: Math.random().toString(36).slice(2),
        name: saveName.trim(),
        description: saveDesc.trim() || null,
        config,
        isPublic: false,
        shareSlug: null,
        userId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const updated = [...current, newStrategy]
      saveGuestStrategies(updated)
      setStrategies(updated)
      setSaveName('')
      setSaveDesc('')
      setShowSaveForm(false)
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName.trim(),
          description: saveDesc.trim() || undefined,
          config,
          isPublic: savePublic,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setSaveError(err.error ?? 'Failed to save')
        return
      }
      const saved = await res.json()
      setStrategies((prev) => [saved, ...prev])
      setSaveName('')
      setSaveDesc('')
      setSavePublic(false)
      setShowSaveForm(false)
    } catch {
      setSaveError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!isAuthed) {
      const updated = loadGuestStrategies().filter((s) => s.id !== id)
      saveGuestStrategies(updated)
      setStrategies(updated)
      setDeleteConfirm(null)
      return
    }
    try {
      await fetch(`/api/strategies/${id}`, { method: 'DELETE' })
      setStrategies((prev) => prev.filter((s) => s.id !== id))
    } catch {
      // silent
    }
    setDeleteConfirm(null)
  }

  const handleShare = (strategy: Strategy) => {
    if (!strategy.shareSlug) return
    const url = `${window.location.origin}/strategy/${strategy.shareSlug}`
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(strategy.id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const handleApply = (strategy: Strategy) => {
    onApply(strategy.config)
    setOpen(false)
  }

  const allStrategies = [...strategies, ...publicPresets]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-emerald-500/20 bg-[#0a0a0a] px-3 py-2 text-sm text-zinc-300 hover:border-emerald-500/40 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Strategy Templates
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="mt-1 rounded-lg border border-white/[0.06] bg-[#0a0a0a] shadow-2xl overflow-hidden">
          {/* Save current config */}
          <div className="border-b border-white/[0.06] p-3">
            {!showSaveForm ? (
              <button
                onClick={() => setShowSaveForm(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-md border border-emerald-500/30 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Save current config
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  autoFocus
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Strategy name..."
                  className="w-full rounded-md bg-white/[0.05] border border-white/[0.08] px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-emerald-500/40"
                />
                <input
                  value={saveDesc}
                  onChange={(e) => setSaveDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full rounded-md bg-white/[0.05] border border-white/[0.08] px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-emerald-500/40"
                />
                {isAuthed && (
                  <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={savePublic}
                      onChange={(e) => setSavePublic(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    Make public (shareable link)
                  </label>
                )}
                {saveError && <p className="text-xs text-rose-400">{saveError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setShowSaveForm(false); setSaveError('') }}
                    className="rounded-md border border-white/[0.06] px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Strategy list */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-xs text-zinc-600">Loading...</div>
            ) : allStrategies.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-600">No strategies saved yet</div>
            ) : (
              allStrategies.map((s) => {
                const isPreset = !s.userId
                return (
                  <div key={s.id} className="group border-b border-white/[0.04] last:border-0 px-3 py-2.5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium text-white truncate">{s.name}</span>
                          {isPreset && (
                            <span className="text-[10px] px-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">preset</span>
                          )}
                          {s.isPublic && !isPreset && (
                            <span className="text-[10px] px-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">public</span>
                          )}
                        </div>
                        {s.description && (
                          <p className="mt-0.5 text-[11px] text-zinc-600 line-clamp-1">{s.description}</p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="text-[10px] px-1 rounded bg-white/[0.05] text-zinc-500">{s.config.mode}</span>
                          <span className="text-[10px] px-1 rounded bg-white/[0.05] text-zinc-500">{s.config.riskProfile}</span>
                          <span className="text-[10px] px-1 rounded bg-white/[0.05] text-zinc-500">1:{s.config.leverage}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Apply */}
                        <button
                          onClick={() => handleApply(s)}
                          className="rounded px-2 py-1 text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          Apply
                        </button>

                        {/* Share (public only) */}
                        {s.isPublic && s.shareSlug && (
                          <button
                            onClick={() => handleShare(s)}
                            title="Copy share link"
                            className="rounded p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
                          >
                            {copied === s.id ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                            )}
                          </button>
                        )}

                        {/* Delete (non-preset only) */}
                        {!isPreset && (
                          deleteConfirm === s.id ? (
                            <button
                              onClick={() => void handleDelete(s.id)}
                              className="rounded px-1.5 py-1 text-[10px] text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-colors"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(s.id)}
                              title="Delete strategy"
                              className="rounded p-1 text-zinc-600 hover:text-rose-400 transition-colors"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {!isAuthed && (
            <div className="border-t border-white/[0.06] px-3 py-2 text-[11px] text-zinc-600">
              <a href="/auth/signin" className="text-emerald-400 hover:underline">Sign in</a> to sync strategies across devices
            </div>
          )}
        </div>
      )}
    </div>
  )
}
