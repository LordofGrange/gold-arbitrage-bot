import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";
import { getPrices } from "./utils/priceFetcher.js";
import { postWebhook } from "./utils/webhook.js";
import { maybeExecuteTrade } from "./utils/trader.js";

dotenv.config();

const app = express();
app.use(express.json());

const CHECK_CRON = process.env.CHECK_CRON || "*/15 * * * *";
const THRESH = Number(process.env.ARBITRAGE_THRESHOLD || 10);
const MODE = (process.env.EXECUTION_MODE || "SIMULATED").toUpperCase();

let last = {
  timestamp: null,
  hkPrice: null,
  usPrice: null,
  delta: null,
  action: "HOLD",
  trade: null,
  mode: MODE,
};

async function runOnce() {
  try {
    const { hkPrice, usPrice } = await getPrices();
    const delta = (hkPrice ?? 0) - (usPrice ?? 0); // HK - US
    let action = "HOLD";
    if (delta > THRESH) action = "SELL_US_BUY_HK";
    else if (delta < -THRESH) action = "BUY_US_SELL_HK";

    last = {
      timestamp: new Date().toISOString(),
      hkPrice,
      usPrice,
      delta,
      action,
      trade: null,
      mode: MODE,
    };

    await postWebhook({ type: "check", ...last });

    if (action !== "HOLD") {
      const trade = await maybeExecuteTrade({ mode: MODE, action, hkPrice, usPrice, delta });
      last.trade = trade || null;
      await postWebhook({ type: "trade", ...last });
    }

    console.log(`[${last.timestamp}] HK:${hkPrice} | US:${usPrice} | Δ:${delta?.toFixed?.(2)} | ${action} | MODE=${MODE}`);
  } catch (err) {
    console.error("Run error:", err?.message || err);
  }
}

app.get("/status", (_req, res) => res.json({ ok: true, ...last }));
app.get("/run-now", async (_req, res) => { await runOnce(); res.json({ ok: true, ranAt: new Date().toISOString(), ...last }); });
app.use("/dashboard", express.static("public"));

app.listen(process.env.PORT || 3000, async () => {
  console.log(`Gold bot listening on ${process.env.PORT || 3000}`);
  await runOnce();
  cron.schedule(CHECK_CRON, runOnce, { timezone: "UTC" });
});
