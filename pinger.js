const valkey = require("./valkey");
const axios = require("axios");

const PING_INTERVAL_MS = 30000;
const HISTORY_MAX = 20;

async function pingUrl(url) {
  const start = Date.now();
  let status = "down";
  let ms = null;

  try {
    const res = await axios.get(url, { timeout: 8000 });
    ms = Date.now() - start;
    status = ms > 3000 ? "slow" : "up";
  } catch {
    ms = null;
    status = "down";
  }

  const result = { url, status, ms, checkedAt: new Date().toISOString() };

  await valkey.hset(`linkpulse:status:${url}`, {
    status,
    ms: ms ?? -1,
    checkedAt: result.checkedAt,
  });

  await valkey.lpush(`linkpulse:history:${url}`, JSON.stringify(result));
  await valkey.ltrim(`linkpulse:history:${url}`, 0, HISTORY_MAX - 1);

  // Update uptime counters
  await valkey.incr(`linkpulse:total:${url}`);
  if (status === "up") await valkey.incr(`linkpulse:uptotal:${url}`);

  await valkey.publish("linkpulse:events", JSON.stringify(result));

  console.log(`[${result.checkedAt}] ${url} → ${status} ${ms ? ms + "ms" : "timeout"}`);
  return result;
}

async function pingAll() {
  const urls = await valkey.smembers("linkpulse:urls");
  if (urls.length === 0) return;
  await Promise.all(urls.map(pingUrl));
}

function startPinger() {
  console.log("Pinger: started, pinging every 30s");
  pingAll();
  setInterval(pingAll, PING_INTERVAL_MS);
}

module.exports = { startPinger, pingUrl };