/* ── Centralized Symbol Registry ─────────────────────────────────────────── */

export interface SymbolConfig {
  symbol: string
  name: string
  category: 'Metals' | 'Crypto' | 'Forex'
  icon: string
  pipSize: number
  decimals: number
  fallbackPrice: number
  volatility: number
  dataSourceType: 'coingecko' | 'metals-api' | 'forex-api'
  coingeckoId?: string
}

export const SYMBOL_REGISTRY: SymbolConfig[] = [
  // ── Metals ────────────────────────────────────────────────────────────────
  {
    symbol: 'XAUUSD',
    name: 'Gold',
    category: 'Metals',
    icon: 'gold',
    pipSize: 0.1,
    decimals: 2,
    fallbackPrice: 2920,
    volatility: 0.01,
    dataSourceType: 'metals-api',
  },
  {
    symbol: 'XAGUSD',
    name: 'Silver',
    category: 'Metals',
    icon: 'silver',
    pipSize: 0.01,
    decimals: 2,
    fallbackPrice: 32.5,
    volatility: 0.02,
    dataSourceType: 'metals-api',
  },

  // ── Crypto ────────────────────────────────────────────────────────────────
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin',
    category: 'Crypto',
    icon: '₿',
    pipSize: 10,
    decimals: 0,
    fallbackPrice: 84000,
    volatility: 0.03,
    dataSourceType: 'coingecko',
    coingeckoId: 'bitcoin',
  },
  {
    symbol: 'ETHUSD',
    name: 'Ethereum',
    category: 'Crypto',
    icon: 'Ξ',
    pipSize: 0.5,
    decimals: 2,
    fallbackPrice: 1920,
    volatility: 0.04,
    dataSourceType: 'coingecko',
    coingeckoId: 'ethereum',
  },
  {
    symbol: 'XRPUSD',
    name: 'Ripple',
    category: 'Crypto',
    icon: 'xrp',
    pipSize: 0.0001,
    decimals: 4,
    fallbackPrice: 2.35,
    volatility: 0.05,
    dataSourceType: 'coingecko',
    coingeckoId: 'ripple',
  },
  {
    symbol: 'SOLUSD',
    name: 'Solana',
    category: 'Crypto',
    icon: '◎',
    pipSize: 0.01,
    decimals: 2,
    fallbackPrice: 145,
    volatility: 0.05,
    dataSourceType: 'coingecko',
    coingeckoId: 'solana',
  },
  {
    symbol: 'DOGEUSD',
    name: 'Dogecoin',
    category: 'Crypto',
    icon: 'doge',
    pipSize: 0.00001,
    decimals: 5,
    fallbackPrice: 0.17,
    volatility: 0.06,
    dataSourceType: 'coingecko',
    coingeckoId: 'dogecoin',
  },
  {
    symbol: 'ADAUSD',
    name: 'Cardano',
    category: 'Crypto',
    icon: '₳',
    pipSize: 0.0001,
    decimals: 4,
    fallbackPrice: 0.72,
    volatility: 0.05,
    dataSourceType: 'coingecko',
    coingeckoId: 'cardano',
  },

  // ── Forex ─────────────────────────────────────────────────────────────────
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    category: 'Forex',
    icon: 'eur',
    pipSize: 0.0001,
    decimals: 4,
    fallbackPrice: 1.085,
    volatility: 0.005,
    dataSourceType: 'forex-api',
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound / USD',
    category: 'Forex',
    icon: 'gbp',
    pipSize: 0.0001,
    decimals: 4,
    fallbackPrice: 1.265,
    volatility: 0.006,
    dataSourceType: 'forex-api',
  },
  {
    symbol: 'USDJPY',
    name: 'US Dollar / Yen',
    category: 'Forex',
    icon: 'jpy',
    pipSize: 0.01,
    decimals: 2,
    fallbackPrice: 149.5,
    volatility: 0.005,
    dataSourceType: 'forex-api',
  },
  {
    symbol: 'AUDUSD',
    name: 'Australian Dollar / USD',
    category: 'Forex',
    icon: 'aud',
    pipSize: 0.0001,
    decimals: 4,
    fallbackPrice: 0.652,
    volatility: 0.006,
    dataSourceType: 'forex-api',
  },
]

/* ── Lookup helpers ───────────────────────────────────────────────────────── */

export function getSymbolConfig(symbol: string): SymbolConfig | undefined {
  return SYMBOL_REGISTRY.find((s) => s.symbol === symbol)
}

export function getSymbolsByCategory(category: 'Metals' | 'Crypto' | 'Forex'): SymbolConfig[] {
  return SYMBOL_REGISTRY.filter((s) => s.category === category)
}

export function getAllSymbols(): SymbolConfig[] {
  return SYMBOL_REGISTRY
}

/* ── Formatting helpers (canonical implementations) ─────────────────────── */

export function getPipSize(symbol: string): number {
  return getSymbolConfig(symbol)?.pipSize ?? 0.0001
}

export function fmt(symbol: string, price: number): string {
  const config = getSymbolConfig(symbol)
  const decimals = config?.decimals ?? 2
  if (decimals === 0) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }
  return price.toFixed(decimals)
}

export function fmtPips(symbol: string, distance: number): string {
  const pipSize = getPipSize(symbol)
  const pips = Math.round(Math.abs(distance) / pipSize)
  if (symbol === 'BTCUSD') return `${pips.toLocaleString()} pts`
  return `${pips} pips`
}

export function getBasePrice(
  symbol: string,
  livePrices?: Record<string, { price: number }>,
): number {
  return livePrices?.[symbol]?.price ?? getSymbolConfig(symbol)?.fallbackPrice ?? 100
}
