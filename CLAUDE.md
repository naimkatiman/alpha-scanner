@AGENTS.md

# Alpha Scanner — Claude Code Config

## Stack
Next.js 16, TypeScript, Tailwind CSS v4, canvas-based charts
Repo: https://github.com/naimkatiman/alpha-scanner

## Mandatory ECC Skill Usage

Before writing ANY code, use the appropriate ECC skill:

- **Planning tasks** → `/plan "task description"` first
- **New features** → `/tdd` — write tests first
- **TypeScript files** → follow `~/.claude/skills/coding-standards/`
- **React/Next.js components** → follow `~/.claude/skills/frontend-patterns/`
- **API routes** → follow `~/.claude/skills/api-design/`
- **Frontend redesign** → use `~/.claude/skills/` + taste-skill from `.agents/skills/`
- **Before PRs** → `/code-review` + `/security-scan`
- **Build errors** → `/build-fix`
- **After milestones** → `/learn` to extract patterns

## Rules (non-negotiable)
- `npm run build` must pass before every commit
- Prefer free/no-auth APIs (CoinGecko public, fawazahmed0)
- Dark fintech theme: #0a0a0a bg, emerald green for BUY, red for SELL
- All work in `/home/naim/.openclaw/workspace/alpha-scanner/`
