# AUTONOMOUS.md — Alpha Scanner Goals + Backlog

## Project Goal
Build a multi-asset trading opportunity scanner dashboard.
Supports Crypto, Forex, Commodities, Stocks, Indices.
Default symbols: XAUUSD, XAGUSD, BTCUSD, ETHUSD, XRPUSD.
Three trading modes (Swing, Intraday, Scalper) with three risk profiles
(High Risk, Balanced, Conservative).
Default: leverage 1:1000, capital $500, TP1 at 1.618 Fibonacci extension.

## Current Phase: 1 — Frontend
Do NOT skip phases. Build in order: frontend UI → scanner engine → multi-asset → broker API.

## Tech Stack
- Next.js (App Router) + Tailwind CSS
- TypeScript strict mode
- Deployed via Railway or Vercel (auto-deploy from GitHub)

## Open Backlog (Phase 1)
- TASK-001: Project scaffold (Next.js + Tailwind + dark fintech theme + deploy)
- TASK-002: Dashboard layout (Navbar, Footer, main grid, responsive shell)
- TASK-003: Symbol selector (5 default symbols, category labels)
- TASK-004: Mode selector (Swing/Intraday/Scalper toggle)
- TASK-005: Risk profile selector (High Risk/Balanced/Conservative cards)
- TASK-006: Signal panel (mock signals: direction, entry, TP/SL, confidence)
- TASK-007: TP/SL display (visual price levels, risk-reward ratio)
- TASK-008: Settings panel (leverage, capital, TP ratio defaults)
- TASK-009: Seed mock signal data (all 5 symbols × 3 modes)
- TASK-010: Mobile responsiveness + final polish

## Phase 2 — Scanner Engine (future)
- Real-time price fetching (CoinGecko for crypto, free forex APIs)
- Technical analysis calculations (support/resistance, trend detection)
- Signal generation logic per trading mode
- TP/SL calculation based on risk profile + leverage

## Phase 3 — Multi-Asset Expansion (future)
- Additional symbols beyond the 5 defaults
- Category-based filtering and grouping
- Asset class tabs

## Phase 4 — Broker API Integration (future)
- Optional read-only broker API connectivity
- Account balance/equity display
- Position monitoring
- Connection settings UI
- NEVER enable live order execution by default

## Rules (enforced always)
1. Auto-commit and push after every completed task — Naim has pre-approved all commits
2. Append completed tasks to memory/tasks-log.md (never edit existing lines)
3. Update STATE.yaml on every step
4. Do NOT build Phase 2+ features until Phase 1 is fully approved
5. Send Telegram summary after each push (what was built, files changed)
6. Follow dark fintech theme — dark backgrounds, blue/green accents for buy, red for sell
7. Do not remove working features unless replacing with a better version
8. Keep the app deployable at all times
