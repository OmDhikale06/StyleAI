// Small dependency-free limiter for authentication endpoints.
// It intentionally stays local to each process; Render/multi-instance deployments
// should use an edge/WAF limiter for a stronger distributed control.
const buckets = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 30;

export function authRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const current = buckets.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    return next();
  }
  if (current.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.max(1, Math.ceil((WINDOW_MS - (now - current.startedAt)) / 1000));
    res.set("Retry-After", String(retryAfter));
    return res.status(429).json({ success: false, message: "Too many authentication attempts. Please try again later." });
  }
  current.count += 1;
  next();
}

// Avoid retaining inactive client addresses forever in long-running processes.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (now - bucket.startedAt >= WINDOW_MS) buckets.delete(key);
}, WINDOW_MS).unref();
