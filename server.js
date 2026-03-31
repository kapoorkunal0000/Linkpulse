  require("dotenv").config({ override: false });
const express = require("express");
const valkey = require("./valkey");
const { startPinger, pingUrl } = require("./pinger");

const app = express();
app.use(express.json());
app.use(express.static("public"));

app.post("/urls", async (req, res) => {
  const { url } = req.body;
  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "Provide a valid URL starting with http" });
  }
  await valkey.sadd("linkpulse:urls", url);
  const result = await pingUrl(url);
  res.json({ added: true, result });
});

app.get("/status", async (req, res) => {
  const urls = await valkey.smembers("linkpulse:urls");
  const results = await Promise.all(
    urls.map(async (url) => {
      const data = await valkey.hgetall(`linkpulse:status:${url}`);
      const total = parseInt(await valkey.get(`linkpulse:total:${url}`) || 1);
      const upTotal = parseInt(await valkey.get(`linkpulse:uptotal:${url}`) || 0);
      const uptime = ((upTotal / total) * 100).toFixed(1);
      return { url, ...data, uptime };
    })
  );
  res.json(results);
});

app.get("/history", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Provide ?url=https://..." });
  const raw = await valkey.lrange(`linkpulse:history:${url}`, 0, 19);
  res.json(raw.map(JSON.parse));
});

app.get("/events", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const subscriber = valkey.duplicate();
  await subscriber.subscribe("linkpulse:events");
  subscriber.on("message", (channel, message) => {
    res.write(`data: ${message}\n\n`);
  });

  req.on("close", () => {
    subscriber.unsubscribe();
    subscriber.disconnect();
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LinkPulse running on http://localhost:${PORT}`);
  startPinger();
});