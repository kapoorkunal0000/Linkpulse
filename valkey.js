const Redis = require("ioredis");

console.log("DEBUG: REDIS_URL =", process.env.REDIS_URL ? "***SET***" : "NOT SET");

const client = new Redis(process.env.REDIS_URL || {
  host: "localhost",
  port: 6379,
}, {
  tls: process.env.REDIS_URL ? {} : undefined,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

client.on("connect", () => console.log("✅ Valkey: connected"));
client.on("error", (err) => console.error("❌ Valkey error:", err.message));

client.connect().catch(err => {
  console.warn("⚠️  Running without cache:", err.message);
});

module.exports = client;