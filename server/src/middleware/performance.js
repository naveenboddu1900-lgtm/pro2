import { randomUUID } from "crypto";

const requestMetrics = [];
const MAX_METRICS = 100;

export function requestTimer(req, res, next) {
  const startedAt = process.hrtime.bigint();
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1000000;
    requestMetrics.push({
      id: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      finishedAt: new Date().toISOString()
    });

    if (requestMetrics.length > MAX_METRICS) {
      requestMetrics.shift();
    }
  });

  next();
}

export function getPerformanceSnapshot() {
  const totalDuration = requestMetrics.reduce((sum, metric) => sum + metric.durationMs, 0);

  return {
    totalRequests: requestMetrics.length,
    averageDurationMs: requestMetrics.length ? Math.round((totalDuration / requestMetrics.length) * 100) / 100 : 0,
    recent: requestMetrics.slice(-20).reverse()
  };
}
