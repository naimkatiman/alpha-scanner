'use client'

import { useState, useEffect } from 'react'
import { Webhook, Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

interface WebhookConfig {
  id: string
  url: string
  enabled: boolean
  createdAt: string
}

interface WebhookLogEntry {
  id: string
  symbol: string
  direction: string
  statusCode: number | null
  success: boolean
  attempt: number
  error: string | null
  createdAt: string
  webhook: { url: string }
}

export default function WebhookSettings() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
  const [logs, setLogs] = useState<WebhookLogEntry[]>([])
  const [newUrl, setNewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  useEffect(() => {
    if (!expanded) return
    fetch('/api/webhook/configure')
      .then((r) => (r.ok ? r.json() : []))
      .then(setWebhooks)
      .catch(() => {})
  }, [expanded])

  function loadLogs() {
    setShowLogs(!showLogs)
    if (!showLogs) {
      fetch('/api/webhook/logs?limit=20')
        .then((r) => (r.ok ? r.json() : []))
        .then(setLogs)
        .catch(() => {})
    }
  }

  async function addWebhook() {
    if (!newUrl.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/webhook/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl.trim() }),
      })
      if (res.ok) {
        const wh = await res.json()
        setWebhooks((prev) => [wh, ...prev])
        setNewUrl('')
      }
    } catch {}
    setLoading(false)
  }

  async function toggleWebhook(id: string, enabled: boolean) {
    try {
      await fetch('/api/webhook/configure', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !enabled }),
      })
      setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, enabled: !enabled } : w)))
    } catch {}
  }

  async function deleteWebhook(id: string) {
    try {
      await fetch('/api/webhook/configure', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setWebhooks((prev) => prev.filter((w) => w.id !== id))
    } catch {}
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Webhook size={14} className="text-emerald-500" />
          <span className="text-xs font-semibold text-zinc-300">Webhooks</span>
          {webhooks.filter((w) => w.enabled).length > 0 && (
            <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
              {webhooks.filter((w) => w.enabled).length} active
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
      </button>

      {expanded && (
        <div className="border-t border-white/[0.06] px-4 py-3 space-y-3">
          {/* Add webhook */}
          <div className="flex gap-2">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://your-bot.com/webhook"
              className="flex-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none"
            />
            <button
              onClick={addWebhook}
              disabled={loading || !newUrl.trim()}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Webhook list */}
          {webhooks.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-2">No webhooks configured</p>
          ) : (
            <div className="space-y-1.5">
              {webhooks.map((wh) => (
                <div
                  key={wh.id}
                  className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                >
                  <button onClick={() => toggleWebhook(wh.id, wh.enabled)} className="shrink-0">
                    {wh.enabled ? (
                      <ToggleRight size={16} className="text-emerald-500" />
                    ) : (
                      <ToggleLeft size={16} className="text-zinc-600" />
                    )}
                  </button>
                  <span className={`flex-1 text-[11px] truncate ${wh.enabled ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {wh.url}
                  </span>
                  <button
                    onClick={() => deleteWebhook(wh.id)}
                    className="shrink-0 text-zinc-600 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Delivery logs toggle */}
          <button
            onClick={loadLogs}
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ExternalLink size={10} />
            {showLogs ? 'Hide delivery logs' : 'Show delivery logs'}
          </button>

          {showLogs && (
            <div className="max-h-40 overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <p className="text-[10px] text-zinc-600 text-center py-2">No deliveries yet</p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-2 rounded border border-white/[0.04] bg-white/[0.01] px-2 py-1.5"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${log.success ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    />
                    <span className="text-[10px] text-zinc-400 font-mono">{log.symbol}</span>
                    <span className={`text-[10px] ${log.direction === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {log.direction}
                    </span>
                    <span className="text-[10px] text-zinc-600 ml-auto">
                      {log.statusCode || log.error?.slice(0, 20)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          <p className="text-[9px] text-zinc-700 leading-relaxed">
            Webhooks receive POST requests with JSON payload on every new signal. Retries 3x with exponential backoff.
          </p>
        </div>
      )}
    </div>
  )
}
