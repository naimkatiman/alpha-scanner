import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("changeme123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@alpha-scanner.app" },
    update: {},
    create: { email: "admin@alpha-scanner.app", passwordHash: hashed, name: "Admin" },
  });

  await prisma.userSettings.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      watchlist: JSON.stringify(["EURUSD", "GBPUSD", "XAUUSD", "BTCUSD", "US30"]),
      preferredMode: "swing",
      riskProfile: "balanced",
      leverage: 100,
      capital: 10000,
    },
  });

  const signals = [
    { symbol: "EURUSD", mode: "swing", direction: "BUY", entryPrice: 1.0850, tp1: 1.0920, sl: 1.0780, confidence: 85, outcome: "HIT_TP1" },
    { symbol: "GBPUSD", mode: "swing", direction: "SELL", entryPrice: 1.2650, tp1: 1.2580, sl: 1.2720, confidence: 78, outcome: "PENDING" },
    { symbol: "XAUUSD", mode: "scalp", direction: "BUY", entryPrice: 2350.50, tp1: 2365.00, sl: 2340.00, confidence: 92, outcome: "PENDING" },
    { symbol: "USDJPY", mode: "swing", direction: "SELL", entryPrice: 154.20, tp1: 153.50, sl: 154.80, confidence: 72, outcome: "HIT_SL" },
    { symbol: "BTCUSD", mode: "swing", direction: "BUY", entryPrice: 67500.00, tp1: 69000.00, sl: 66000.00, confidence: 88, outcome: "PENDING" },
    { symbol: "US30", mode: "scalp", direction: "BUY", entryPrice: 39850.00, tp1: 40050.00, sl: 39650.00, confidence: 75, outcome: "HIT_TP1" },
    { symbol: "EURUSD", mode: "scalp", direction: "SELL", entryPrice: 1.0880, tp1: 1.0860, sl: 1.0900, confidence: 80, outcome: "EXPIRED" },
    { symbol: "GBPJPY", mode: "swing", direction: "BUY", entryPrice: 195.50, tp1: 196.80, sl: 194.20, confidence: 82, outcome: "PENDING" },
    { symbol: "XAUUSD", mode: "swing", direction: "SELL", entryPrice: 2380.00, tp1: 2350.00, sl: 2400.00, confidence: 68, outcome: "HIT_SL" },
    { symbol: "NZDUSD", mode: "swing", direction: "BUY", entryPrice: 0.6120, tp1: 0.6180, sl: 0.6060, confidence: 76, outcome: "PENDING" },
  ];

  for (const s of signals) {
    await prisma.signalRecord.create({ data: s });
  }

  const alerts = [
    { symbol: "EURUSD", type: "PRICE_ABOVE", condition: "Price crosses above 1.0900", targetPrice: 1.0900, message: "EURUSD breakout above key resistance", active: true },
    { symbol: "XAUUSD", type: "RSI_OVERBOUGHT", condition: "RSI(14) > 70 on H4", message: "Gold RSI overbought on 4-hour chart", active: true },
    { symbol: "BTCUSD", type: "PRICE_BELOW", condition: "Price drops below 65000", targetPrice: 65000, message: "Bitcoin broke critical support", active: true },
    { symbol: "GBPUSD", type: "MACD_CROSS", condition: "MACD bullish crossover on D1", message: "Cable MACD bullish cross on daily", active: true },
    { symbol: "US30", type: "VOLUME_SPIKE", condition: "Volume > 200% average on H1", message: "Dow Jones unusual volume detected", active: true },
    { symbol: "USDJPY", type: "PRICE_ABOVE", condition: "Price breaks 155.00", targetPrice: 155.00, message: "USDJPY approaching intervention level", active: true },
    { symbol: "EURUSD", type: "PRICE_BELOW", condition: "Price drops below 1.0750", targetPrice: 1.0750, message: "Euro critical support break", triggered: true, triggeredAt: new Date("2025-03-20"), active: false },
    { symbol: "XAUUSD", type: "PRICE_ABOVE", condition: "Gold breaks 2400", targetPrice: 2400, message: "Gold new all-time high alert", active: true },
    { symbol: "GBPJPY", type: "RSI_OVERSOLD", condition: "RSI(14) < 30 on H4", message: "GBPJPY oversold on 4H", active: true },
    { symbol: "NZDUSD", type: "MACD_CROSS", condition: "MACD bearish cross on H4", message: "Kiwi MACD bearish signal", active: true },
  ];

  for (const a of alerts) {
    await prisma.alert.create({ data: a });
  }

  const sessions = [
    { symbol: "EURUSD", direction: "LONG", entryPrice: 1.0850, quantity: 1.0, leverage: 100, status: "OPEN" },
    { symbol: "XAUUSD", direction: "LONG", entryPrice: 2345.00, exitPrice: 2368.00, quantity: 0.5, leverage: 50, status: "CLOSED", pnl: 1150, pnlPercent: 0.98, closedAt: new Date("2025-03-22") },
    { symbol: "BTCUSD", direction: "SHORT", entryPrice: 68500.00, exitPrice: 67200.00, quantity: 0.1, leverage: 10, status: "CLOSED", pnl: 130, pnlPercent: 1.90, closedAt: new Date("2025-03-21") },
    { symbol: "GBPUSD", direction: "SHORT", entryPrice: 1.2680, quantity: 2.0, leverage: 100, status: "OPEN" },
    { symbol: "US30", direction: "LONG", entryPrice: 39900.00, exitPrice: 39750.00, quantity: 1.0, leverage: 20, status: "STOPPED", pnl: -150, pnlPercent: -0.38, closedAt: new Date("2025-03-20") },
  ];

  for (const s of sessions) {
    await prisma.tradingSession.create({ data: s });
  }

  console.log("Seed completed: 1 admin, 10 signals, 10 alerts, 5 trading sessions");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
