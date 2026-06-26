export function getDeploymentReadiness() {
  return {
    environment: process.env.NODE_ENV || "development",
    checks: {
      databaseConfigured: Boolean(process.env.MONGODB_URI),
      jwtSecretConfigured: Boolean(process.env.JWT_SECRET),
      cacheConfigured: Boolean(process.env.REDIS_URL || process.env.CACHE_DRIVER === "memory"),
      socketServerEnabled: true
    },
    generatedAt: new Date().toISOString()
  };
}
