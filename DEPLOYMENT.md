# Deployment Checklist

## Required Environment

- `NODE_ENV=production`
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `REDIS_URL` or `CACHE_DRIVER=memory`

## Verification

```bash
npm install
npm run check
npm run client:build
npm start
```

## Runtime Checks

```text
GET /health
GET /ready
GET /api/admin/performance
```

## Security Notes

- Security headers are enabled in Express.
- A basic IP rate limiter protects API routes.
- JWT secrets must be replaced before deployment.
- MongoDB and Redis should run on private network access only.
