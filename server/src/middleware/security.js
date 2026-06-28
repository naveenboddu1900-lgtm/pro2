const rateLimitBuckets = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 120;

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);

export function securityHeaders(req, res, next) {
  const origin = req.get("origin");

  if (allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
}

export function rateLimiter(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const currentTime = Date.now();
  const bucket = rateLimitBuckets.get(key) || { count: 0, resetAt: currentTime + WINDOW_MS };

  if (bucket.resetAt <= currentTime) {
    bucket.count = 0;
    bucket.resetAt = currentTime + WINDOW_MS;
  }

  bucket.count += 1;
  rateLimitBuckets.set(key, bucket);

  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, MAX_REQUESTS - bucket.count));
  res.setHeader("X-RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));

  if (bucket.count > MAX_REQUESTS) {
    return res.status(429).json({ message: "Too many requests" });
  }

  return next();
}
