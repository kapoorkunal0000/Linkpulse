const Redis = require("ioredis");

const redisUrl = process.env.REDIS_URL ||
  (process.env.VALKEY_HOST
    ? `rediss://default:${process.env.VALKEY_PASSWORD}@${process.env.VALKEY_HOST}:${process.env.VALKEY_PORT}`
    : null);

console.log("DEBUG: REDIS_URL =", redisUrl ? "***SET***" : "NOT SET");

const client = redisUrl
  ? new Redis(redisUrl, { tls: {}, maxRetriesPerRequest: 3, lazyConnect: true })
  : new Redis({ host: "localhost", port: 6379, maxRetriesPerRequest: 3, lazyConnect: true });

client.on("connect", () => console.log("✅ Valkey: connected"));
client.on("error", (err) => console.error("❌ Valkey error:", err.message));

client.connect().catch(err => {
  console.warn("⚠️  Running without cache:", err.message);
});

module.exports = client;