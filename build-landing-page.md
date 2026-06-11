---
description: Build a complete, high-conversion sales landing page from product images and description
version: 1.0
---

# /build-landing-page — Sales Landing Page Builder

Generate a complete, production-ready HTML sales landing page from minimal inputs: product images, description, pricing, and an optional style reference.

## Usage

```
/build-landing-page
/build-landing-page [style-ref: URL or image]
```

## Required Inputs

Before building, **always collect** the following from the user. Ask for all missing items upfront — do NOT start building with incomplete info.

| Input | Required | Notes |
|---|---|---|
| Product name | ✅ | |
| Product description | ✅ | Problem it solves, who it's for |
| Product images | ✅ | At least 1 hero image |
| Price | ✅ | Original + sale price if applicable |
| Offer details | ✅ | Bonuses, guarantee, deadline |
| Payment method | ✅ | See Payment section below |
| Customer info fields | ✅ | Name, phone, email, address, etc. |
| Style reference | ⚪ Optional | URL or screenshot. If missing → derive from product images |
| Brand colors | ⚪ Optional | If missing → extract from product image palette |
| Testimonials | ⚪ Optional | 2-3 quotes with customer name |
| FAQ content | ⚪ Optional | If missing → generate from product context |

## Page Structure (Build Order)

Build all sections in this exact order. Do NOT skip any section.

### 1. HEADER
- Sticky navigation bar
- Logo placeholder (left) + CTA button (right)
- Smooth hide-on-scroll-down, show-on-scroll-up behavior

### 2. HERO SECTION
- Full-width background (product image or gradient)
- H1: Big promise headline (pain-point-first OR outcome-first)
- Sub-headline: clarify who this is for and what they get
- Primary CTA button → scrolls to ORDER FORM
- Trust signals row: rating stars, sold count, guarantee badge

### 3. PROBLEM SECTION
- "Bạn có đang gặp..." framing
- 3–5 bullet pain points — written in customer's voice
- Emotional bridge sentence leading to solution

### 4. SOLUTION SECTION
- Product introduced as THE answer
- Hero product image (large, styled)
- 3–4 key features with icons + one-line benefit each

### 5. BENEFITS SECTION
- Outcome-focused (not feature-focused)
- Before/After comparison (if product category supports it)
- Visual icons or illustration per benefit

### 6. SOCIAL PROOF SECTION
- 2–3 testimonial cards (avatar + name + quote)
- Stats bar: X customers, X rating, X guarantee
- If no real testimonials provided → mark as [PLACEHOLDER] and note to user

### 7. OFFER / PRICING BLOCK ⭐
- Original price (struck through) + Sale price (large, bold)
- Value stack: list everything included + individual values
- Bonus items (if any)
- Countdown timer component (static HTML — user must wire up JS if needed)
- Guarantee badge + text (7/14/30-day money-back)

### 8. ORDER FORM + PAYMENT ⭐
- See Payment Integration section below
- Form fields as specified by user
- Submit button with loading state
- Order summary sidebar (desktop) / above form (mobile)

### 9. FAQ SECTION
- Accordion-style (open/close)
- 5–7 questions covering: shipping, refund, product usage, payment security
- Generate from context if user doesn't provide

### 10. FINAL CTA SECTION
- Repeat headline + offer summary
- Urgency/scarcity line
- Large CTA button

### 11. FOOTER
- Contact info
- Policy links (placeholder)
- Copyright

---

## Payment Integration

**Always ask which method before building.** Default to bank transfer if unclear.

### Option A — Bank Transfer / QR Code (No backend needed)
- Show bank details + QR after form submit
- Static HTML, works immediately
- User confirms payment manually

### Option B — SePay (Preferred for Vietnamese users)
- Embed SePay payment widget or generate QR via SePay API
- Can auto-confirm via webhook (requires backend)
- Note: User already uses SePay in other projects

### Option C — MoMo / ZaloPay
- Deeplink button → opens app
- Requires Business account + API key from user

### Option D — Custom / Other
- Collect gateway name + embed code from user

---

## Style Extraction Protocol

### If style reference URL provided:
1. Fetch the page → extract dominant colors, font style, section spacing feel
2. Build a matching palette: primary, secondary, accent, background, text
3. Match typographic weight and button style (rounded vs sharp, filled vs outline)

### If product image(s) only:
1. Extract 2–3 dominant colors from product image
2. Build palette around them (dark bg + light text OR light bg + dark text)
3. Default font: Inter (Google Fonts)

### If nothing provided:
- Apply industry-default palette based on product category (see table below)

| Category | Default Palette |
|---|---|
| Beauty / Skincare | Rose gold `#C9956C`, Cream `#FDF6F0`, Blush `#F2C4CE` |
| Health / Supplement | Forest `#2D6A4F`, White `#FFFFFF`, Gold `#D4AC0D` |
| Fashion | Charcoal `#2C2C2C`, White `#FFFFFF`, Accent varies |
| Tech / Digital | Navy `#0F1629`, Electric `#4F6EF7`, White `#FFFFFF` |
| Food / Beverage | Amber `#D4541A`, Cream `#FFF8F0`, Brown `#3E1F0D` |
| Home / Lifestyle | Sage `#8FAF8A`, Warm White `#FAF9F6`, Terracotta `#C1694F` |

---

## Tech Constraints

- **Output**: Single `.html` file — no external dependencies except Google Fonts CDN
- **CSS**: Vanilla CSS, embedded in `<style>` tag. NO Tailwind, NO Bootstrap
- **JS**: Minimal vanilla JS for accordion, scroll behavior, countdown (if needed)
- **Images**: Embed as `<img src="...">` using URLs provided, or use CSS gradients as fallback
- **Mobile**: Full responsive — test breakpoints at 375px, 768px, 1280px
- **Animations**: Subtle entry animations via CSS `@keyframes` + Intersection Observer
- **Deploy-ready**: Can be dropped onto Netlify, GitHub Pages, or any static host immediately

---

## Output Checklist

Before delivering, verify:
- [ ] All 11 sections present
- [ ] CTA buttons scroll to order form
- [ ] Payment form has all requested fields
- [ ] Mobile layout works (check with browser DevTools)
- [ ] No Lorem Ipsum — all placeholder text is product-relevant
- [ ] Google Fonts loads correctly
- [ ] Countdown timer present if offer has deadline
- [ ] Guarantee section present
- [ ] File is single `.html` — no external CSS/JS files

---

## Post-Build

After delivering the HTML file:
1. Ask user to test on mobile
2. Remind user to:
   - Replace `[PLACEHOLDER]` testimonials with real ones
   - Wire up payment gateway API if using SePay/MoMo/etc.
   - Set actual countdown end date in JS
3. Offer to deploy to Netlify if needed (`/deploy-netlify`)

---

## Notes

- Never use stock photo URLs — they expire. Use user-provided images or CSS gradients.
- If product has variants (size/color), add a variant selector in the order form.
- Scarcity must be honest — do not fabricate countdown timers without user confirmation.
- If user requests Zalo/Facebook pixel tracking, add to `<head>` before delivering.
