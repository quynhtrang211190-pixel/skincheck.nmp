# SKILL: LANDING PAGE STRUCTURE ANALYZER & REPLICATION TEMPLATE

> **Version:** 1.0  
> **Created:** 2026-05-04  
> **Source analyzed:** theallinplan.com/21d-ai-challenge (21 Ngày AI Agent Challenge)  
> **Cách gọi:** "Phân tích landing page [URL] theo skill analyze_landing_page"

---

## MÔ TẢ SKILL

Skill này giúp Claude phân tích cấu trúc + format của bất kỳ landing page nào, và đóng gói thành blank template để tái sử dụng cho sản phẩm/dịch vụ khác.

---

## QUY TRÌNH THỰC HIỆN (SOP)

Khi được gọi với một URL landing page, Claude sẽ:

1. Dùng `get_page_text` để đọc toàn bộ nội dung trang
2. Dùng `read_page` để nắm cấu trúc DOM
3. Chụp screenshot để quan sát visual layout
4. Phân tích theo 4 lớp bên dưới
5. Xuất ra: Structure Map + Visual Patterns + Copywriting Formula + Blank Template

---

## FRAMEWORK PHÂN TÍCH 4 LỚP

### LỚP 1 — STRUCTURE MAP (Bản đồ cấu trúc)

Liệt kê từng section theo thứ tự S1 → Sn:

| Section | Tên | Nội dung chính | Chức năng tâm lý |
|---------|-----|----------------|------------------|
| S1 | Sticky Urgency Bar | Deadline / scarcity | Kích hoạt FOMO ngay từ đầu |
| S2 | Hero | Headline + Sub + CTA | Capture attention + promise |
| S3 | Mechanism Quick | Luật chơi + trust bullets | Giải thích nhanh, giảm lo ngại |
| S4 | Social Proof #1 | Proof of work (kết quả thực) | Credibility sớm |
| S5 | Pain Agitation | 5-6 pain points đời thường | Đồng cảm + tạo cảm giác cấp bách |
| S6 | Curriculum / Outcomes | 6-8 kết quả cụ thể có icon | Specificity = Trust |
| S7 | Authority | Founder + Tool personified | Tin tưởng người dạy |
| S8 | How It Works | 3 bước đơn giản | Risk reduction |
| S9 | Objection Handling | "What if I'm lazy?" | Pre-empt phản bác chính |
| S10 | Value Stack | Deliverables + Anti-persona filter | Stack value + pre-qualify |
| S11 | Social Proof #2 | Video testimonials | Emotional proof |
| S12 | FAQ + Final CTA | 5 câu hỏi + closing urgency | Remove last objections → action |

---

### LỚP 2 — VISUAL & FORMAT PATTERNS

**Màu sắc (Color Palette):**
- Nền: Dark (đen/navy) → tạo cảm giác mạnh mẽ, tech, exclusive
- Chữ: Trắng chủ đạo
- CTA Button: Xanh lá nổi bật (contrast cao)
- Accent cảnh báo: Đỏ/cam (urgency, warning blocks)

**Typography:**
- Headline: Font display, UPPERCASE, cực lớn (full-width)
- Body: Sans-serif, size vừa, dễ đọc
- Nhấn từ khóa: In đậm + nghiêng trong đoạn văn
- Không dùng serif, không dùng header nhỏ

**Layout:**
- Single column full-width (không sidebar)
- Section xen kẽ: dark ↔ slightly-lighter dark
- CTA button: full-width trên mobile
- Marquee ticker dùng làm section divider
- Không có navigation menu (loại bỏ distraction)

**Copywriting Voice:**
- Ngôi: Thứ hai trực tiếp ("bạn")
- Tone: Thẳng thắn, aggressive, anti-BS
- Dùng slang/tiếng lóng tạo gần gũi
- Câu ngắn, dứt khoát, nhiều dấu chấm than

---

### LỚP 3 — COPYWRITING FORMULA

**Framework chính: PASTOR (biến thể)**
```
P → Problem     : Pain Agitation Section
A → Amplify     : Chi tiết hoá nỗi đau bằng ví dụ cụ thể
S → Story       : Founder story + học viên story
T → Transformation: Curriculum outcomes + value stack
O → Offer       : Cơ chế cọc + hoàn tiền
R → Response    : CTA phỏng vấn (không phải mua thẳng)
```

**Kỹ thuật đặc biệt trong trang này:**

1. **Deposit Mechanism (Cọc cam kết):** Lật ngược rủi ro từ người mua → người bán. Người học cọc tiền, hoàn thành thì lấy lại 100%. Tâm lý: "Zero risk" nhưng thực ra tạo commitment device.

2. **Anti-persona Filter (Từ chối ngược):** Liệt kê rõ ai KHÔNG được vào. Tạo exclusivity, tăng perceived value, pre-qualify lead.

3. **Application CTA (Phỏng vấn đầu vào):** Thay vì "Mua ngay", CTA là "Nộp đơn phỏng vấn". Tạo khan hiếm đảo ngược — người mua phải xin được mua.

4. **AI Personification:** Tool AI được đặt tên riêng ("Lửng Mật"), có tính cách, được giới thiệu như nhân vật — tăng novelty và tò mò.

5. **Proof of Work (không chỉ lời nói):** Social proof dùng link website thực mà học viên đã build — không chỉ quote cảm ơn chung chung.

**Pattern câu tiêu đề:**
- Dạng mệnh lệnh: "NHÌN THẲNG VÀO THỰC TẾ ĐI"
- Dạng câu hỏi phản bác: "NHƯNG... LỠ TÔI LƯỜI THÌ SAO?"
- Dạng tổng kết: "TÓM LẠI BẠN LỤM ĐƯỢC GÌ?"
- Dạng cảnh báo: "⚠️ CẢNH BÁO ĐỎ"

---

### LỚP 4 — BLANK REPLICATION TEMPLATE

Điền vào template này để tạo landing page mới theo cùng cấu trúc:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[S1 - STICKY URGENCY BAR]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Deadline: _______________
Hậu quả nếu chậm: _______________
Lặp lại: [Tên chương trình] • [Tagline ngắn] • [Deadline]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[S2 - HERO SECTION]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Logo/Brand: _______________
Pre-headline (deadline + FOMO, in nghiêng): _______________
Main Headline (tên chương trình + hook mạnh, UPPERCASE lớn): _______________
Sub-headline (target audience cụ thể): _______________
Provocative hook line ("Đừng dùng X chỉ để Y nữa..."): _______________
CTA Button text: _______________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[S3 - MECHANISM QUICK + VALUE PROP]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trust Bullet 1: _______________
Trust Bullet 2: _______________
Trust Bullet 3: _______________
Trust Bullet 4: _______________
Luật chơi / Cơ chế (1 đoạn ngắn, rõ ràng): _______________
Scroll CTA: "👇 KÉO XUỐNG ĐỂ XEM _______________"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[S4 - SOCIAL PROOF #1 — PROOF OF WORK]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Số lượng học viên: _______________
Kết quả cụ thể (link, ảnh, con số): _______________
Quote ngắn đại diện: _______________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[S5 - PAIN AGITATION SECTION]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Provocative headline: _______________
Pain Point 1 (hành vi quen thuộc sai): _______________
Pain Point 2 (hậu quả công việc): _______________
Pain Point 3 (lãng phí tiền/thời gian): _______________
Pain Point 4 (so sánh xã hội/tụt hậu): _______________
Pain Point 5 (cố gắng mà không ra kết quả): _______________
Bridge sentence (chuyển sang solution): _______________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[S6 - CURRICULUM / OUTCOMES]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Differentiation statement ("Không bán X, bán Y"): _______________
Outcome 1 👉: _______________
Outcome 2 👉: _______________
Outcome 3 👉: _______________
Outcome 4 👉: _______________
Outcome 5 👉: _______________
Outcome 6 👉: _______________
Outcome 7 👉: _______________
Outcome 8 👉: _______________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[S7 - AUTHORITY SECTION]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tên founder + 1 dòng bio thẳng thắn: _______________
Tinh thần làm việc / giá trị cốt lõi: _______________
Tool/Agent đặc biệt (nếu có tên riêng): _______________
Mô tả ngắn tại sao tool này khác biệt: _______________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[S8 - HOW IT WORKS — 3 BƯỚC]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Section headline: _______________
Bước 1 — [Tên hành động]: _______________
Bước 2 — [Tên hành động]: _______________
Bước 3 — [Tên hành động + kết quả]: _______________
Risk reversal statement: _______________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[S9 - OBJECTION HANDLING]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Câu hỏi phản bác chính (dạng "NHƯNG... LỠ..."): _______________
Cơ chế linh hoạt #1: _______________
Cơ chế linh hoạt #2: _______________
Cơ chế linh hoạt #3: _______________
Confidence claim ("X CHẮC"): _______________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[S10 - VALUE STACK + ANTI-PERSONA FILTER]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Section headline "TÓM LẠI BẠN LỤM ĐƯỢC GÌ?":
Deliverable 1: _______________
Deliverable 2: _______________
Deliverable 3: _______________
Deliverable 4: _______________
Deliverable 5: _______________
Deliverable 6: _______________

CẢNH BÁO ĐỎ — TỪ CHỐI:
🚫 Anti-persona 1: _______________
🚫 Anti-persona 2: _______________
🚫 Anti-persona 3: _______________
🚫 Anti-persona 4: _______________
🚫 Anti-persona 5: _______________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[S11 - SOCIAL PROOF #2 — VIDEO TESTIMONIALS]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3-5 video testimonials (tên + avatar + nội dung chính): _______________
CTA "Xem thêm": _______________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[S12 - FAQ + FINAL CTA]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Q1 (về điều kiện đầu vào): _______________
Q2 (về thời gian cam kết): _______________
Q3 (về tình huống bất khả kháng): _______________
Q4 (về uy tín hoàn tiền): _______________
Q5 (về lý do quy trình đặc biệt): _______________

Closing urgency line: _______________
Final CTA Button: _______________
```

---

## VÍ DỤ ÁP DỤNG SANG NGÀNH KHÁC

| Yếu tố | Bản gốc (AI Challenge) | Ví dụ ngành Fitness | Ví dụ ngành Marketing |
|--------|----------------------|--------------------|-----------------------|
| Cơ chế | Cọc tiền + hoàn 100% | Cọc + hoàn nếu giảm X kg | Cọc + hoàn nếu đạt X leads |
| Deadline | Đóng cửa → $2000 | Đóng batch tháng này | Tăng giá tuần sau |
| Anti-persona | Lười, thích lý thuyết | Đang chấn thương nặng | Muốn viral qua đêm |
| CTA | Nộp đơn phỏng vấn | Đăng ký slot coaching | Book call strategy |
| Proof of work | Website học viên build | Ảnh before/after | Screenshot revenue |

---

## GHI CHÚ KHI TÁI SỬ DỤNG

- **Cơ chế cọc hoàn tiền** chỉ hiệu quả khi sản phẩm có kết quả đo lường được rõ ràng
- **Anti-persona filter** nên dùng ngôn ngữ hành vi (không phải nhân khẩu học)
- **Application CTA** hoạt động tốt cho sản phẩm giá cao ($200+) hoặc cộng đồng cần chất lượng thành viên
- **Marquee ticker divider** dùng để tạo nhịp điệu giữa các section dài, tránh nhàm mắt
- **Tên riêng cho tool/agent** tăng novelty và tạo brand identity cho công cụ hỗ trợ

---

*Skill tạo bởi Claude Sonnet 4.6 | Nguồn: theallinplan.com/21d-ai-challenge*
