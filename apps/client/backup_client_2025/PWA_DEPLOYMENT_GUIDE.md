# 🚀 PWA Deployment Guide - 꽃배달 플랫폼 Client

## 📱 PWA Features Configured

✅ **Offline Support** - Works without internet
✅ **Install to Home Screen** - Acts like native app
✅ **Camera Access** - For delivery photos
✅ **Push Notifications** (ready for future)
✅ **Fast Loading** - Cached resources

## 🔧 Setup Steps

### 1. Install Dependencies
```bash
cd C:\work_station\flower\apps\client
pnpm add next-pwa workbox-webpack-plugin
```

### 2. Create App Icons
You need to create icon files in `public/icons/`:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

**Icon Generator Tools:**
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/

### 3. Environment Variables
Create `.env.production`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 4. Build for Production
```bash
pnpm build
```

## 🌐 Deployment Options

### Option 1: Vercel (Recommended for Next.js)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Advantages:**
- Automatic HTTPS
- Global CDN
- Easy rollbacks
- Preview deployments
- Analytics included

### Option 2: Netlify
```bash
# Build command
pnpm build

# Publish directory
.next
```

### Option 3: Self-Hosted with PM2
```bash
# Build
pnpm build

# Install PM2
npm i -g pm2

# Start with PM2
pm2 start npm --name "flower-client" -- start

# Save PM2 config
pm2 save
pm2 startup
```

### Option 4: Docker
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 PWA Checklist

### Before Deployment:
- [ ] Icons created (all sizes)
- [ ] manifest.json updated
- [ ] Environment variables set
- [ ] Build successful
- [ ] HTTPS configured (required for PWA)

### After Deployment:
- [ ] Test install to home screen (mobile)
- [ ] Test offline mode
- [ ] Test camera access
- [ ] Check Lighthouse PWA score
- [ ] Verify caching works

## 🔍 Testing PWA

### Chrome DevTools:
1. Open Chrome DevTools (F12)
2. Go to "Application" tab
3. Check "Manifest" section
4. Check "Service Workers" section
5. Test "Add to Home Screen"

### Lighthouse Audit:
1. Open Chrome DevTools
2. Go to "Lighthouse" tab
3. Check "Progressive Web App"
4. Run audit
5. Target score: 90+

## 📱 Mobile Installation

### Android:
1. Open site in Chrome
2. Tap menu (3 dots)
3. Tap "Install app" or "Add to Home screen"

### iOS:
1. Open site in Safari
2. Tap Share button
3. Tap "Add to Home Screen"

## 🚨 Important Notes

1. **HTTPS Required**: PWA features only work on HTTPS (except localhost)

2. **Service Worker Updates**: Changes to service worker may take time to propagate. Users might need to close all tabs and reopen.

3. **Cache Strategy**: Currently configured as:
   - Network First for API calls (5 min cache)
   - Cache First for fonts (1 year)
   - Network First for images (1 week)

4. **Offline Limitations**:
   - New orders cannot be created offline
   - Photo uploads require connection
   - But viewing existing orders works offline

## 🎯 Performance Tips

1. **Optimize Images**:
   - Use WebP format
   - Compress images before upload
   - Lazy load images

2. **Code Splitting**:
   - Already handled by Next.js
   - Check bundle size with `pnpm analyze`

3. **Monitoring**:
   - Use Vercel Analytics
   - Or Google Analytics
   - Monitor Core Web Vitals

## 🆘 Troubleshooting

### PWA not installing?
- Check HTTPS
- Verify manifest.json
- Check icon files exist
- Clear cache and retry

### Service Worker not updating?
- Clear browser cache
- Unregister old service worker
- Hard refresh (Ctrl+Shift+R)

### Camera not working?
- Check HTTPS
- Verify permissions
- Test in different browser

## 📞 Support

For deployment issues:
- Vercel: https://vercel.com/support
- Netlify: https://www.netlify.com/support/
- PWA: https://web.dev/pwa/

---

**Ready to Deploy! 🚀**

The client app is configured as a full PWA with offline support, camera access, and installability. Choose your deployment platform and follow the steps above.