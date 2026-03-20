'use client'

import { useState, useRef, useCallback } from 'react'
import { Share2, Copy, Download, Check, X } from 'lucide-react'
import type { SignalDirection } from '../lib/signalEngine'
import { fmt } from '../lib/symbols'

interface ShareSignalProps {
  symbol: string
  direction: SignalDirection
  confidence: number
  mode: string
  risk: string
  entryPrice: number
  technicals: { rsi: boolean; macd: boolean; ema: boolean; sr: boolean; bollinger?: boolean; stochastic?: boolean }
  reason: string
}

export default function ShareSignal({
  symbol,
  direction,
  confidence,
  mode,
  risk,
  entryPrice,
  technicals,
  reason,
}: ShareSignalProps) {
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const dirColor = direction === 'BUY' ? '#10b981' : direction === 'SELL' ? '#f43f5e' : '#a1a1aa'
  const agreeing = Object.values(technicals).filter(Boolean).length
  const total = Object.keys(technicals).length

  const timestamp = new Date().toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const generateText = useCallback(() => {
    const techList = Object.entries(technicals)
      .map(([key, val]) => `${val ? '[+]' : '[-]'} ${key.toUpperCase()}`)
      .join(' ')

    return [
      `ALPHA SCANNER SIGNAL`,
      `--------------------`,
      ``,
      `${symbol} | ${direction} Signal`,
      `Confidence: ${confidence}%`,
      `Entry: ${fmt(symbol, entryPrice)}`,
      `Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`,
      `Risk: ${risk.charAt(0).toUpperCase() + risk.slice(1)}`,
      ``,
      `Indicators (${agreeing}/${total}):`,
      techList,
      ``,
      `${reason}`,
      ``,
      `${timestamp}`,
      `Alpha Scanner`,
    ].join('\n')
  }, [symbol, direction, confidence, entryPrice, mode, risk, technicals, reason, agreeing, total, timestamp])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generateText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = generateText()
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [generateText])

  const handleDownload = useCallback(async () => {
    setDownloading(true)
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const W = 600
      const H = 400
      const DPR = 2
      canvas.width = W * DPR
      canvas.height = H * DPR
      ctx.scale(DPR, DPR)

      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, W, H)

      ctx.fillStyle = dirColor
      ctx.fillRect(0, 0, W, 4)

      ctx.font = 'bold 14px monospace'
      ctx.fillStyle = '#71717a'
      ctx.fillText('ALPHA SCANNER', 24, 36)

      ctx.font = 'bold 28px monospace'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(symbol, 24, 76)

      const dirText = direction
      ctx.font = 'bold 18px monospace'
      const dirWidth = ctx.measureText(dirText).width
      const badgeX = 24 + ctx.measureText(symbol + '  ').width
      ctx.fillStyle = dirColor + '30'
      ctx.fillRect(badgeX - 6, 56, dirWidth + 12, 26)
      ctx.fillStyle = dirColor
      ctx.fillText(dirText, badgeX, 76)

      ctx.font = '13px monospace'
      ctx.fillStyle = '#a1a1aa'
      ctx.fillText(`Confidence: ${confidence}%`, 24, 108)

      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(24, 116, W - 48, 8)
      ctx.fillStyle = dirColor
      ctx.fillRect(24, 116, (W - 48) * (confidence / 100), 8)

      ctx.font = '13px monospace'
      ctx.fillStyle = '#71717a'
      ctx.fillText(`Entry: ${fmt(symbol, entryPrice)}`, 24, 150)
      ctx.fillText(`Mode: ${mode} | Risk: ${risk}`, 24, 170)

      ctx.font = 'bold 11px monospace'
      ctx.fillStyle = '#71717a'
      ctx.fillText(`INDICATORS (${agreeing}/${total})`, 24, 202)

      const techEntries = Object.entries(technicals)
      let tx = 24
      ctx.font = '11px monospace'
      for (const [key, val] of techEntries) {
        const icon = val ? '+' : '-'
        ctx.fillStyle = val ? '#10b981' : '#52525b'
        const label = `[${icon}] ${key.toUpperCase()}`
        ctx.fillText(label, tx, 222)
        tx += ctx.measureText(label).width + 16
      }

      const reasonTrunc = reason.length > 80 ? reason.slice(0, 80) + '...' : reason
      ctx.font = '11px monospace'
      ctx.fillStyle = '#71717a'
      ctx.fillText(reasonTrunc, 24, 256)

      ctx.font = '10px monospace'
      ctx.fillStyle = '#3f3f46'
      ctx.fillText(timestamp, 24, H - 20)
      ctx.fillText('alpha-scanner', W - 120, H - 20)

      const link = document.createElement('a')
      link.download = `alpha-signal-${symbol}-${direction}-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      // silent
    } finally {
      setDownloading(false)
    }
  }, [symbol, direction, confidence, entryPrice, mode, risk, technicals, reason, dirColor, agreeing, total, timestamp])

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${symbol} ${direction} Signal`,
          text: generateText(),
        })
      } catch {
        // User cancelled
      }
    } else {
      handleCopy()
    }
  }, [symbol, direction, generateText, handleCopy])

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="rounded border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-500 transition-all hover:border-emerald-500/40 hover:text-emerald-500 hover:bg-emerald-500/10 active:scale-95 inline-flex items-center gap-1"
        aria-label="Share signal"
      >
        <Share2 size={10} />
        Share
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl border border-white/[0.06] bg-[#111] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <h4 className="text-sm font-semibold text-white">Share Signal</h4>
              <button
                onClick={() => setShowModal(false)}
                className="rounded p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-4">
              <div
                ref={cardRef}
                className="rounded-lg border bg-[#0a0a0a] p-4"
                style={{ borderColor: `${dirColor}40`, borderTopColor: dirColor, borderTopWidth: '3px' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{symbol}</span>
                    <span
                      className="rounded px-2 py-0.5 text-xs font-bold"
                      style={{
                        backgroundColor: `${dirColor}20`,
                        color: dirColor,
                      }}
                    >
                      {direction}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold tabular-nums" style={{ color: dirColor }}>
                    {confidence}%
                  </span>
                </div>
                <div className="space-y-1 text-[10px] text-zinc-500">
                  <p>Entry: {fmt(symbol, entryPrice)}</p>
                  <p>Mode: {mode} | Risk: {risk}</p>
                  <p>Indicators: {agreeing}/{total} agree</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(technicals).map(([key, val]) => (
                    <span
                      key={key}
                      className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase"
                      style={{
                        backgroundColor: val ? '#10b98118' : 'rgba(255,255,255,0.03)',
                        color: val ? '#10b981' : '#52525b',
                      }}
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t border-white/[0.06] px-4 py-3">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-1.5 rounded border border-white/[0.06] bg-white/[0.02] py-2 text-xs font-semibold text-zinc-300 transition-all hover:bg-white/[0.05] active:scale-[0.97]"
              >
                {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Text</>}
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 flex items-center justify-center gap-1.5 rounded border border-white/[0.06] bg-white/[0.02] py-2 text-xs font-semibold text-zinc-300 transition-all hover:bg-white/[0.05] active:scale-[0.97] disabled:opacity-50"
              >
                <Download size={12} />
                {downloading ? 'Generating...' : 'Download PNG'}
              </button>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-500 transition-all hover:bg-emerald-500/20 active:scale-[0.97]"
                >
                  <Share2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
