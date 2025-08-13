# Gold Arbitrage Bot (Railway-ready, phone-friendly)

**Features**
- 15-minute price checks via cron
- Flexible price fetcher (accepts `{price}`, `{rate}`, `rates.XAU`, or raw number)
- Arbitrage decision + optional trade execution (SIMULATED by default; LIVE via env)
- Webhook on every check/trade
- Live dashboard at `/dashboard` and JSON status at `/status`

## 1) Deploy (Railway)
1. Create a GitHub repo, upload these files (or unzip and drag/drop in the GitHub UI).
2. In Railway: **New Project → Deploy from GitHub** → select your repo.
3. In **Project → Variables**, paste the keys from `.env.example` (at minimum set `NYMEX_PRICE_URL` and `HANG_SENG_PRICE_URL` to working endpoints).
4. Deploy and open your Railway URL:
   - `/dashboard` → UI
   - `/status` → JSON
   - `/run-now` → manual run

### Minimal test (no signup)
Set both price URLs to simple JSON endpoints returning `{ "price": 2450 }` and `{ "price": 2465 }` to see a delta.

## 2) LIVE Trading (Polygon)
Set `EXECUTION_MODE=LIVE` **only after testing** and provide:
- `POLYGON_RPC` (e.g., Alchemy Polygon RPC)
- `WALLET_PRIVATE_KEY`, `WALLET_ADDRESS`
- `CONTRACT_ADDRESS`, `CONTRACT_ABI_JSON` (single-line JSON string)
- `CHAIN_ID=137` (Polygon mainnet)

Edit `utils/trader.js` method/params to match your contract method.

## 3) Security
- Keep keys in Railway Variables (never commit them).
- Start in `SIMULATED` mode.
