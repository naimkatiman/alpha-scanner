# Alpha Scanner

AI-powered trading signal dashboard for 12 symbols — BUY/SELL signals, full technical analysis, paper trading, backtesting, and a Telegram bot.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/naimkatiman/alpha-scanner&env=NEXTAUTH_SECRET,NEXTAUTH_URL&envDescription=Required%20environment%20variables&project-name=alpha-scanner)
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template?referralCode=alpha-scanner)

---

## Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4 — dark fintech theme (`#050505` OLED, emerald accents)
- **Database**: Prisma 5 + SQLite (dev) / PostgreSQL (prod)
- **Auth**: NextAuth v4 with Prisma adapter
- **Charts**: Canvas-based charts
- **AI**: OpenAI API (optional) for signal commentary

## Features

- Real-time BUY/SELL signals across 12 trading symbols
- Full technical analysis (RSI, MACD, Bollinger Bands, EMA)
- Paper trading simulation
- Strategy backtesting
- Signal accuracy tracking and leaderboard
- Webhook outbound notifications
- Telegram bot integration
- AI signal commentary (optional)

---

## Quick Start

```bash
git clone https://github.com/naimkatiman/alpha-scanner.git
cd alpha-scanner
npm install
cp .env.example .env.local
npx prisma generate && npx prisma migrate dev
npm run dev
```

Open http://localhost:3000.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite path or PostgreSQL URL |
| `NEXTAUTH_SECRET` | Yes | JWT secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | App URL |
| `CRON_SECRET` | Recommended | Protects cron endpoints |
| `OPENAI_API_KEY` | No | AI signal commentary |
| `META_API_TOKEN` | No | MetaApi broker integration |
| `META_API_ACCOUNT_ID` | No | MetaApi account ID |

See [docs/DEPLOY.md](docs/DEPLOY.md) for the full deployment guide including Vercel, Railway, and database setup.

---

## License

ISC
