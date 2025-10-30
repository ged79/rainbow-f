# TOSS PAYMENTS LIVE SETUP GUIDE

## 1. Prerequisites for Live Key
- 사업자등록증 
- 통신판매업 신고필증
- 대표자 신분증
- 은행 계좌 정보

## 2. Apply at Toss Dashboard
1. Go to: https://developers.tosspayments.com
2. 가맹점 신청 → 실제 가맹점 등록
3. Submit documents
4. Wait 1-3 business days for approval

## 3. Update Environment Variables
```env
# .env.local
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_gck_YOUR_LIVE_KEY_HERE
TOSS_SECRET_KEY=live_gsk_YOUR_SECRET_KEY_HERE
```

## 4. Update SecureOrderModal.tsx (Line 141)
```javascript
// CHANGE THIS LINE:
const clientKey = 'test_gck_DLJOpm5QrlWWw2a05a5qVPNdxbWn'

// TO:
const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
```

## 5. Update payment/confirm/route.ts
Already using environment variable ✓
```javascript
Authorization: `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`
```

## 6. Test Checklist
- [ ] Test payment with real card (can refund later)
- [ ] Check webhook notifications
- [ ] Verify settlement reports
- [ ] Test refund process

## 7. Important URLs
- Production endpoint: https://api.tosspayments.com
- Test endpoint: https://api.tosspayments.com (same)
- Dashboard: https://app.tosspayments.com
- Docs: https://docs.tosspayments.com

## Notes
- Keep test keys as backup in .env.test
- Never commit live keys to git
- Test thoroughly before going live
