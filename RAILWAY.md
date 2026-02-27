# Deploying the Doppler Indexer on Railway (from scratch)

Use this guide when starting a **new** Railway project (e.g. after deleting the old one). Repo: **https://github.com/anondevv69/doppler-indexer**.

---

## 1. Create a new project

- Go to [Railway](https://railway.app) → **New Project**.
- Name it (e.g. **Doppler Indexer** or **BankrMonitor**).

---

## 2. Add PostgreSQL

- In the project: **+ New** → **Database** → **PostgreSQL**.
- Wait for it to provision. Railway will expose a `DATABASE_URL` variable.

---

## 3. Add the indexer service (your fork)

- **+ New** → **GitHub Repo**.
- Connect GitHub if needed, then choose **anondevv69/doppler-indexer**.
- Railway will clone the repo and try to build/run. You’ll set variables next.

---

## 4. Configure the indexer service

- Open the **indexer service** (the one from the GitHub repo).
- Go to **Variables** and add:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Reference the Postgres service: click **Add variable** → **Reference** → choose the Postgres service → select `DATABASE_URL`. |
| `PONDER_RPC_URL_8453` | Your Base mainnet RPC URL (e.g. from [Alchemy](https://alchemy.com), [QuickNode](https://quicknode.com), or [Infura](https://infura.io)). |
| `PONDER_RPC_URL_130` | Unichain RPC (if you use Unichain in multicurve). |
| `PONDER_RPC_URL_57073` | Ink RPC (if you use Ink). |
| `PONDER_RPC_URL_143` | Monad RPC (if you use Monad). |

- **Build command:** leave default (e.g. `pnpm install` or what Railway infers).
- **Start command:** leave default so it runs `pnpm run start`. The `start` script uses `ponder start --config ./ponder.config.multicurve.ts -p ${PORT:-3000}`, so Railway’s `PORT` is used automatically.
- **Root directory:** leave as repo root.

---

## 5. Deploy and get the indexer URL

- Save variables and let Railway **deploy**.
- When the service is running: **Settings** → **Networking** → **Generate Domain**.
- Copy the URL (e.g. `https://doppler-indexer-xxxx.up.railway.app`). This is your **DOPPLER_INDEXER_URL** for the BankrMonitor bot.

---

## 6. (Optional) Add the BankrMonitor Discord bot

If you want the full stack in one project:

- **+ New** → **GitHub Repo** → select your **BankrMonitor** repo.
- In the bot service **Variables**, set:
  - `DISCORD_BOT_TOKEN`
  - `DISCORD_CLIENT_ID`
  - `DOPPLER_INDEXER_URL` = the indexer URL from step 5
  - `RPC_URL` = Base RPC (for fees/on-chain)
  - Optionally `BANKR_API_KEY`
- Add a **volume** and mount it at `/data`. Then set:
  - `TENANTS_FILE=/data/bankr-tenants.json`
  - Optionally `SEEN_FILE` and `WATCH_FILE` under `/data` so state persists across deploys.

See **BankrMonitor** → `docs/RAILWAY_AND_TENANT_STORAGE.md` for more detail.

---

## Summary

1. New project → Postgres → indexer from **anondevv69/doppler-indexer**.
2. Indexer variables: `DATABASE_URL` (from Postgres) + `PONDER_RPC_URL_*` for each chain.
3. Generate domain for the indexer → use that as `DOPPLER_INDEXER_URL` for the bot.
4. Optionally add BankrMonitor bot with volume at `/data` and `TENANTS_FILE=/data/bankr-tenants.json`.
