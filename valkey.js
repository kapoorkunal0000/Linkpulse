const Redis = require("ioredis");

const client = new Redis({
  host: process.env.VALKEY_HOST,
  port: parseInt(process.env.VALKEY_PORT),
  password: process.env.VALKEY_PASSWORD,
  tls: {},
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) {
      console.error("Valkey: giving up after 5 retries");
      return null;
    }
    return Math.min(times * 200, 2000);
  },
});

client.on("connect", () => console.log("Valkey: connected"));
client.on("error", (err) => console.error("Valkey error:", err.message));

module.exports = client;