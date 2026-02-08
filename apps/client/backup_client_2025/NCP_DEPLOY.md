# Naver Cloud Platform Deployment Guide

## 1. Prepare Build
```bash
cd C:\work_station\flower\apps\client
pnpm build
```

## 2. Create Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
COPY . .
COPY .next ./.next
COPY public ./public
EXPOSE 3000
CMD ["pnpm", "start"]
```

## 3. Environment Variables
Create `.env.production`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
```

## 4. NCP Container Registry
```bash
docker build -t flower-client .
docker tag flower-client:latest kr.ncr.ntruss.com/your-registry/flower-client:latest
docker push kr.ncr.ntruss.com/your-registry/flower-client:latest
```

## 5. Deploy to NCP Kubernetes or Cloud Functions
- Use Container Registry image
- Set port 3000
- Configure Load Balancer
- Add SSL certificate
