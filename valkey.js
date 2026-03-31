const Redis = require("ioredis");

console.log("DEBUG: VALKEY_HOST =", process.env.VALKEY_HOST);
console.log("DEBUG: VALKEY_PORT =", process.env.VALKEY_PORT);
console.log("DEBUG: VALKEY_PASSWORD =", process.env.VALKEY_PASSWORD ? "***SET***" : "NOT SET");

const client = new Redis({
  host: process.env.VALKEY_HOST || "localhost",
  port: parseInt(process.env.VALKEY_PORT || 6379),
  password: process.env.VALKEY_PASSWORD,
  tls: process.env.VALKEY_HOST ? {} : undefined,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) {
      console.error("Valkey: giving up after 5 retries");
      return null;
    }
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
});

client.on("connect", () => console.log("Valkey: connected"));
client.on("error", (err) => console.error("Valkey error:", err.message));

// Try to connect, don't crash if it fails
client.connect().catch(err => {
  console.warn("Valkey connection failed, app will run without cache:", err.message);
});

module.exports = client;