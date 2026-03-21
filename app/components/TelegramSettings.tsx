'use client'

import { useState } from 'react'
import type { TelegramConfig } from '../hooks/useTelegram'

const ACCENT = '#0088cc' // Telegram blue

interface TelegramSettingsProps {
  config: TelegramConfig
  sending: boolean
  testStatus: 'idle' | 'testing' | 'success' | 'error'
  lastError: string | null
  onUpdateConfig: (updates: Partial<TelegramConfig>) => void
  onTestConnection: () => Promise<boolean>
}

export default function TelegramSettings({
  config,
  sending,
  testStatus,
  lastError,
  onUpdateConfig,
  onTestConnection,
}: TelegramSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [tokenInput, setTokenInput] = useState(config.botToken)
  const [chatIdInput, setChatIdInput] = useState(config.chatId)
  const [showToken, setShowToken] = useState(false)

  const handleSave = () => {
    onUpdateConfig({
      botToken: tokenInput.trim(),
      chatId: chatIdInput.trim(),
    })
  }

  const handleTest = async () => {
    // Save first, then test
    onUpdateConfig({
      botToken: tokenInput.trim(),
      chatId: chatIdInput.trim(),
    })
    // Small delay to let state propagate
    await new Promise((r) => setTimeout(r, 100))
    await onTestConnection()
  }

  const canTest = tokenInput.trim().length > 0 && chatIdInput.trim().length > 0

  return (
    <div
      className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden"
      style={{ borderTopColor: ACCENT, borderTopWidth: '2px' }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 flex-shrink-0"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          <span className="text-xs font-semibold text-white">Telegram Alerts</span>
          {config.connected && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" title="Connected" />
          )}
          {config.autoSend && config.connected && (
            <span className="text-[8px] text-zinc-500 bg-white/[0.03] rounded px-1 py-0.5">AUTO</span>
          )}
        </div>
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          className={`text-zinc-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-white/[0.06] px-3 py-3 space-y-3">
          {/* Instructions */}
          <p className="text-[8px] text-zinc-700">
            1. Message <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-[#0088cc] hover:underline">@BotFather</a> → /newbot → copy token
            <br />
            2. Get your chat ID from <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-[#0088cc] hover:underline">@userinfobot</a>
          </p>

          {/* Bot Token */}
          <div>
            <label className="block text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Bot Token</label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="123456789:ABCdef..."
                className="w-full rounded border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 pr-12 text-xs text-white placeholder-gray-700 outline-none focus:border-[#0088cc]/50"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600 hover:text-zinc-400 px-1.5 py-0.5"
              >
                {showToken ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Chat ID */}
          <div>
            <label className="block text-[9px] uppercase tracking-widest text-zinc-600 mb-1">Chat ID</label>
            <input
              type="text"
              value={chatIdInput}
              onChange={(e) => setChatIdInput(e.target.value)}
              placeholder="-1001234567890"
              className="w-full rounded border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-xs text-white placeholder-gray-700 outline-none focus:border-[#0088cc]/50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="rounded border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[9px] font-semibold text-zinc-400 transition-colors hover:text-white hover:border-gray-600"
            >
              Save
            </button>
            <button
              onClick={handleTest}
              disabled={!canTest || testStatus === 'testing'}
              className="rounded border px-3 py-1.5 text-[9px] font-semibold transition-all disabled:opacity-40"
              style={{
                borderColor: `${ACCENT}50`,
                backgroundColor: `${ACCENT}15`,
                color: ACCENT,
              }}
            >
              {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {/* Test Status */}
          {testStatus === 'success' && (
            <div className="text-[9px] text-[#10b981] flex items-center gap-1">
              Connected! Test message sent.
            </div>
          )}
          {testStatus === 'error' && lastError && (
            <div className="text-[9px] text-[#f43f5e] flex items-center gap-1">
              {lastError}
            </div>
          )}
          {sending && (
            <div className="text-[9px] text-zinc-500 animate-pulse">Sending alert...</div>
          )}

          {/* Auto-send toggle */}
          <div className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.03] px-3 py-2">
            <div>
              <span className="text-xs text-white">Auto-send Signals</span>
              <p className="text-[8px] text-zinc-600 mt-0.5">
                Send alerts when signal direction changes for watched symbols
              </p>
            </div>
            <button
              onClick={() => onUpdateConfig({ autoSend: !config.autoSend })}
              className="rounded px-2 py-1 text-[9px] font-bold transition-colors"
              style={{
                backgroundColor: config.autoSend ? '#10b98115' : '#1a1a1a',
                color: config.autoSend ? '#10b981' : '#6b7280',
                borderWidth: 1,
                borderColor: config.autoSend ? '#10b98130' : '#222',
              }}
            >
              {config.autoSend ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-1.5 text-[8px] text-zinc-700">
            <span
              className="h-1 w-1 rounded-full"
              style={{ backgroundColor: config.connected ? '#10b981' : '#4b5563' }}
            />
            {config.connected ? 'Bot connected' : 'Not connected'}
            {config.autoSend && !config.connected && (
              <span className="text-[#f59e0b]">— test connection to enable auto-send</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
