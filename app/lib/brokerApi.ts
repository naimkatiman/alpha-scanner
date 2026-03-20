/* ── Broker API Wrapper (MetaApi for MT4/MT5) ────────────────────────────── */

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface BrokerAccount {
  balance: number
  equity: number
  margin: number
  freeMargin: number
  marginLevel: number // percentage
  leverage: number
  server: string
  platform: 'mt4' | 'mt5'
  currency: string
  name: string
}

export interface BrokerPosition {
  id: string
  symbol: string
  type: 'buy' | 'sell'
  volume: number
  openPrice: number
  currentPrice: number
  profit: number
  swap: number
  openTime: string
  magic: number
  comment: string
}

export interface BrokerSession {
  sessionId: string
  token: string
  accountId: string
  state: ConnectionState
  account: BrokerAccount | null
  lastError: string | null
  connectedAt: number | null
}

/* ── In-memory session store (serverless-compatible) ─────────────────────── */

interface InternalSession {
  metaApi: unknown
  account: unknown
  connection: unknown
  info: BrokerSession
}

const sessions = new Map<string, InternalSession>()

function generateSessionId(): string {
  return 'bs_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

/* ── Connect ──────────────────────────────────────────────────────────────── */

export async function connectBroker(
  token: string,
  accountId: string,
): Promise<BrokerSession> {
  const sessionId = generateSessionId()
  const session: BrokerSession = {
    sessionId,
    token: token.slice(0, 8) + '…',
    accountId,
    state: 'connecting',
    account: null,
    lastError: null,
    connectedAt: null,
  }

  try {
    // Dynamic import for metaapi (ESM/CJS compatibility)
    const MetaApi = (await import('metaapi.cloud-sdk')).default
    const metaApi = new MetaApi(token)

    // Get the account
    const account = await metaApi.metatraderAccountApi.getAccount(accountId)

    // Deploy if needed
    if (account.state !== 'DEPLOYED') {
      await account.deploy()
    }
    if (account.connectionStatus !== 'CONNECTED') {
      await account.waitConnected()
    }

    // Create RPC connection
    const connection = account.getRPCConnection()
    await connection.connect()
    await connection.waitSynchronized()

    // Get account info
    const info = await connection.getAccountInformation()

    session.state = 'connected'
    session.connectedAt = Date.now()
    session.account = {
      balance: info.balance ?? 0,
      equity: info.equity ?? 0,
      margin: info.margin ?? 0,
      freeMargin: info.freeMargin ?? 0,
      marginLevel: info.marginLevel ?? 0,
      leverage: info.leverage ?? 0,
      server: info.server ?? account.server ?? 'Unknown',
      platform: account.version === 4 ? 'mt4' : 'mt5',
      currency: info.currency ?? 'USD',
      name: info.name ?? account.name ?? 'Trading Account',
    }

    sessions.set(sessionId, {
      metaApi,
      account,
      connection,
      info: session,
    })

    return session
  } catch (err) {
    session.state = 'error'
    session.lastError = err instanceof Error ? err.message : 'Connection failed'
    return session
  }
}

/* ── Get Account Info ─────────────────────────────────────────────────────── */

export async function getAccountInfo(sessionId: string): Promise<BrokerAccount | null> {
  const session = sessions.get(sessionId)
  if (!session || !session.connection) return null

  try {
    const connection = session.connection as {
      getAccountInformation: () => Promise<Record<string, unknown>>
    }
    const info = await connection.getAccountInformation()

    const account: BrokerAccount = {
      balance: (info.balance as number) ?? 0,
      equity: (info.equity as number) ?? 0,
      margin: (info.margin as number) ?? 0,
      freeMargin: (info.freeMargin as number) ?? 0,
      marginLevel: (info.marginLevel as number) ?? 0,
      leverage: (info.leverage as number) ?? 0,
      server: (info.server as string) ?? 'Unknown',
      platform: session.info.account?.platform ?? 'mt5',
      currency: (info.currency as string) ?? 'USD',
      name: (info.name as string) ?? 'Trading Account',
    }

    session.info.account = account
    return account
  } catch (err) {
    session.info.lastError = err instanceof Error ? err.message : 'Failed to get account info'
    return session.info.account
  }
}

/* ── Get Positions ────────────────────────────────────────────────────────── */

export async function getPositions(sessionId: string): Promise<BrokerPosition[]> {
  const session = sessions.get(sessionId)
  if (!session || !session.connection) return []

  try {
    const connection = session.connection as {
      getPositions: () => Promise<Array<Record<string, unknown>>>
    }
    const positions = await connection.getPositions()

    return positions.map((p) => ({
      id: String(p.id ?? p.ticket ?? ''),
      symbol: String(p.symbol ?? ''),
      type: String(p.type ?? '').toLowerCase().includes('buy') ? 'buy' as const : 'sell' as const,
      volume: Number(p.volume ?? 0),
      openPrice: Number(p.openPrice ?? 0),
      currentPrice: Number(p.currentPrice ?? 0),
      profit: Number(p.profit ?? p.unrealizedProfit ?? 0),
      swap: Number(p.swap ?? 0),
      openTime: String(p.time ?? p.openTime ?? ''),
      magic: Number(p.magic ?? 0),
      comment: String(p.comment ?? ''),
    }))
  } catch (err) {
    session.info.lastError = err instanceof Error ? err.message : 'Failed to get positions'
    return []
  }
}

/* ── Disconnect ───────────────────────────────────────────────────────────── */

export async function disconnectBroker(sessionId: string): Promise<boolean> {
  const session = sessions.get(sessionId)
  if (!session) return false

  try {
    const connection = session.connection as { close?: () => Promise<void> }
    if (connection?.close) await connection.close()
  } catch {
    // Ignore cleanup errors
  }

  sessions.delete(sessionId)
  return true
}

/* ── Session check ────────────────────────────────────────────────────────── */

export function getSession(sessionId: string): BrokerSession | null {
  return sessions.get(sessionId)?.info ?? null
}

export function hasSession(sessionId: string): boolean {
  return sessions.has(sessionId)
}
