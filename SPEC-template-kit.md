# SPEC: LDP Sales Kit — Template đóng gói cho học viên
Version: 0.2
Date: 2026-05-09

---

## 1. Mục tiêu

Đóng gói hệ thống LP bán hàng tự động (SePay + Google Sheet + Vercel) thành **template repo** có thể nhân bản cho học viên không cần biết kỹ thuật sâu.

Học viên fork repo → sửa 1 file config → chạy `./setup.sh` → có LP live nhận tiền tự động.

---

## 2. Đối tượng học viên

- Không biết code, biết dùng terminal cơ bản (copy/paste lệnh)
- Bán: sản phẩm số (ebook, template, khóa học), vật lý dropship, dịch vụ
- Thanh toán: chuyển khoản ngân hàng (SePay) + PayPal (optional)

---

## 3. Stack (giữ nguyên)

| Layer | Tech | Vai trò |
|-------|------|---------|
| Frontend | HTML + Vanilla CSS/JS | Landing page single file |
| Backend logic | Google Apps Script | Xử lý đơn hàng, gửi email |
| Database | Google Sheet | Lưu đơn hàng, học viên xem trực tiếp |
| Hosting | Vercel | Frontend + API routes (webhook proxy) |
| Payment | SePay (MBBank) + PayPal (optional) | Nhận tiền tự động |
| Deploy GAS | clasp CLI | Push + deploy GAS 1 lệnh |
| Deploy Vercel | vercel CLI | Deploy frontend 1 lệnh |

---

## 4. Quyết định kiến trúc

| Vấn đề | Quyết định | Lý do |
|--------|-----------|-------|
| Domain | Học viên dùng domain riêng | Tự chủ, không phụ thuộc vào bạn |
| GAS setup | **Option B**: học viên "Make a copy" từ GAS template published | Không cần `clasp create`, đơn giản nhất |
| PayPal | Optional — bỏ trống nếu không dùng | Không phải ai cũng cần |
| Webhook retry | Vercel chỉ trả `200` khi GAS confirm thành công, trả `500` nếu fail → SePay tự retry | Tránh mất đơn khi GAS timeout |

---

## 5. GAS Template — "Make a copy" flow

Bạn publish 1 GAS project dạng template (không phải Library):

1. Bạn tạo GAS project mẫu → **File → Make a copy** → share link dạng:
   `https://script.google.com/d/{SCRIPT_ID}/edit`
2. Học viên mở link → click "Make a copy" → có GAS project riêng trong Google Drive của họ
3. Học viên điền config trong GAS → deploy → lấy URL
4. Paste GAS URL vào `config.js`

**Không cần `clasp create`** — clasp chỉ dùng để push update sau này nếu học viên muốn custom.

---

## 6. Cấu trúc repo template

```
ldp-sales-kit/
├── config.js                 # ← HỌC VIÊN CHỈ SỬA FILE NÀY
├── setup.sh                  # Kiểm tra deps + deploy tự động
├── index.html                # LP template (đọc config.js)
├── privacy.html              # Trang chính sách
├── terms.html                # Điều khoản
├── vercel.json               # Vercel config
├── gas/
│   ├── Code.js               # GAS backend — chỉ dùng nếu học viên muốn custom qua clasp
│   └── appsscript.json
├── api/
│   ├── webhook.js            # SePay webhook proxy (có retry logic)
│   ├── paypal-create-order.js
│   └── paypal-capture-order.js
├── assets/
│   └── (logo, favicon placeholder)
├── .env.example              # Các biến cần set trên Vercel
├── README.md                 # Hướng dẫn setup 6 bước
└── SPEC-template-kit.md      # File này
```

---

## 7. File config.js — Single source of truth

Học viên chỉ sửa file này. Mọi nơi khác đọc từ đây.

```javascript
const CONFIG = {
  // ── SẢN PHẨM ──────────────────────────────────────────────
  PRODUCT_NAME:      'Tên sản phẩm của bạn',
  PRODUCT_DESC:      'Mô tả ngắn 1 dòng',
  PRODUCT_PRICE_VND: '168,000đ',
  PRODUCT_PRICE_USD: '$7 USD',        // Để trống nếu không bán USD

  // ── THANH TOÁN ─────────────────────────────────────────────
  BANK_NAME:         'MB Bank',       // Tên ngân hàng hiển thị
  BANK_ACCOUNT:      '0123456789',    // Số tài khoản
  BANK_OWNER:        'NGUYEN VAN A',  // Tên chủ TK (viết hoa, không dấu)
  BANK_PREFIX:       'ORD',           // Prefix mã ref đơn hàng (3-5 ký tự)

  // ── DELIVERY ───────────────────────────────────────────────
  PRODUCT_TYPE:      'digital',       // 'digital' | 'physical' | 'service'
  DOWNLOAD_LINK:     '',              // digital: link Drive/Dropbox
  DELIVERY_DAYS:     '',              // physical: "3-5 ngày"
  CONTACT_HOURS:     '24',           // service: liên hệ trong X giờ

  // ── BACKEND ────────────────────────────────────────────────
  GAS_URL:           'https://script.google.com/macros/s/xxx/exec', // Lấy sau khi deploy GAS

  // ── THÔNG TIN LIÊN HỆ ──────────────────────────────────────
  SUPPORT_EMAIL:     'email@example.com',
  SENDER_NAME:       'Tên thương hiệu',

  // ── GIAO DIỆN ──────────────────────────────────────────────
  PRIMARY_COLOR:     '#06142f',       // Màu chính (nền header, buttons)
  ACCENT_COLOR:      '#1d6fe3',       // Màu accent (CTA, links)
  LOGO_URL:          '',              // URL logo — để trống nếu chỉ dùng text

  // ── PAYPAL (optional — xóa hoặc để trống nếu không dùng) ──
  PAYPAL_ENABLED:    false,
  PAYPAL_AMOUNT:     '',              // Số tiền USD
  // PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET: set trong Vercel env vars
};
```

---

## 8. Webhook retry logic

**Vấn đề hiện tại**: Vercel trả `200` ngay → SePay không retry khi GAS lỗi.

**Fix**: `api/webhook.js` đợi GAS response, chỉ trả `200` khi GAS trả `success: true`.

```javascript
// Nếu GAS thành công → 200 (SePay đánh dấu done)
// Nếu GAS lỗi/timeout → 500 (SePay retry tối đa 3 lần, mỗi 5 phút)
const gasData = await gasRes.json();
if (!gasData.success) {
  return res.status(500).json({ success: false });
}
return res.status(200).json({ success: true });
```

**Timeout**: set `maxDuration: 30` trong `vercel.json` cho route `/api/webhook`.

---

## 9. Email delivery theo loại sản phẩm

| PRODUCT_TYPE | Nội dung email |
|-------------|----------------|
| `digital` | "Thanh toán xác nhận — link tải file ngay" + DOWNLOAD_LINK |
| `physical` | "Đơn hàng xác nhận — sẽ giao hàng trong DELIVERY_DAYS" + thông tin liên hệ |
| `service` | "Đã nhận thanh toán — team sẽ liên hệ trong CONTACT_HOURS giờ" |

---

## 10. Hướng dẫn setup cho học viên (6 bước)

1. **Fork repo** → clone về máy
2. **Sửa `config.js`** — điền tên SP, giá, STK, link file/loại SP
3. **Tạo Google Sheet** → copy ID từ URL → paste vào `config.js`
4. **"Make a copy" GAS template** → [link template] → điền SHEET_ID → Deploy → copy URL → paste vào `config.js`
5. **Chạy `./setup.sh`** → Vercel deploy tự động → nhận domain
6. **Connect domain riêng** trên Vercel dashboard → paste Webhook URL vào SePay

---

## 11. .env.example

```bash
# Vercel environment variables
GAS_URL=https://script.google.com/macros/s/xxx/exec

# PayPal (optional — bỏ qua nếu PAYPAL_ENABLED = false)
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
```

---

## 12. Việc cần làm trước khi đóng gói

### Must-have
- [ ] Tách config ra `config.js` thật sự — hiện rải rác trong `gas/Code.js` + `index.html`
- [ ] `api/webhook.js` — đổi sang retry logic (trả 500 khi GAS fail)
- [ ] Email template cho `physical` và `service`
- [ ] `setup.sh` hoàn chỉnh — check deps, vercel link, vercel deploy, in output
- [ ] Publish GAS template (Make a copy link)
- [ ] Xóa data thật khỏi repo (Sheet ID, GAS URL, domain thật)
- [ ] `.env.example`
- [ ] `README.md` 6 bước + screenshot/video link

### Nice-to-have (v2)
- [ ] Coupon code / discount
- [ ] Upsell section sau thanh toán thành công
- [ ] Multi-bank support (không chỉ MBBank)

---

## 13. Admin page — resend email

**Lý do**: khi khách báo không nhận được mail, học viên không biết gọi API hay dùng terminal.

**File**: `admin.html` — single file, không cần backend riêng.

### Bảo mật
- Truy cập qua `https://domain.com/admin.html?key=ADMIN_KEY`
- `ADMIN_KEY` hardcode trong `config.js` — nếu sai key → chặn, không render form
- Không cần login session, đủ an toàn cho use case này

### UI

```
┌─────────────────────────────────────┐
│  🔧 Admin — Resend Email            │
│                                     │
│  Mã ref đơn hàng:                   │
│  [ CC30-XXXXXX              ] [Gửi] │
│                                     │
│  ✓ Đã gửi email đến                 │
│    khach@gmail.com                  │
└─────────────────────────────────────┘
```

### Config bổ sung trong config.js

```javascript
ADMIN_KEY: 'matkhau-bi-mat',  // Đổi thành chuỗi random, khó đoán
```

### Cập nhật GAS endpoint `?action=resend`

Đã có sẵn trong `gas/Code.js` — `handleResendDelivery(ref)`:
- Tìm đơn theo ref
- Nếu vẫn PENDING → update PAID_BANK + ghi thời gian
- Gửi email delivery
- Trả `{ success, email, ref, status }`

### Cập nhật cấu trúc repo

```
ldp-sales-kit/
├── admin.html    # ← thêm mới
├── config.js
├── ...
```
