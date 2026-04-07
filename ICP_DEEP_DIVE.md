# Alpha Screener — ICP Deep Dive
**Date:** April 2026  
**Product:** Alpha Screener SaaS — hosted version of the alpha-scanner codebase  
**Pricing:** Free (3 signals/day, 5 assets) · Pro $29/mo · Elite $99/mo  
**Stack signal:** Multi-asset TA signals across Forex, Crypto, Metals for 12 symbols

---

## 1. Executive Summary

Alpha Screener sits at the intersection of two strong pulls: the massive self-hosted open-source version (free, MIT) and a SaaS layer that monetises power users who want managed hosting, unlimited signals, backtesting, Telegram alerts, and broker integration. The product is genuinely feature-complete — 6-factor signal engine, GPT-4o-mini commentary, backtesting, paper trading, a signal marketplace, push notifications, and a public accuracy leaderboard. The conversion challenge is not feature depth; it is clarity about who pays and why. The primary paying customer is a self-taught retail trader who already has a live account, trades Forex or Crypto manually or semi-automatically, and is willing to pay under $30/month for an edge that reduces the time and cognitive load of doing their own TA. At $29/month the product is well-priced for this segment — it costs less than a single losing trade on a $1,000 account.

---

## 2. Product Reality Check — What Alpha Screener Actually Delivers Today

**Genuine strengths the pricing page should lead with:**

| Capability | Reality |
|---|---|
| Signal engine | 6-factor weighted scoring (RSI, MACD, EMA, S/R, Bollinger, Stochastic) with per-mode tuning (Swing / Intraday / Scalper) |
| Coverage | 12 symbols: XAUUSD, XAGUSD, BTC, ETH, XRP, SOL, DOGE, ADA, EUR/USD, GBP/USD, USD/JPY, AUD/USD — the exact instruments most retail traders watch |
| AI commentary | GPT-4o-mini explains *why* each signal fired in plain English — rule-based fallback if no API key |
| Backtesting | Signal replay against historical OHLCV, equity curve, win rate, drawdown — available behind Pro paywall |
| Paper trading | $10K virtual account with auto-trade mode — available on Free tier |
| Alerting | Browser push notifications, Telegram bot, webhook outbound (for trading bots) |
| Broker connection | MetaApi for MT4/MT5 live accounts (Elite only) |
| Leaderboard | Public accuracy rankings by symbol+mode with OG images — social proof engine |
| Marketplace | Users can sell custom signal strategies; Stripe one-time purchase, 85% revenue share |
| Multi-timeframe | M15/H1/H4/D1 confluence scoring |
| API access | Pro tier gets API keys with 10K req/day |

**Honest gaps (not bugs, but strategic realities):**

- Signal accuracy is only as good as TA on volatile assets. The app does not claim ML-based alpha — it combines standard indicators. This is honest and appropriate, but the messaging should not oversell "AI signals" when the AI is the *commentary layer*, not the signal generator.
- 12 symbols is sufficient for the target buyer but limits appeal to stock traders (Finviz audience). This is fine — don't chase that segment at $29.
- The self-hosted free tier is a direct competitor to the paid SaaS. A developer who can run a Railway/Vercel deploy will not pay $29/mo. This is intentional (open-source marketing funnel), but must not muddy the SaaS value proposition.

---

## 3. ICP Segmentation — 4 Segments Ranked by Conversion Likelihood

### Segment A: The Part-Time Retail Forex/Crypto Trader (PRIMARY — pays first)
- Has a live FX or crypto account ($500–$10K)
- Trades manually 1–3 times per day, mostly evenings or early mornings
- Relies on a mix of TradingView free tier + Telegram signal groups (free)
- Gets signal alerts from groups but has no way to validate them
- **Conversion trigger:** Telegram bot + backtesting combo. Wants to see if signals actually work before sizing up.

### Segment B: The Algo/Bot Developer (SECONDARY — converts at Elite)
- Builds Pine Script or Python bots, uses TradingView webhooks
- Wants to consume signals via webhook or API to feed into their bot
- Currently rolling their own TA from scratch
- **Conversion trigger:** Webhook outbound + API key access. Saves them weeks of indicator coding.

### Segment C: The Open-Source Self-Hoster Who Upgrades (TERTIARY — slow)
- Found the repo on GitHub, deployed their own instance
- Converting to paid SaaS feels like paying for something they already have
- **Conversion trigger:** Managed hosting + signal marketplace (they want to sell strategies, need the platform)

### Segment D: The Crypto Retail Newcomer (ANTI-CONVERTER — avoid spending marketing on)
- Came in from a YouTube video about crypto signals
- Has not put real money in yet
- Will use Free tier indefinitely or churn within 30 days
- Converting this segment requires education investment that does not scale at $29

---

## 4. Primary ICP Deep Dive — Segment A: The Part-Time Retail Forex/Crypto Trader

**Who they are:**
- Age 22–40, predominantly male (80–85% of retail FX/crypto traders per ESMA data)
- Located in Southeast Asia, Middle East, Eastern Europe, Nigeria, UK — regions with high retail FX penetration
- Day job: IT, logistics, sales, or student. Trading is a side income goal, not a hobby
- Account size: $300–$5,000. Most have blown at least one account
- Typical broker: XM, Exness, IC Markets, Binance, ByBit
- Daily workflow: Check phone for signals after work, enter 1–3 trades, check again before bed

**Their actual daily pain:**
1. "I don't have time to stare at charts all day."
2. "I follow free Telegram signals but I don't know if they actually win over time."
3. "TradingView is fine for charting but doesn't *tell* me what to do."
4. "I have a strategy but I never validated it — I just wing it."
5. "I miss entries because I'm at work and the signal came at 2pm."

**What they buy:**
- Telegram signal groups: $30–$150/month for "VIP signals" — many of these are low-quality
- TradingView Pro: $14.95/month if they got serious about charting
- Courses: One-time $100–$500 purchases (often regretted)
- They have already proven willingness to pay for signals at a price above $29

**What they want from Alpha Screener:**
- A system that acts like a "second opinion" on a trade they are already considering
- Confirmation that their intuition (or the Telegram signal they got) has TA backing
- Mobile-first alerts so they don't miss entries
- A simple number: "is this signal 70%+ confident?"
- To know if the system *actually works* — hence the accuracy leaderboard is load-bearing

**What they don't want:**
- To read documentation
- To connect a broker and expose their login
- Complex indicator customisation (that's Segment B)

---

## 5. Jobs-to-Be-Done Framework

The primary ICP hires Alpha Screener Pro to do four jobs:

**Job 1: "Confirm my trade idea without spending 20 minutes on TA."**
Functional: Get a BUY/SELL signal with confidence score and AI explanation in under 10 seconds.
Emotional: Feel like a disciplined trader, not a gambler.
Social: "I have a system" — not just following a random Telegram channel.

**Job 2: "Never miss a good entry again."**
Functional: Get a Telegram/push notification the moment a signal fires on my watched asset.
Emotional: Reduce FOMO and the guilt of a missed trade.
Social: Not relevant.

**Job 3: "Know whether my approach actually works over time."**
Functional: See backtested win rates and live accuracy stats for each symbol/mode combo.
Emotional: Confidence to increase position size when the data supports it.
Social: Share signal performance on social media via leaderboard OG images.

**Job 4: "Build toward automating my trading."**
Functional: Connect webhook to a MT4/MT5 bot (Elite) or use API keys to build something custom (Pro).
Emotional: Progress feeling — from manual clicking to semi-automated.
Social: "I have a trading bot" is a status signal in retail trading communities.

---

## 6. Buying Triggers and Decision Timeline

**Cold → Paid timeline for Segment A: typically 7–21 days**

| Day | Event |
|---|---|
| 0 | Discovers Alpha Screener via GitHub, Reddit (r/algotrading, r/Forex), or a Telegram trading group |
| 0–3 | Uses Free tier. Gets 3 signals/day. Notices the limit. Checks paper trading. |
| 3–7 | Wants Telegram bot for mobile alerts. Hits the Pro paywall. Considers upgrading. |
| 7–14 | Checks the public accuracy leaderboard. Sees that XAUUSD Swing has a 60%+ win rate. Trust builds. |
| 14–21 | Has one of two triggers: (a) misses a trade because they were not watching the screen, OR (b) pays $50+ to a Telegram signal group that underperforms. Compares with $29 Alpha Screener Pro. |
| 21 | Subscribes. |

**Key insight:** The upgrade decision is almost always driven by a *negative experience with the alternative*, not by product education. The copy and onboarding should exploit this: make the comparison to Telegram VIP groups explicit and immediate.

**What accelerates conversion:**
- Telegram bot being gated at Pro — highest-friction free tier limitation for Segment A
- Seeing the accuracy leaderboard with real historical data (social proof from the system itself)
- Paper trading showing positive P&L (even if mock — the pattern-matching is real)
- A/B test: show a "You missed 3 signals today" notification at the 3-signal limit

---

## 7. Willingness-to-Pay Logic — Why $29/mo Is (Mostly) Right

**Market context:**
- TradingView Pro is $14.95/month — widely considered the floor for "serious trader" tools
- Telegram VIP signal groups: $30–$150/month — direct substitutes, often low quality
- TrendSpider: $47/month — TA automation, appeals to more advanced traders
- Coinigy, 3Commas: $30–$80/month — crypto-specific, with bot execution

**Alpha Screener Pro at $29/mo is correctly priced for Segment A because:**
1. It is just below the psychological threshold where traders ask "is this worth a losing trade?" — at $29, it costs less than most single losing trades on a $1K account.
2. It bundles what the buyer currently pieces together from multiple free/cheap sources (TradingView free + Telegram groups + manual backtesting).
3. The self-hosted alternative exists but requires technical friction — paying $29/mo to avoid that friction is rational for non-developers.

**Where pricing leaves money on the table:**
- The annual plan saves 17% ($24/mo). This discount is too modest to drive annual commitment. Most subscription analytics show 25–30% annual discount maximises LTV at the expense of small monthly churn. Consider testing $19/mo annual ($228/yr vs $288/yr).
- Elite at $99/mo is correctly priced for Segment B (bot developers, broker integration users). The broker connection (MetaApi MT4/MT5) alone is worth $50+/mo to an active algo trader.
- **There is a missing tier around $49–$59/mo** that captures Segment A users who want broker connection but not the full Elite. Consider "Pro Plus" with MetaApi at $49/mo.

**Price sensitivity data for this category:**
- Retail signal product conversion rates: typically 2–5% free-to-paid for TA tools
- At $29/mo with a strong Telegram alert feature gate, 3–4% free-to-paid is achievable
- Monthly churn for this category: 8–15%; top performers achieve 5–6%
- Target metric: Monthly Recurring Revenue break-even at ~50 Pro subscribers ($1,450/mo) — achievable within 90 days of focused distribution if the open-source repo gains traction

---

## 8. Objections and How to Overcome Them

**Objection 1: "I can get free signals on Telegram."**
Response: "You can. But can you see whether those signals actually win? Alpha Screener shows you a public accuracy leaderboard — every signal is tracked server-side. You see the real win rate before you trade, not after you've lost."
Where to put this: Hero section, directly in the headline or subheadline.

**Objection 2: "TradingView is all I need."**
Response: "TradingView tells you *what happened*. Alpha Screener tells you *what to do right now* — with a confidence score, AI explanation, and a Telegram alert so you don't have to watch charts all day."
Where to put this: Feature comparison table (already in README, needs to move to the /pricing page).

**Objection 3: "I can self-host this for free."**
Response (do not suppress): "Yes, you can. The full source is on GitHub. If you're a developer with a Railway account, do it. If you want it to just work — signals running, Telegram connected, no maintenance — that's what Pro is for."
This is an honest answer that converts more than trying to hide the open-source nature.

**Objection 4: "I don't know if the signals work."**
Response: Do not argue — show the data. The public /leaderboard and /accuracy pages are the answer. The onboarding flow should surface these pages in the first 5 minutes.

**Objection 5: "I'm worried about connecting my broker account."**
Response: The broker connection is read-only position monitoring. No execution. Emphasise: "Alpha Screener can never place or close a trade. It reads your positions only." This objection is primarily from Elite prospects.

**Objection 6: "What if you shut down?"**
Response: "The source is MIT-licensed on GitHub. You can self-host at any time. We don't hold your data hostage." This objection is rare but strong in the open-source-adjacent audience — addressing it directly builds trust.

---

## 9. Competitive Alternatives and Positioning

| Alternative | Why Segment A uses it | Alpha Screener's counter-position |
|---|---|---|
| Free Telegram signal groups | Zero cost, mobile-native | "Free signals have no accountability. Alpha Screener tracks every signal's outcome publicly." |
| TradingView free | Industry standard, familiar | "TradingView charts the past. Alpha Screener scans the present and tells you what to do." |
| Paid Telegram VIP ($50–$150/mo) | Perceived alpha, community | "Half the price. Your own signal engine. You control the strategy." |
| 3Commas / Pionex bots | Automation appeal | "Those tools execute but don't generate signals. Alpha Screener generates signals you can feed into any bot via webhook." |
| TrendSpider ($47/mo) | Advanced TA automation | Different audience (Segment B). Alpha Screener wins on price and mobile UX for Segment A. |
| Self-hosting alpha-scanner free | Zero cost | "When the Railway bill hits, the Telegram bot breaks at 3am, or you want the marketplace — Pro is $29." |

**Positioning statement for Segment A:**
"Alpha Screener is the trading signal tool that shows you its work. Every signal comes with the indicators that fired it, the AI explanation of why, and the historical win rate of that exact setup. No black boxes. No mystery."

---

## 10. Messaging Angles That Convert

**Angle 1 — Accountability over promises (highest trust, best for SEO)**
"The only crypto/forex signal tool that publishes its own win rate. Publicly. In real time."
Use on: Homepage hero, Product Hunt launch tagline, Reddit posts

**Angle 2 — Freedom from manual chart watching (highest emotional resonance for Segment A)**
"Stop watching charts all day. Alpha Screener texts you when it's time to trade."
Use on: Telegram ad copy, Instagram, landing page above the fold

**Angle 3 — Replace the Telegram signal group**
"You're paying $80/month for Telegram signals with no track record. Here's one with a public leaderboard — at $29."
Use on: Retargeting after free sign-up, pricing page comparison row

**Angle 4 — For the open-source developer audience (GitHub, Hacker News)**
"MIT-licensed trading signal engine. Self-host free or let us host it. Either way, you own your signals."
Use on: README, HN Show HN post, GitHub description

**Angle 5 — Automation bridge**
"Your signals. Your bot. Alpha Screener sends webhook payloads to whatever trading system you're building."
Use on: /api-keys page CTA, developer-targeted copy, Product Hunt developer category

---

## 11. What Should Alpha Screener Say on the Pricing Page — Exact Copy Recommendations

**Current state problems:**
- The hero ("Choose your edge") is generic — it could be any SaaS tool
- The free tier is described as "Get started with basics" — undersells paper trading and signals
- Pro is "For serious traders" — too vague, doesn't name the actual pain
- Elite is "Full arsenal unlocked" — sounds like a game, not a professional tool

**Recommended copy, section by section:**

### Headline (replace "Choose your edge")
```
Your trading signals. Tracked. Proven. Delivered to your phone.
```
Or for higher-stakes variant:
```
Stop paying $80/month for Telegram signals that don't publish their win rate.
```

### Pricing page subheadline (replace current)
```
Every signal we generate is tracked server-side. Win rates are public. 
No black boxes. No mystery. Just data.
```

### Free tier card (replace "Get started with basics")
```
Free — Forever
Try the signal engine. No credit card. No expiry.

- 3 signals per day (Swing mode)
- 5 assets: Gold, Bitcoin, ETH, EUR/USD, GBP/USD
- Paper trading with $10,000 virtual balance
- Public accuracy leaderboard access
```

### Pro tier card (replace "For serious traders")
```
Pro — $29/month
For traders who want signals on their phone before the market moves.

Everything in Free, plus:
- Unlimited signals, all 12 assets
- All modes: Swing · Intraday · Scalper
- Telegram bot alerts — get notified the second a signal fires
- Backtesting: see historical win rates before you risk real money
- Webhook outbound: connect to your trading bot
- API access (10,000 requests/day)
- Custom alert rules: trigger on RSI, MACD, Bollinger thresholds
```

### CTA button (replace "Subscribe to Pro")
```
Start 7-Day Free Trial → (if offering trial)
OR
Get Signal Alerts for $29/month →
```

### Social proof row (add below pricing cards — currently missing)
```
[Live accuracy stats pulled from /api/accuracy]
"XAUUSD Swing: 63% win rate over last 30 days · 847 signals tracked"
"BTCUSD Intraday: 58% win rate · 1,204 signals tracked"
These are real numbers. Pulled from our database. Updated every 15 minutes.
```

### Annual toggle label (replace "Save 17%")
```
Annual — Save $60/year   [badge: Best Value]
```

---

## 12. Concrete Recommendations to Improve Paid Conversion (Prioritised)

**Priority 1 — Fix the conversion wall at 3 signals/day (HIGH IMPACT, LOW EFFORT)**
The 3-signal/day free limit is the right gate. But the current UX silently fails — the user hits a wall with no emotional trigger.
Action: When the 3rd signal is consumed, show a modal: "You've used your 3 free signals today. You missed [X] other signals on your watched assets. See what you missed → Upgrade to Pro."
This turns the limit from friction into FOMO — the most powerful conversion trigger for Segment A.

**Priority 2 — Surface the accuracy leaderboard in onboarding (HIGH IMPACT, LOW EFFORT)**
The public win rate data exists at /accuracy and /leaderboard but is not shown to new users before they form an opinion of the product.
Action: On first dashboard visit, show a banner or onboarding step: "XAUUSD Swing has a 63% win rate over the last 847 signals. Here's the data →" Link to /accuracy.
This single change addresses Objection 4 (do the signals work?) before it forms.

**Priority 3 — Add a 7-day free trial for Pro (MEDIUM IMPACT, MEDIUM EFFORT)**
The category conversion benchmark for signal tools with a free tier but no trial is 1–3%. Adding a 7-day no-card trial typically lifts this to 3–6%.
Action: Gate the trial behind email verification (already have NextAuth). Cancel-before-7-days requires explicit action — default to charging. This is standard practice (TradingView, TrendSpider both do this).

**Priority 4 — Make the Telegram bot the primary upgrade hook (MEDIUM IMPACT, LOW EFFORT)**
Currently the Telegram bot is listed 7th in the Pro feature table. For Segment A, it is the #1 reason to upgrade.
Action: Move Telegram bot to position 2 in the Pro feature list (right after "Unlimited signals"). Change the Pro badge from "Recommended" to "Most Popular for Mobile Traders". Add a micro-copy line: "Average user gets their first Telegram alert within 3 minutes of subscribing."

**Priority 5 — Publish a landing page section showing the head-to-head vs Telegram signal groups (MEDIUM IMPACT, MEDIUM EFFORT)**
The README already has the TradingView comparison table. The pricing page and landing page do not.
Action: Add a "vs Telegram VIP groups" section with: price comparison, accountability comparison (public win rate vs no accountability), coverage comparison. This is the specific competitor Segment A is evaluating against.

**Priority 6 — Marketplace as a retention mechanism, not just acquisition (LOW EFFORT, HIGH LTV IMPACT)**
The signal marketplace is live but empty at launch. Community-generated strategies are a retention loop: users who publish strategies on the marketplace have extremely low churn because they have financial stake in the platform.
Action: In the first 30 days, personally recruit 5–10 traders to publish strategies (even at $1–$5) to seed the marketplace. Offer them Elite free for 3 months in exchange. An empty marketplace is a trust-killer; a seeded marketplace with 20+ listings is social proof.

**Priority 7 — GitHub to SaaS conversion flow (MEDIUM IMPACT, MEDIUM EFFORT)**
A meaningful percentage of the open-source audience will self-host but never see the SaaS pricing. The README currently does not have a path to the hosted SaaS.
Action: Add to README immediately after the feature table: "Don't want to manage the infrastructure? [Alpha Screener Cloud] — all of this, hosted, $29/month. Signals running in 5 minutes." This captures Segment C before they vanish into their own instance.

---

## 13. Who Does NOT Convert (Anti-Personas)

**Anti-Persona 1: The Passive Retail Investor**
- Buys ETF/crypto and holds for months
- Doesn't care about daily BUY/SELL signals — wants price alerts, not TA
- Will use the free tier paper trading as a game, never open a live account
- Conversion probability: near zero. Don't waste marketing budget here.

**Anti-Persona 2: The Professional Quant or Institutional Trader**
- Has Bloomberg Terminal, Python stack, institutional data feeds
- A 6-factor indicator combo on 12 retail assets is not their toolkit
- May contribute to the open-source repo but will never pay $29/month for it
- Conversion probability: zero. They are valuable for GitHub stars, not revenue.

**Anti-Persona 3: The Developer Who Just Wants the API**
- Wants to consume signals programmatically, doesn't care about the dashboard
- Will self-host to avoid paying for features they don't use
- May convert to Pro for the API key tier, but churns within 60 days once they fork the codebase
- Conversion probability: low for sustained subscription. Better served by a usage-based API pricing model (not currently offered).

**Anti-Persona 4: The Crypto Newcomer with No Live Account**
- Discovered crypto in the last 6 months, has no live trading account
- Uses Alpha Screener as a learning tool
- Will ask "what does MACD mean" and churn after the first confusing signal
- Conversion probability: 1–2%. Not zero, but the CAC is too high. The product is not designed for financial education.

**Anti-Persona 5: The Dedicated TradingView Power User**
- Has TradingView Premium ($59.95/mo), has built their own Pine Script indicators
- The overlap with Alpha Screener is high but the switching cost is also high
- They already have backtesting, alerts, and charting
- Conversion probability: low unless you position on the Telegram + webhook automation angle that TradingView lacks
- If converting this segment is a goal, that requires dedicated messaging on the webhook/API features — not the signal discovery features.

---

## Appendix: Key Numbers to Track

| Metric | Baseline estimate | Target at 90 days |
|---|---|---|
| Free-to-Pro conversion | 1–2% (cold) | 3–4% with Priority 1+2 changes |
| Monthly churn (Pro) | 10–15% initially | <8% at 6 months |
| Payback period per subscriber | ~1 month at $29 | — |
| Break-even MRR | ~$500 (infra + time) | 18 Pro subscribers |
| LTV at 8% monthly churn | ~$362 (12.5 mo avg) | Target $500+ with annual plan push |
| Marketplace GMV contribution | $0 at launch | $200–$500/mo at 6 months with seeding |

