'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  loadRules,
  saveRules,
  evaluateRule,
  extractValue,
  type AlertRule,
} from '../lib/alertRules'
import type { AllIndicators } from '../lib/technicalAnalysis'
import { useSettingsSyncContext } from '../providers/SettingsSyncProvider'

const COOLDOWN_MS = 5 * 60_000   // 5 minutes
const EVAL_INTERVAL_MS = 30_000  // 30 seconds

export interface TriggeredRule {
  ruleId: string
  ruleName: string
  symbol: string
  triggeredAt: number
}

interface UseCustomAlertsReturn {
  rules: AlertRule[]
  triggeredRules: TriggeredRule[]
  addRule: (rule: Omit<AlertRule, 'id' | 'createdAt'>) => void
  updateRule: (id: string, updates: Partial<AlertRule>) => void
  deleteRule: (id: string) => void
  clearTriggered: () => void
}

export function useCustomAlerts(
  selectedSymbol: string,
  currentPrice: number,
): UseCustomAlertsReturn {
  const { isLoggedIn, serverData, loaded: syncLoaded, syncToServer } = useSettingsSyncContext()
  const [rules, setRules] = useState<AlertRule[]>([])
  const [triggeredRules, setTriggeredRules] = useState<TriggeredRule[]>([])
  const prevValuesRef = useRef<Record<string, Record<string, number>>>({})
  const hydratedRef = useRef(false)

  // Load rules on mount — prefer server data for logged-in users
  useEffect(() => {
    if (!syncLoaded) return
    if (hydratedRef.current) return
    hydratedRef.current = true

    const localRules = loadRules()
    if (isLoggedIn && serverData && (serverData.alertRules as unknown[]).length > 0) {
      setRules(serverData.alertRules as AlertRule[])
    } else {
      setRules(localRules)
    }
  }, [syncLoaded, isLoggedIn, serverData])

  const syncRules = useCallback((updated: AlertRule[]) => {
    if (isLoggedIn) syncToServer('alertRules', updated)
  }, [isLoggedIn, syncToServer])

  const addRule = useCallback(
    (rule: Omit<AlertRule, 'id' | 'createdAt'>) => {
      const newRule: AlertRule = {
        ...rule,
        id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: Date.now(),
      }
      setRules((prev) => {
        const updated = [...prev, newRule]
        saveRules(updated)
        syncRules(updated)
        return updated
      })
    },
    [syncRules],
  )

  const updateRule = useCallback(
    (id: string, updates: Partial<AlertRule>) => {
      setRules((prev) => {
        const updated = prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
        saveRules(updated)
        syncRules(updated)
        return updated
      })
    },
    [syncRules],
  )

  const deleteRule = useCallback(
    (id: string) => {
      setRules((prev) => {
        const updated = prev.filter((r) => r.id !== id)
        saveRules(updated)
        syncRules(updated)
        return updated
      })
    },
    [syncRules],
  )

  const clearTriggered = useCallback(() => {
    setTriggeredRules([])
  }, [])

  // Evaluate rules every 30 seconds
  useEffect(() => {
    const enabledRules = rules.filter((r) => r.enabled)
    if (enabledRules.length === 0) return

    const evaluate = async () => {
      // Collect unique symbols
      const symbolsToCheck = new Set(enabledRules.map((r) => r.symbol))

      for (const sym of symbolsToCheck) {
        try {
          const res = await fetch(
            `/api/indicators?symbol=${encodeURIComponent(sym)}`,
          )
          if (!res.ok) continue
          const data = await res.json()
          const indicators: AllIndicators = data.indicators
          const price: number = data.price ?? currentPrice

          const rulesForSymbol = enabledRules.filter((r) => r.symbol === sym)

          for (const rule of rulesForSymbol) {
            const now = Date.now()
            if (rule.lastTriggered && now - rule.lastTriggered < COOLDOWN_MS) continue

            const prevVals = prevValuesRef.current[rule.id] ?? {}
            const triggered = evaluateRule(rule, indicators, price, prevVals)

            // Update prev values for cross-detection
            const newPrevVals: Record<string, number> = {}
            for (const cond of rule.conditions) {
              newPrevVals[cond.id] = extractValue(cond.indicator, indicators, price)
            }
            prevValuesRef.current[rule.id] = newPrevVals

            if (triggered) {
              setRules((prev) =>
                prev.map((r) =>
                  r.id === rule.id ? { ...r, lastTriggered: now } : r,
                ),
              )

              const triggerEntry: TriggeredRule = {
                ruleId: rule.id,
                ruleName: rule.name,
                symbol: rule.symbol,
                triggeredAt: now,
              }

              setTriggeredRules((prev) => [triggerEntry, ...prev].slice(0, 20))

              if (
                typeof window !== 'undefined' &&
                'Notification' in window &&
                Notification.permission === 'granted'
              ) {
                new Notification(`Alert: ${rule.name}`, {
                  body: `Rule triggered for ${rule.symbol}`,
                  icon: '/favicon.ico',
                })
              }
            }
          }
        } catch {
          // ignore per-symbol failures
        }
      }
    }

    evaluate()
    const interval = setInterval(evaluate, EVAL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [rules, selectedSymbol, currentPrice])

  return { rules, triggeredRules, addRule, updateRule, deleteRule, clearTriggered }
}
