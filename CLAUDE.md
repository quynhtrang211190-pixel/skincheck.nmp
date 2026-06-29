# CLAUDE.md — content-calendar-lp

## Deploy

### Google Apps Script
```bash
./deploy-gas.sh
```
- Push code lên GAS + deploy deployment ID cố định
- Deployment URL: `https://script.google.com/macros/s/AKfycbzFYfZMXffEkLIKwBlmsJC-cS1OwgR2bQcZGJ1t89HtoICk0pOlMdGkYMgKoWF-dG4v/exec`
- File deployed: `gas/Code.js` (source để review: `GAS_CODE.js`)

### Vercel (frontend + API routes)
Project đang dùng **Vercel** — `.vercel/project.json` đã linked.
- projectId: `prj_9k0o5dhmfHkkqhHelHcyOOFjghYK`
- orgId: `team_kiX0xuYe6UCSPVlR0zYO33an`

Deploy:
```bash
~/.npm-global/bin/vercel --prod --yes
```

- CLI ở `~/.npm-global/bin/vercel` (v53+), đã login sẵn account `khaikhoinghiep-4133`
- Project đã linked (`.vercel/project.json`), không cần cấu hình thêm
- Production domain: `https://melanocheck-u544.vercel.app` (hoặc `https://30.contentdna.studio`)

## Webhook SePay

- SePay gọi vào: `POST /api/webhook` (Vercel function)
- Vercel forward sang GAS bằng **POST** với body `{ action: 'sepay_webhook', ...payload }`
- GAS `doPost()` → `handleSepayWebhook(body)`
- Field nội dung CK từ MBBank: `content` (KHÔNG phải `transferContent`)

## Stack

- Frontend: `index.html` (single file, vanilla JS)
- API: `api/` (Vercel serverless functions)
- Backend logic: Google Apps Script (`gas/Code.js`)
- Payment: SePay (bank transfer) + PayPal
