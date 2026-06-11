# 🎓 HƯỚNG DẪN THIẾT LẬP HỆ THỐNG BÁN HÀNG TỰ ĐỘNG (DÀNH CHO HỌC VIÊN)

Hệ thống này giúp bạn tự động hóa 100% quy trình bán sản phẩm số: **Khách hàng đăng ký ➔ Chuyển khoản (SePay) hoặc thanh toán thẻ (PayPal) ➔ Hệ thống tự nhận tiền, tự động cập nhật Google Sheet ➔ Gửi email chứa file tải về ➔ Thông báo Telegram báo cáo doanh thu theo thời gian thực.**

Tài liệu này hướng dẫn bạn chi tiết từng bước (Step-by-step) để tự cài đặt và vận hành hệ thống của riêng mình từ file ZIP mã nguồn được chia sẻ.

---

## 🎯 TỔNG QUAN KIẾN TRÚC HỆ THỐNG
```
┌──────────────────┐    webhook   ┌──────────────┐   forward    ┌──────────────────┐
│ SePay / MBBank   │ ───────────▶ │  Vercel API  │ ───────────▶ │ Google Apps      │
│ (Chuyển khoản)   │              │  /api/webhook│              │ Script (GAS)     │
└──────────────────┘              └──────────────┘              └────────┬─────────┘
                                                                         │
┌──────────────────┐    callback  ┌──────────────┐                       │
│ PayPal Checkout  │ ───────────▶ │  Vercel API  │ ──────────────────────┘
│ (Thẻ quốc tế)    │              │  /api/paypal*│
└──────────────────┘              └──────────────┘
                                                                         ▼
                                                                ┌──────────────────┐
                                                                │   Google Sheet   │
                                                                │  (Database chính)│
                                                                └────────┬─────────┘
                                                                         │
                                                   ┌─────────────────────┼─────────────────────┐
                                                   ▼                     ▼                     ▼
                                            ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
                                            │   MailApp    │      │ Telegram Bot │      │ Báo cáo ngày │
                                            │ (Gửi email)  │      │ (Ping đơn)   │      │ (Cron daily) │
                                            └──────────────┘      └──────────────┘      └──────────────┘
```

---

## 🔑 DANH SÁCH CÁC KHÓA (KEYS) & ĐƯỜNG DẪN (LINKS) CẦN THAY THẾ
Khi mở mã nguồn ra, bạn cần thay thế toàn bộ thông tin của giảng viên bằng thông tin cá nhân của bạn:

| Tên file | Vị trí (Dòng) | Nội dung cần thay thế | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| **`index.html`** | `dòng 716` | Thay đổi `GAS_URL` | Đường dẫn Web App Google Apps Script của bạn |
| **`admin.html`** | `dòng 189` | Thay đổi `GAS_URL` | Đường dẫn Web App Google Apps Script của bạn |
| **`admin.html`** | `dòng 188` | Thay đổi `ADMIN_KEY` | Đổi `'khaidaica'` thành mật khẩu quản trị của riêng bạn |
| **`gas/Code.js`** | `dòng 16 - 37` | Cấu hình `CONFIG` | Sửa `SHEET_ID`, Tên sản phẩm, Giá bán, Link tải file Google Drive, MBBank Account của bạn |

---

## 🚀 QUY TRÌNH THIẾT LẬP 6 BƯỚC CHI TIẾT

### BƯỚC 1: GIẢI NÉN FILE MÃ NGUỒN
1. Tải file **`content-calendar-lp.zip`** từ nhóm học tập hoặc Drive được giảng viên chia sẻ về máy tính.
2. Click đúp chuột (hoặc chuột phải chọn Extract) để **Giải nén** file ra.
3. Bạn sẽ nhận được một thư mục có tên là **`content-calendar-lp`** chứa toàn bộ mã nguồn của hệ thống website bán hàng tự động.
4. Mở thư mục này bằng công cụ soạn thảo code của bạn (khuyên dùng Visual Studio Code).

---

### BƯỚC 2: THIẾT LẬP GOOGLE SHEET (DATABASE)
1. Tạo một trang **Google Bảng tính (Google Sheet)** mới hoàn toàn trên Google Drive của bạn.
2. Đổi tên trang tính đầu tiên thành **`Orders`**.
3. Copy chuỗi ký tự dài trên thanh địa chỉ URL của Google Sheet (đây là **`SHEET_ID`** của bạn).
   * *Ví dụ:* Trong URL `https://docs.google.com/spreadsheets/d/1sNVtWsh6bA8rklzp.../edit`, thì `1sNVtWsh6bA8rklzp...` chính là `SHEET_ID`.

---

### BƯỚC 3: CÀI ĐẶT & KÍCH HOẠT GOOGLE APPS SCRIPT
1. Tại Google Sheet vừa tạo, bấm **Tiện ích mở rộng** (Extensions) ➔ **Apps Script**.
2. Xóa toàn bộ mã code mặc định hiện tại đi.
3. Mở file **`gas/Code.js`** trong thư mục mã nguồn bạn đã giải nén ở Bước 1, copy toàn bộ nội dung và paste vào trình soạn thảo Apps Script.
4. Sửa các thông số cấu hình tại phần **`CONFIG`** (dòng 16 - 37) trong trình soạn thảo:
   * Điền `SHEET_ID` của bạn vào mục `SHEET_ID`.
   * Cập nhật các thông tin sản phẩm, link Google Drive chứa tài liệu thực tế của bạn, thông tin tài khoản ngân hàng nhận tiền.
5. Bấm **Lưu** (icon ổ đĩa).
6. **CẤP QUYỀN HỆ THỐNG (BẮT BUỘC)**:
   * Trên thanh công cụ, chọn hàm **`setupDailyReportTrigger`** trong danh sách dropdown.
   * Bấm nút **Chạy** (Run) ở bên cạnh.
   * Google sẽ yêu cầu cấp quyền ➔ Bấm **Xem xét quyền** (Review permissions) ➔ Chọn tài khoản Google của bạn ➔ Chọn **Nâng cao** (Advanced) ➔ Chọn **Đi tới dự án (Không an toàn)** ➔ Bấm **Cho phép** (Allow).
7. **THIẾT LẬP BẢO MẬT (SCRIPT PROPERTIES)**:
   * Nhìn menu bên trái, bấm vào icon bánh răng **Cài đặt dự án** (Project Settings).
   * Cuộn xuống dưới cùng bấm nút **Edit script properties** ➔ bấm **Add script property** để thêm 3 dòng sau:
     * `TELEGRAM_BOT_TOKEN`: Token con Bot Telegram của bạn (Tạo qua `@BotFather`).
     * `TELEGRAM_CHAT_ID`: Chat ID của bạn để nhận thông báo (Tìm qua `@userinfobot`).
     * `SETUP_TRIGGER_SECRET`: Đặt một chuỗi bí mật bất kỳ của riêng bạn (ví dụ: `secret123`).
   * Bấm **Save script properties**.
8. **DEPLOY WEB APP**:
   * Nhìn lên góc trên bên phải, bấm nút **Triển khai** (Deploy) ➔ **Triển khai mới** (New deployment).
   * Chọn loại cấu hình (bánh răng) ➔ **Ứng dụng web** (Web app).
   * **Triển khai dưới dạng**: Chọn **Tôi (Email của bạn)**.
   * **Ai có quyền truy cập**: Chọn **Bất kỳ ai (Anyone)**. *(Tuyệt đối không chọn "Chỉ mình tôi" vì Vercel/SePay sẽ không gọi được vào hệ thống).*
   * Bấm **Triển khai**.
   * **Copy đường dẫn URL ứng dụng web** (Ví dụ: `https://script.google.com/macros/s/.../exec`). Đây chính là **`GAS_URL`** của bạn.

---

### BƯỚC 4: CẬP NHẬT CẤU HÌNH LÊN CODE FRONTEND
Mở thư mục code trên máy tính của bạn và cập nhật đường dẫn `GAS_URL` mới:
1. Mở file **`content-calendar-lp/index.html`**:
   * Tìm dòng `716` và thay thế giá trị biến `GAS_URL` bằng URL bạn vừa copy ở Bước 3.
2. Mở file **`content-calendar-lp/admin.html`**:
   * Tìm dòng `189` và thay thế `GAS_URL` bằng URL của bạn.
   * Tìm dòng `188` và sửa giá trị `const ADMIN_KEY = 'khaidaica';` thành mật khẩu trang Admin tùy chọn của bạn (ví dụ: `const ADMIN_KEY = 'matkhaucuaban';`).

---

### BƯỚC 5: THIẾT LẬP VÀ DEPLOY LÊN VERCEL (HOSTING)
Vercel sẽ là nơi lưu trữ Website Landing Page và chạy API làm cầu nối (Proxy) xác thực bảo mật HMAC trước khi chuyển hướng đến Google Sheets.

1. Đăng ký/Đăng nhập tài khoản [Vercel](https://vercel.com).
2. Di chuyển vào thư mục dự án trên Terminal/Git Bash: `cd content-calendar-lp`.
3. Chạy lệnh: `vercel` để liên kết dự án lần đầu tiên.
   * Chọn `Y` để thiết lập.
   * Chọn Scope cá nhân của bạn.
   * Chọn `N` khi hỏi có liên kết với dự án sẵn có không (chúng ta sẽ tạo mới).
   * Nhập tên dự án tùy chọn (ví dụ: `my-sales-kit`).
   * Nhấn Enter để xác nhận các thông số mặc định còn lại.
4. **THÊM CÁC BIẾN MÔI TRƯỜNG (ENVIRONMENT VARIABLES) LÊN VERCEL**:
   Bạn cần add các biến bảo mật này lên Vercel để hệ thống chạy chuẩn chỉnh. Có thể add trên Web Dashboard của Vercel hoặc chạy trực tiếp lệnh trong terminal:
   ```bash
   vercel env add GAS_URL production          # Paste link Web App Google Apps Script của bạn
   vercel env add SEPAY_WEBHOOK_SECRET production  # Nhập mã bí mật tự chọn (ví dụ: mysepaysecret123)
   ```
   *(Nếu bạn có tích hợp PayPal, hãy chạy thêm:)*
   ```bash
   vercel env add PAYPAL_CLIENT_ID production
   vercel env add PAYPAL_CLIENT_SECRET production
   ```
5. **DEPLOY LÊN PRODUCTION**:
   Chạy lệnh deploy chính thức lên môi trường thật:
   ```bash
   vercel --prod
   ```
   Vercel sẽ trả về đường dẫn Website Landing Page chính thức của bạn (ví dụ: `https://my-sales-kit.vercel.app`).

---

### BƯỚC 6: KẾT NỐI WEBHOOK TỪ SEPAY ĐỂ TỰ ĐỘNG XÁC NHẬN CHUYỂN KHOẢN
1. Truy cập vào tài khoản **SePay.vn** (Dịch vụ tự động quét giao dịch ngân hàng).
2. Vào **Cấu hình Webhook** ➔ **Tạo Webhook mới**.
3. Cấu hình các thông số:
   * **URL tích hợp**: Nhập link Vercel của bạn kèm hậu tố `/api/webhook`.
     * *Ví dụ:* `https://my-sales-kit.vercel.app/api/webhook`
   * **Phương thức**: Chọn `POST`.
   * **Kiểu dữ liệu**: Chọn `JSON`.
   * **Chữ ký bảo mật (Secret key)**: Nhập chính xác giá trị **`SEPAY_WEBHOOK_SECRET`** mà bạn đã cấu hình trên Vercel ở Bước 5 (ví dụ: `mysepaysecret123`).
4. Bấm **Lưu cấu hình**.

---

### BƯỚC 7: CHẠY THỬ NGHIỆM HỆ THỐNG (SMOKE TEST)

#### 1. Kiểm tra gửi email bằng tay thông qua trang Admin:
* Truy cập trang Admin của bạn bằng đường dẫn: 
  `https://<TEN_MIEN_VERCEL_CUA_BAN>/admin?key=<MAT_KHAU_ADMIN_DA_DAT>`
* Nhập một mã đơn hàng bất kỳ đang có trạng thái `PENDING` trong Sheet và bấm **Gửi**.
* Kiểm tra xem Google Sheet đã chuyển sang trạng thái `PAID_BANK` chưa và kiểm tra hòm thư Email xem đã nhận được file tài liệu chưa.

#### 2. Kiểm tra chuyển khoản thực tế:
* Lên trang chủ Landing Page của bạn, nhập Họ tên & Email giả lập để đăng ký mua hàng chọn chuyển khoản.
* Dùng app ngân hàng chuyển tiền đúng số tiền và điền chính xác nội dung chuyển khoản chứa **Mã đơn hàng** (ví dụ: `CC30-XXXXXX`).
* Chờ 5 - 10 giây ➔ Hệ thống tự động chuyển trạng thái PAID, Telegram thông báo và Email lập tức gửi file về cho bạn!

Chúc các bạn học viên thiết lập hệ thống thành công và bùng nổ doanh số! 🚀
