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
| `PONDER_RPC_URL_8453` | **Use a dedicated RPC** (Alchemy, QuickNode, Infura, etc.). The public `https://mainnet.base.org` URL will hit rate limits (429) during indexing and backfill will stall. Get a free API key from [Alchemy](https://alchemy.com), [QuickNode](https://quicknode.com), or [Infura](https://infura.io) and set the Base mainnet URL here. |
| `PONDER_RPC_URL_8453_FALLBACK` | _(Optional)_ Second Base RPC URL. When set, the indexer uses viem’s fallback transport: if the primary returns 429 Too Many Requests, it will try this URL. Use another provider (e.g. QuickNode if primary is Alchemy) or a second API key to spread load and avoid rate limits. |
| `PONDER_RPC_URL_130` | Unichain RPC (if you use Unichain in multicurve). |
| `PONDER_RPC_URL_57073` | Ink RPC (if you use Ink). |
| `PONDER_RPC_URL_143` | Monad RPC (if you use Monad). |
| `BANKR_BASE_TOKENS` | _(Optional)_ **Bankr-only mode.** Comma-separated list of base token addresses (0x…). When set, the indexer only stores v4pools and cumulatedFees for pools whose base token is in this list. Reduces DB size and RPC load. Get the list from [bankr.bot](https://bankr.bot) launches (token addresses) or your own list. Example: `0xabc...,0xdef...` |

- **Build command:** leave default (e.g. `pnpm install` or what Railway infers).
- **Start command:**
  - **Full index (all apps):** leave default so it runs `pnpm run start` (uses `ponder.config.multicurve.ts`). Indexes Doppler, Ohara, Long, Duels, Zora, Bankr, etc. — more RPC load and 429s.
  - **Bankr only (recommended if you only need Bankr):** set **Custom Start Command** to:
    ```bash
    pnpm run start:bankr
    ```
    This uses `ponder.config.bankr-only.ts`: Base chain only, and only DecayMulticurveInitializer, DecayMulticurveInitializerHook, RehypeDopplerHookMigrator, plus the BankrWethPrice and BaseChainlinkEthPriceFeed blocks. No Zora, Ohara, Long, Duels, etc. — fewer RPC calls and less chance of 429s.
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
5. **Bankr-only:** Either (a) use **Custom Start Command** `pnpm run start:bankr` so the indexer only syncs Bankr contracts on Base (see above), or (b) use the full config and set `BANKR_BASE_TOKENS` to a comma-separated list of token addresses to only store v4pools/cumulatedFees for those tokens.