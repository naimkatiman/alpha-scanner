'use client'

import { useState } from 'react'
import {
  INDICATOR_LABELS,
  OPERATOR_LABELS,
  type AlertRule,
  type Condition,
  type IndicatorKey,
  type Operator,
} from '../lib/alertRules'
import { getAllSymbols } from '../lib/symbols'

const ACCENT = '#a1a1aa'
const ALL_SYMBOLS = getAllSymbols()

const INDICATOR_OPTIONS: IndicatorKey[] = [
  'RSI',
  'MACD_histogram',
  'stochastic_k',
  'bollinger_pctb',
  'ema20_cross',
  'price',
]

const OPERATOR_OPTIONS: Operator[] = ['<', '>', 'crosses_above', 'crosses_below']

function makeCondition(): Condition {
  return {
    id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    indicator: 'RSI',
    operator: '<',
    value: 30,
  }
}

/* ── Rule form ──────────────────────────────────────────────────────────────── */

interface RuleFormProps {
  onSave: (rule: Omit<AlertRule, 'id' | 'createdAt'>) => void
  onClose: () => void
  initial?: AlertRule
}

function RuleForm({ onSave, onClose, initial }: RuleFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [symbol, setSymbol] = useState(initial?.symbol ?? 'XAUUSD')
  const [logic, setLogic] = useState<'AND' | 'OR'>(initial?.logic ?? 'AND')
  const [conditions, setConditions] = useState<Condition[]>(
    initial?.conditions ?? [makeCondition()],
  )

  const updateCondition = (id: string, field: keyof Condition, value: string | number) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    )
  }

  const handleSave = () => {
    if (!name.trim() || conditions.length === 0) return
    onSave({
      name: name.trim(),
      symbol,
      conditions,
      logic,
      enabled: true,
    })
    onClose()
  }

  return (
    <div className="space-y-3 p-4 border-b border-white/[0.06] bg-white/[0.02]">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[9px] uppercase tracking-widest text-zinc-600 mb-1">
            Rule Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. RSI Oversold BTC"
            className="w-full rounded border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-xs text-white placeholder-gray-700 outline-none focus:border-[#f59e0b]/50"
          />
        </div>
        <div>
          <label className="block text-[9px] uppercase tracking-widest text-zinc-600 mb-1">
            Symbol
          </label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full rounded border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#f59e0b]/50"
          >
            {ALL_SYMBOLS.map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {s.icon} {s.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AND / OR toggle */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] uppercase tracking-widest text-zinc-600">Logic:</span>
        {(['AND', 'OR'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLogic(l)}
            className="rounded px-2 py-1 text-[9px] font-bold transition-colors"
            style={{
              backgroundColor: logic === l ? `${ACCENT}20` : '#1a1a1a',
              color: logic === l ? ACCENT : '#6b7280',
              borderWidth: 1,
              borderColor: logic === l ? `${ACCENT}50` : '#222',
            }}
          >
            {l}
          </button>
        ))}
        <span className="text-[8px] text-zinc-700">
          {logic === 'AND' ? 'All conditions must match' : 'Any condition matches'}
        </span>
      </div>

      {/* Conditions */}
      <div className="space-y-2">
        <span className="text-[9px] uppercase tracking-widest text-zinc-600">Conditions</span>
        {conditions.map((cond, idx) => (
          <div key={cond.id} className="flex items-center gap-1.5 flex-wrap">
            {idx > 0 && (
              <span className="text-[8px] font-bold uppercase text-zinc-600 w-6">{logic}</span>
            )}
            <select
              value={cond.indicator}
              onChange={(e) => updateCondition(cond.id, 'indicator', e.target.value as IndicatorKey)}
              className="rounded border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[9px] text-white outline-none"
            >
              {INDICATOR_OPTIONS.map((ind) => (
                <option key={ind} value={ind}>
                  {INDICATOR_LABELS[ind]}
                </option>
              ))}
            </select>
            <select
              value={cond.operator}
              onChange={(e) => updateCondition(cond.id, 'operator', e.target.value as Operator)}
              className="rounded border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[9px] text-white outline-none"
            >
              {OPERATOR_OPTIONS.map((op) => (
                <option key={op} value={op}>
                  {OPERATOR_LABELS[op]}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={cond.value}
              onChange={(e) => updateCondition(cond.id, 'value', parseFloat(e.target.value) || 0)}
              className="w-20 rounded border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[9px] text-white outline-none"
            />
            {conditions.length > 1 && (
              <button
                onClick={() => setConditions((prev) => prev.filter((c) => c.id !== cond.id))}
                className="text-zinc-600 hover:text-[#f43f5e] transition-colors text-[10px]"
              >
                X
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => setConditions((prev) => [...prev, makeCondition()])}
          className="text-[9px] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          + Add condition
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="rounded border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-1.5 text-[9px] font-semibold text-[#f59e0b] transition-all hover:bg-[#f59e0b]/20 disabled:opacity-40"
        >
          Save Rule
        </button>
        <button
          onClick={onClose}
          className="rounded border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[9px] text-zinc-600 transition-colors hover:text-zinc-400"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

/* ── Rule row ───────────────────────────────────────────────────────────────── */

function RuleRow({
  rule,
  onToggle,
  onDelete,
  onEdit,
}: {
  rule: AlertRule
  onToggle: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  const wasTriggered = rule.lastTriggered && Date.now() - rule.lastTriggered < 5 * 60_000
  const timeAgo = rule.lastTriggered
    ? `${Math.round((Date.now() - rule.lastTriggered) / 60_000)}m ago`
    : null

  return (
    <div className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.03] px-3 py-2 gap-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full flex-shrink-0"
            style={{
              backgroundColor: rule.enabled
                ? wasTriggered
                  ? '#a1a1aa'
                  : '#22c55e'
                : '#4b5563',
            }}
          />
          <span className="text-xs font-semibold text-white truncate">{rule.name}</span>
          <span className="text-[8px] text-zinc-600">{rule.symbol}</span>
        </div>
        <div className="mt-0.5 text-[8px] text-zinc-700">
          {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''} · {rule.logic}
          {timeAgo && (
            <span className="ml-2 text-[#f59e0b]">Triggered {timeAgo}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onToggle}
          className="rounded px-1.5 py-0.5 text-[8px] font-semibold transition-colors"
          style={{
            color: rule.enabled ? '#22c55e' : '#6b7280',
            backgroundColor: rule.enabled ? '#22c55e10' : '#1a1a1a',
          }}
        >
          {rule.enabled ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={onEdit}
          className="text-[9px] text-zinc-600 hover:text-zinc-400 transition-colors px-1"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="text-[9px] text-zinc-600 hover:text-[#f43f5e] transition-colors px-1"
        >
          Del
        </button>
      </div>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────────────── */

interface AlertRuleBuilderProps {
  rules: AlertRule[]
  onAddRule: (rule: Omit<AlertRule, 'id' | 'createdAt'>) => void
  onUpdateRule: (id: string, updates: Partial<AlertRule>) => void
  onDeleteRule: (id: string) => void
}

export default function AlertRuleBuilder({
  rules,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
}: AlertRuleBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null)

  const handleSaveEdit = (updated: Omit<AlertRule, 'id' | 'createdAt'>) => {
    if (editingRule) {
      onUpdateRule(editingRule.id, updated)
      setEditingRule(null)
    }
  }

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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 flex-shrink-0"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          <span className="text-xs font-semibold text-white">Custom Alert Rules</span>
          {rules.length > 0 && (
            <span className="rounded bg-white/[0.03] px-1.5 py-0.5 text-[8px] font-semibold text-zinc-500">
              {rules.filter((r) => r.enabled).length}/{rules.length} active
            </span>
          )}
        </div>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`text-zinc-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-white/[0.06]">
          {/* Add rule form */}
          {showForm && !editingRule && (
            <RuleForm onSave={onAddRule} onClose={() => setShowForm(false)} />
          )}

          {/* Edit rule form */}
          {editingRule && (
            <RuleForm
              onSave={handleSaveEdit}
              onClose={() => setEditingRule(null)}
              initial={editingRule}
            />
          )}

          {/* Rules list */}
          <div className="px-3 py-3 space-y-1.5">
            {rules.length === 0 ? (
              <div className="py-3 text-center">
                <p className="text-[10px] text-zinc-600">No custom rules yet</p>
                <p className="text-[8px] text-zinc-700">Create rules to trigger alerts when indicators meet conditions</p>
              </div>
            ) : (
              rules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  onToggle={() => onUpdateRule(rule.id, { enabled: !rule.enabled })}
                  onDelete={() => onDeleteRule(rule.id)}
                  onEdit={() => { setEditingRule(rule); setShowForm(false) }}
                />
              ))
            )}

            {!showForm && !editingRule && (
              <button
                onClick={() => { setShowForm(true); setEditingRule(null) }}
                className="w-full rounded border border-dashed border-white/[0.06] py-2 text-[9px] text-zinc-600 transition-colors hover:border-[#f59e0b]/30 hover:text-[#f59e0b]"
              >
                + New Alert Rule
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
