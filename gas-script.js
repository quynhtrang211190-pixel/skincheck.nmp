// ============================================================
// GOOGLE APPS SCRIPT — Content Calendar LP Backend v2.1
// Hỗ trợ: Đăng ký, PayPal, SePay Webhook, Polling check
// HƯỚNG DẪN: Copy toàn bộ nội dung này vào Apps Script Editor
// ============================================================

const SHEET_NAME    = 'Orders';
const PRODUCT_NAME  = 'Content Calendar 30 Ngày';
const PRODUCT_LINK  = 'https://drive.google.com/drive/folders/1xf5-8Of5eGaXv-nsnMpl9vZk4u_h5o9M?usp=sharing';
const SUPPORT_EMAIL = 'phukien168.com@gmail.com';
const PRICE_VND     = 168000;

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const payload = JSON.parse(raw);
    const action = payload.action || '';

    // SePay webhook không có field "action" — nhận dạng qua "transferType"
    if (!action && (payload.transferType || payload.gateway)) {
      return handleSepayWebhook(payload);
    }

    switch (action) {
      case 'register':        return handleRegister(payload);
      case 'paypal_complete': return handlePaypalComplete(payload);
      default:                return jsonResp({ success: false, error: 'Unknown action' });
    }
  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return jsonResp({ success: false, error: err.toString() });
  }
}

function handleRegister(p) {
  if (!p.name || !p.email) return jsonResp({ success: false, error: 'Thiếu thông tin' });

  const sheet = getSheet();
  const refCode = generateRef(p.email);
  const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const existingRow = findRowByEmail(sheet, p.email);
  if (existingRow > 0) {
    const existingRef = sheet.getRange(existingRow, 6).getValue();
    return jsonResp({ success: true, refCode: existingRef || refCode, existing: true });
  }

  sheet.appendRow([timestamp, p.name, p.email, p.phone || '', p.package || PRODUCT_NAME,
                   refCode, p.method || 'bank', 'Chờ thanh toán']);
  return jsonResp({ success: true, refCode: refCode });
}

function handlePaypalComplete(p) {
  if (!p.email || !p.txId) return jsonResp({ success: false, error: 'Thiếu email hoặc txId' });

  const sheet = getSheet();
  const row = findRowByEmail(sheet, p.email);

  if (row > 0) {
    sheet.getRange(row, 8).setValue('Đã Thanh Toán (PayPal)');
    sheet.getRange(row, 9).setValue(p.txId);
    sendConfirmationEmail(p.email, sheet.getRange(row, 2).getValue());
  } else {
    const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    sheet.appendRow([timestamp, p.name || '', p.email, '', PRODUCT_NAME, '', 'paypal',
                     'Đã Thanh Toán (PayPal)', p.txId]);
    sendConfirmationEmail(p.email, p.name || '');
  }
  return jsonResp({ success: true });
}

function handleSepayWebhook(p) {
  if (p.transferType !== 'in') return jsonResp({ success: true, message: 'Skipped: outgoing' });

  const amount  = Number(p.transferAmount) || 0;
  const content = (p.content || '').toUpperCase();
  const txId    = String(p.id || '');

  if (amount < PRICE_VND) {
    Logger.log('SePay: Số tiền không đủ: ' + amount);
    return jsonResp({ success: true, message: 'Skipped: amount too low' });
  }

  const sheet = getSheet();
  const refMatch = content.match(/CC30-[A-Z0-9]+/);

  if (!refMatch) {
    Logger.log('SePay: Không khớp mã tham chiếu: ' + content);
    const ts = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    sheet.appendRow([ts, 'UNKNOWN', 'UNKNOWN', '', 'Unmatched', '', 'bank',
                     'Cần kiểm tra thủ công', txId, amount, p.content]);
    return jsonResp({ success: true, message: 'Logged unmatched transfer' });
  }

  const refCode = refMatch[0];
  const row = findRowByRef(sheet, refCode);

  if (row > 0) {
    const currentStatus = sheet.getRange(row, 8).getValue();
    if (String(currentStatus).includes('Đã Thanh Toán')) {
      return jsonResp({ success: true, message: 'Already processed' });
    }
    sheet.getRange(row, 8).setValue('Đã Thanh Toán (MB Bank)');
    sheet.getRange(row, 9).setValue(txId);
    sheet.getRange(row, 10).setValue(amount);
    sheet.getRange(row, 11).setValue(p.content || '');

    const email = sheet.getRange(row, 3).getValue();
    const name  = sheet.getRange(row, 2).getValue();
    if (email) sendConfirmationEmail(email, name);
    Logger.log('SePay OK: ' + refCode + ' | ' + email);
  } else {
    const ts = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    sheet.appendRow([ts, 'Direct CK', '', '', PRODUCT_NAME, refCode, 'bank',
                     'Đã Thanh Toán — Cần xác minh email', txId, amount, p.content]);
  }
  return jsonResp({ success: true });
}

// ── Helpers ──────────────────────────────────────────────────

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp','Họ Tên','Email','Số Điện Thoại','Gói',
                     'Mã Tham Chiếu','Phương Thức','Trạng Thái',
                     'Transaction ID','Số Tiền','Nội Dung CK']);
    sheet.getRange(1,1,1,11).setFontWeight('bold').setBackground('#4285F4').setFontColor('#fff');
  }
  return sheet;
}

function generateRef(email) {
  return 'CC30-' + email.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
}

function findRowByEmail(sheet, email) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][2]).toLowerCase() === email.toLowerCase()) return i + 1;
  }
  return -1;
}

function findRowByRef(sheet, refCode) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][5]).toUpperCase() === refCode.toUpperCase()) return i + 1;
  }
  return -1;
}

function sendConfirmationEmail(email, name) {
  try {
    const displayName = name || 'bạn';
    const subject = '🎉 [ContentPro] File của bạn đã sẵn sàng tải về!';

    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>'
      + '<body style="margin:0;padding:0;background:#f5f8fc;font-family:Arial,sans-serif;">'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f8fc;padding:40px 20px;"><tr><td align="center">'
      + '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(6,20,47,.1);">'
      // Header
      + '<tr><td style="background:linear-gradient(135deg,#06142f,#0b3778);padding:36px 40px;text-align:center;">'
      + '<div style="font-size:36px;margin-bottom:12px;">🗓️</div>'
      + '<h1 style="color:#fff;margin:0;font-size:26px;font-weight:900;">ContentPro</h1>'
      + '<p style="color:rgba(255,255,255,.7);margin:8px 0 0;font-size:14px;">Cảm ơn bạn đã tin tưởng!</p>'
      + '</td></tr>'
      // Body
      + '<tr><td style="padding:40px;">'
      + '<h2 style="color:#06142f;font-size:22px;margin:0 0 8px;">Xin chào ' + escapeHtml(displayName) + '! 🎉</h2>'
      + '<p style="color:#5b6b86;font-size:15px;line-height:1.6;margin:0 0 28px;">Thanh toán đã được xác nhận. File <strong style="color:#06142f;">' + PRODUCT_NAME + '</strong> đã sẵn sàng.</p>'
      // Download button
      + '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td align="center">'
      + '<a href="' + PRODUCT_LINK + '" style="display:inline-block;background:linear-gradient(135deg,#1d6fe3,#0f55c8);color:#fff;text-decoration:none;padding:18px 40px;border-radius:12px;font-weight:800;font-size:16px;box-shadow:0 8px 24px rgba(21,94,208,.3);">'
      + '📥 Tải Xuống File Ngay</a>'
      + '</td></tr></table>'
      // What's included
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f8fc;border-radius:12px;margin-bottom:28px;"><tr><td style="padding:20px 24px;">'
      + '<p style="margin:0 0 12px;color:#06142f;font-weight:700;font-size:14px;">✅ Bộ file gồm 9 sheets</p>'
      + '<p style="margin:4px 0;color:#5b6b86;font-size:13px;">📖 Hướng Dẫn Sử Dụng</p>'
      + '<p style="margin:4px 0;color:#5b6b86;font-size:13px;">📊 Dashboard 90 Bài Đăng</p>'
      + '<p style="margin:4px 0;color:#5b6b86;font-size:13px;">🗓 Lịch 30 Ngày Hoàn Chỉnh</p>'
      + '<p style="margin:4px 0;color:#5b6b86;font-size:13px;">📝 10 Caption Facebook Ready</p>'
      + '<p style="margin:4px 0;color:#5b6b86;font-size:13px;">🎨 10 Visual Concepts Cinematic</p>'
      + '<p style="margin:4px 0;color:#5b6b86;font-size:13px;">🔄 Hệ Thống Đa Kênh (5 nền tảng)</p>'
      + '<p style="margin:4px 0;color:#5b6b86;font-size:13px;">🏆 Top 10 Siêu Phẩm Viral</p>'
      + '<p style="margin:4px 0;color:#5b6b86;font-size:13px;">🪝 Hook Bank 20 Mẫu</p>'
      + '</td></tr></table>'
      // Support
      + '<p style="color:#5b6b86;font-size:13px;line-height:1.6;margin:0 0 8px;">💬 Cần hỗ trợ? Liên hệ <a href="mailto:' + SUPPORT_EMAIL + '" style="color:#1d6fe3;font-weight:600;">' + SUPPORT_EMAIL + '</a></p>'
      + '<p style="color:#5b6b86;font-size:12px;margin:0;">📌 Nếu không thấy email, kiểm tra hộp thư <strong>Spam / Promotions</strong></p>'
      + '</td></tr>'
      // Footer
      + '<tr><td style="background:#f5f8fc;padding:24px 40px;text-align:center;border-top:1px solid #dbe5f2;">'
      + '<p style="color:#8190a8;font-size:12px;margin:0;">© 2026 ContentPro · <a href="mailto:' + SUPPORT_EMAIL + '" style="color:#8190a8;">' + SUPPORT_EMAIL + '</a></p>'
      + '<p style="color:#8190a8;font-size:11px;margin:6px 0 0;">🔒 Bảo đảm hoàn tiền 7 ngày nếu không hài lòng</p>'
      + '</td></tr>'
      + '</table></td></tr></table></body></html>';

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: html,
      name: 'ContentPro',
      replyTo: SUPPORT_EMAIL,
    });
    Logger.log('Email sent OK to: ' + email);
  } catch(err) { Logger.log('Email error: ' + err); }
}

function escapeHtml(str) {
  return (str || '').toString()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── GET handler: polling + Sepay webhook relay ────────────────

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const action = params.action || '';

  // Polling từ frontend: ?action=check&ref=CC30-XXXXXX
  if (action === 'check') {
    return handleCheckPayment(params.ref || '');
  }

  // Sepay webhook relay từ Vercel /api/webhook: ?payload={...}
  if (params.payload) {
    try {
      const payload = JSON.parse(decodeURIComponent(params.payload));
      return handleSepayWebhook(payload);
    } catch(err) {
      return jsonResp({ success: false, error: 'Invalid payload: ' + err.toString() });
    }
  }

  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok', version: '2.1' })
  ).setMimeType(ContentService.MimeType.JSON);
}

function handleCheckPayment(ref) {
  if (!ref) return jsonResp({ paid: false });
  const sheet    = getSheet();
  const data     = sheet.getDataRange().getValues();
  const refUpper = ref.toUpperCase();

  for (let i = 1; i < data.length; i++) {
    const rowRef    = String(data[i][5] || '').toUpperCase();
    const rowStatus = String(data[i][7] || '');
    if (rowRef === refUpper && rowStatus.includes('Đã Thanh Toán')) {
      return jsonResp({ paid: true, status: rowStatus });
    }
  }
  return jsonResp({ paid: false });
}

function jsonResp(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
