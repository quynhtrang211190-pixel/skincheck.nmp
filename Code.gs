// ============================================================
// Google Apps Script — MelanoCheck Skin Diagnostics Portal
// Version: 1.0
// Hướng dẫn:
//   1. Tạo Google Sheet mới, copy SHEET_ID vào biến bên dưới (hoặc Script Properties)
//   2. Dán toàn bộ mã này vào trình soạn thảo Google Apps Script
//   3. Thiết lập biến Script Properties: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (nếu có)
//   4. Triển khai (Deploy) dưới dạng Ứng dụng Web (Web App):
//      - Thực thi dưới dạng (Execute as): Tôi (Me)
//      - Ai có quyền truy cập (Who has access): Bất kỳ ai (Anyone)
//   5. Sao chép URL ứng dụng web và dán vào index.html & admin.html
// ============================================================

const CONFIG = {
  // Điền ID của Google Sheet ở đây nếu không dùng Bound Script.
  // Nếu Script được tạo trực tiếp từ Sheet (Extensions > Apps Script),
  // hệ thống sẽ tự động lấy ID của trang tính đang hoạt động.
  SHEET_ID: 'YOUR_GOOGLE_SHEET_ID_HERE', 
  
  SHEET_NAME: 'MelanoCheck_Profiles',
  FOLDER_NAME: 'MelanoCheck Submissions',
  
  SENDER_NAME: 'PharmesHub MelanoCheck',
  SUPPORT_EMAIL: 'support@pharmeshub.com',
  ZALO_CTA_URL: 'https://zalo.me/0948689090', // Đổi thành link Zalo của bạn

  TELEGRAM_BOT_TOKEN: PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN') || '',
  TELEGRAM_CHAT_ID:   PropertiesService.getScriptProperties().getProperty('TELEGRAM_CHAT_ID') || '',
  GEMINI_API_KEY:     PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '',
};

// Cột cơ sở dữ liệu (1-indexed)
const COLS = {
  TIMESTAMP: 1,      // A
  PROFILE_ID: 2,     // B
  NAME: 3,           // C
  EMAIL: 4,          // D
  PHONE: 5,          // E
  BIRTH_YEAR: 6,     // F
  JOB: 7,            // G
  CITY: 8,           // H
  DURATION: 9,       // I
  PATTERN: 10,       // J
  AREAS: 11,         // K
  TREATMENTS: 12,    // L
  PRODUCTS: 13,      // M
  SYMPTOMS: 14,      // N
  CONTEXT: 15,       // O
  GENETIC: 16,       // P
  HORMONE: 17,       // Q
  RAPID_WHITE: 18,   // R
  IMG_FRONT: 19,     // S
  IMG_LEFT: 20,      // T
  IMG_RIGHT: 21,     // U
  DIAGNOSIS: 22,     // V
  SUMMARY: 23,       // W
  NEXT_STEPS: 24,    // X
  CONSULT_REQ: 25    // Y
};

const HEADER = [
  'Thời gian ghi nhận', 'Mã hồ sơ', 'Họ tên', 'Email', 'SĐT', 
  'Năm sinh', 'Nghề nghiệp', 'Tỉnh/Thành', 'Thời gian bị sắc tố', 'Dạng biểu hiện', 
  'Vùng xuất hiện', 'Phương pháp đã làm', 'Sản phẩm đã dùng', 'Biểu hiện nền da', 'Yếu tố cá nhân', 
  'Yếu tố di truyền', 'Sử dụng thuốc nội tiết', 'Kem làm trắng cấp tốc', 
  'Ảnh chính diện', 'Ảnh nghiêng trái', 'Ảnh nghiêng phải', 'Nhận định sắc tố', 'Tóm tắt tình trạng', 
  'Bước tiếp theo', 'Yêu cầu tư vấn chuyên sâu'
];


// ============================================================
// MAIN ENTRY POINTS
// ============================================================

function doGet(e) {
  const params = e.parameter;
  const action = params.action || '';
  const ref = params.ref || '';

  try {
    if (action === 'resend') {
      return handleResendReport(ref);
    }
    return jsonResponse({ status: 'ok', service: 'MelanoCheck API', version: '1.0' });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action || '';

    if (action === 'request_consultation') {
      return handleConsultationRequest(body);
    }

    // Default action: Ghi nhận hồ sơ chẩn đoán mới
    return handleNewProfile(body);
  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ============================================================
// LOGIC: GHIN NHẬN HỒ SƠ MỚI
// ============================================================
function handleNewProfile(body) {
  const { profileId, customer, pigmentation, history, skinBackground, personalContext, internalReport, images } = body;
  
  if (!customer || !customer.name || !customer.email || !customer.phone) {
    return jsonResponse({ success: false, error: 'Thiếu thông tin khách hàng bắt buộc.' });
  }

  const sheet = getOrCreateSheet();
  const now = new Date();
  
  // Kiểm tra trùng mã hồ sơ (idempotent)
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][COLS.PROFILE_ID - 1] === profileId) {
      return jsonResponse({ success: true, message: 'Hồ sơ đã tồn tại.', profileId: profileId });
    }
  }

  // Khởi tạo thư mục Google Drive để lưu ảnh chụp da
  let folder = getOrCreateDriveFolder(CONFIG.FOLDER_NAME);
  
  // Lưu 3 góc ảnh chụp da và nhận link shareable URL
  const frontImg = saveBase64Image(images.front, profileId + '_ChinhDien.jpg', folder);
  const leftImg  = saveBase64Image(images.left,  profileId + '_Trai.jpg',       folder);
  const rightImg = saveBase64Image(images.right, profileId + '_Phai.jpg',      folder);

  const frontUrl = frontImg.viewUrl || 'Không có ảnh';
  const leftUrl  = leftImg.viewUrl || 'Không có ảnh';
  const rightUrl = rightImg.viewUrl || 'Không có ảnh';

  // --- TÍCH HỢP GEMINI AI CHẨN ĐOÁN HÌNH ẢNH ---
  let report = internalReport;
  try {
    const aiReport = analyzeSkinWithGemini(images, customer, {
      duration: pigmentation.duration,
      pattern: pigmentation.pattern,
      areas: pigmentation.areas,
      treatments: history.treatments.join(', '),
      rapidWhitening: history.rapidWhitening,
      symptoms: skinBackground.symptoms.join(', '),
      context: personalContext.factors.join(', ')
    });
    
    if (aiReport && aiReport.pigment && aiReport.summary && aiReport.next) {
      report = aiReport;
      Logger.log("AI chẩn đoán da thành công!");
    } else {
      Logger.log("Không nhận được kết quả chẩn đoán từ AI. Sử dụng nhận định tĩnh làm dự phòng.");
    }
  } catch (aiErr) {
    Logger.log("Lỗi trong quá trình chạy AI chẩn đoán da: " + aiErr.toString());
  }

  // Lưu hàng mới vào Sheet
  sheet.appendRow([
    now,                                             // TIMESTAMP
    profileId,                                       // PROFILE_ID
    customer.name,                                   // NAME
    customer.email,                                  // EMAIL
    customer.phone,                                  // PHONE
    customer.birthYear || '',                        // BIRTH_YEAR
    customer.job || '',                              // JOB
    customer.city || '',                             // CITY
    pigmentation.duration || '',                     // DURATION
    pigmentation.pattern || '',                      // PATTERN
    pigmentation.areas || '',                        // AREAS
    history.treatments.join(', '),                   // TREATMENTS
    history.products || '',                          // PRODUCTS
    skinBackground.symptoms.join(', '),              // SYMPTOMS
    personalContext.factors.join(', '),              // CONTEXT
    pigmentation.geneticFactor || '',                // GENETIC
    pigmentation.hormoneUsage || '',                 // HORMONE
    history.rapidWhitening || '',                    // RAPID_WHITE
    frontUrl,                                        // IMG_FRONT
    leftUrl,                                         // IMG_LEFT
    rightUrl,                                        // IMG_RIGHT
    report.pigment,                                  // DIAGNOSIS (Kết quả AI hoặc fallback)
    report.summary,                                  // SUMMARY (Kết quả AI hoặc fallback)
    report.next,                                     // NEXT_STEPS (Kết quả AI hoặc fallback)
    'NO'                                             // CONSULT_REQ (Mặc định ban đầu chưa click tư vấn sâu)
  ]);

  // Thiết lập công thức hiển thị ảnh thu nhỏ có thể click mở xem ảnh gốc
  const lastRow = sheet.getLastRow();
  if (frontImg.viewUrl && frontImg.directUrl) {
    sheet.getRange(lastRow, COLS.IMG_FRONT).setFormulaLocal('=HYPERLINK("' + frontImg.viewUrl + '"; IMAGE("' + frontImg.directUrl + '"))');
  }
  if (leftImg.viewUrl && leftImg.directUrl) {
    sheet.getRange(lastRow, COLS.IMG_LEFT).setFormulaLocal('=HYPERLINK("' + leftImg.viewUrl + '"; IMAGE("' + leftImg.directUrl + '"))');
  }
  if (rightImg.viewUrl && rightImg.directUrl) {
    sheet.getRange(lastRow, COLS.IMG_RIGHT).setFormulaLocal('=HYPERLINK("' + rightImg.viewUrl + '"; IMAGE("' + rightImg.directUrl + '"))');
  }

  // Căn chỉnh ảnh và nâng chiều cao dòng lên 80px để hiển thị ảnh rõ nét
  const imageRange = sheet.getRange(lastRow, COLS.IMG_FRONT, 1, 3);
  imageRange.setHorizontalAlignment("center");
  imageRange.setVerticalAlignment("middle");
  sheet.setRowHeight(lastRow, 80);

  // Gửi email báo cáo HTML chẩn đoán tự động cho khách hàng
  sendReportEmail(customer.email, customer.name, profileId, report);

  // Gửi thông báo Telegram cho chuyên gia
  const paidAt = Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'HH:mm - dd/MM/yyyy');
  const zaloLink = 'https://zalo.me/' + customer.phone.replace(/^0/, '84').replace(/[^0-9]/g, '');
  const telegramMessage = 
    '🩺 <b>HỒ SƠ TỰ CHẨN ĐOÁN MỚI (MELANOCHECK)</b>\n\n' +
    '👤 <b>Khách hàng:</b> ' + customer.name + ' (' + (customer.birthYear || 'N/A') + ')\n' +
    '📱 <b>SĐT/Zalo:</b> ' + customer.phone + ' (<a href="' + zaloLink + '">Mở chat Zalo</a>)\n' +
    '📧 <b>Email:</b> ' + customer.email + '\n' +
    '💼 <b>Nghề nghiệp:</b> ' + (customer.job || 'N/A') + ' | <b>Tỉnh thành:</b> ' + (customer.city || 'N/A') + '\n' +
    '📍 <b>Mã hồ sơ:</b> <code>' + profileId + '</code>\n' +
    '⏰ <b>Thời gian:</b> ' + paidAt + '\n\n' +
    '🔍 <b>TÌNH TRẠNG SẮC TỐ & DA</b>\n' +
    '• Thời gian bị: ' + pigmentation.duration + '\n' +
    '• Biểu hiện: ' + pigmentation.pattern + '\n' +
    '• Vùng nhiều: ' + pigmentation.areas + '\n' +
    '• Di truyền gia đình: ' + (pigmentation.geneticFactor || 'Không rõ') + '\n' +
    '• Thuốc nội tiết: ' + (pigmentation.hormoneUsage || 'Không sử dụng') + '\n' +
    '• Biểu hiện nền da: ' + skinBackground.symptoms.join(', ') + '\n' +
    '• Yếu tố khác: ' + personalContext.factors.join(', ') + '\n\n' +
    '💊 <b>LỊCH SỬ CAN THIỆP & MỸ PHẨM</b>\n' +
    '• Phương pháp đã làm: ' + history.treatments.join(', ') + '\n' +
    '• Kem trắng cấp tốc: ' + (history.rapidWhitening || 'Không dùng') + '\n' +
    '• Sản phẩm đã dùng: ' + (history.products || 'Trống') + '\n\n' +
    '📸 <b>HÌNH ẢNH CHỤP DA</b>\n' +
    '• <a href="' + frontUrl + '">Ảnh chính diện</a>\n' +
    '• <a href="' + leftUrl + '">Ảnh má trái</a>\n' +
    '• <a href="' + rightUrl + '">Ảnh má phải</a>\n\n' +
    '💡 <b>NHẬN ĐỊNH BAN ĐẦU (AI/EXPERT)</b>\n' +
    '• ' + report.pigment + '\n' +
    '• ' + report.next;

  sendTelegramMessage(telegramMessage);

  return jsonResponse({ success: true, profileId: profileId, report: report });
}


// ============================================================
// LOGIC: YÊU CẦU TƯ VẤN CHUYÊN SÂU
// ============================================================
function handleConsultationRequest(body) {
  const { profileId } = body;
  if (!profileId) return jsonResponse({ success: false, error: 'Thiếu mã hồ sơ.' });

  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  let found = false;
  let name = '', phone = '', email = '';

  for (let i = 1; i < data.length; i++) {
    if (data[i][COLS.PROFILE_ID - 1] === profileId) {
      sheet.getRange(i + 1, COLS.CONSULT_REQ).setValue('YES');
      name = data[i][COLS.NAME - 1];
      phone = data[i][COLS.PHONE - 1];
      email = data[i][COLS.EMAIL - 1];
      found = true;
      break;
    }
  }

  if (found) {
    const zaloLink = 'https://zalo.me/' + phone.replace(/^0/, '84').replace(/[^0-9]/g, '');
    const telegramMessage = 
      '📞 <b>YÊU CẦU TƯ VẤN CHUYÊN SÂU (MELANOCHECK)</b>\n\n' +
      '👤 <b>Khách hàng:</b> ' + name + '\n' +
      '📱 <b>Số điện thoại:</b> ' + phone + ' (<a href="' + zaloLink + '">Mở chat Zalo</a>)\n' +
      '📧 <b>Email:</b> ' + email + '\n' +
      '📍 <b>Mã hồ sơ:</b> <code>' + profileId + '</code>\n\n' +
      '👉 Khách hàng vừa bấm nút <b>"Liên hệ chuyên sâu ngay"</b> từ website. Vui lòng mở lại hồ sơ chẩn đoán, xem hình ảnh và liên hệ Zalo tư vấn phác đồ cho khách hàng!';
    
    sendTelegramMessage(telegramMessage);
    return jsonResponse({ success: true, message: 'Consultation request recorded.' });
  }

  return jsonResponse({ success: false, error: 'Không tìm thấy hồ sơ tương ứng.' });
}

// ============================================================
// LOGIC: GỬI LẠI BÁO CÁO (ADMIN RESEND)
// ============================================================
function handleResendReport(profileId) {
  if (!profileId) return jsonResponse({ success: false, error: 'Thiếu mã hồ sơ' });

  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const rowProfileId = data[i][COLS.PROFILE_ID - 1];
    if (rowProfileId === profileId) {
      const email = data[i][COLS.EMAIL - 1];
      const name = data[i][COLS.NAME - 1];
      
      const report = {
        pigment: data[i][COLS.DIAGNOSIS - 1],
        summary: data[i][COLS.SUMMARY - 1],
        next: data[i][COLS.NEXT_STEPS - 1]
      };

      sendReportEmail(email, name, profileId, report);
      return jsonResponse({ success: true, email: email, ref: profileId, status: 'BÁO CÁO ĐÃ ĐƯỢC GỬI LẠI' });
    }
  }

  return jsonResponse({ success: false, error: 'Không tìm thấy mã hồ sơ: ' + profileId });
}

// ============================================================
// EMAIL SENDER
// ============================================================
function sendReportEmail(toEmail, toName, profileId, report) {
  try {
    const subject = '🩺 Báo cáo chẩn đoán nền da nám MelanoCheck · ' + profileId;
    
    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
      + '<body style="margin:0;padding:0;background-color:#f7f3f0;font-family:Arial,sans-serif;font-size:16px;color:#333;">'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f3f0;padding:32px 16px;"><tr><td align="center">'
      + '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);">'
      + '<tr><td style="background:linear-gradient(135deg,#1f1107,#0d0703);padding:40px 32px;text-align:center;">'
      + '<h1 style="color:#ffecd6;margin:0;font-size:28px;font-weight:800;letter-spacing:1px;">PharmesHub</h1>'
      + '<p style="color:#dc5000;margin:6px 0 0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">MelanoCheck Skin Diagnostics</p>'
      + '</td></tr>'
      + '<tr><td style="padding:40px 32px;">'
      + '<h2 style="color:#0d0703;font-size:22px;font-weight:700;margin:0 0 16px;">Chào ' + escapeHtml(toName) + ',</h2>'
      + '<p style="color:#555555;font-size:15px;line-height:1.6;margin:0 0 24px;">'
      + 'Cảm ơn bạn đã tin tưởng sử dụng công cụ tự chẩn đoán da MelanoCheck của chúng tôi. '
      + 'Dưới đây là <b>Báo cáo phân tích sơ bộ</b> dựa trên hồ sơ da bạn đã đăng tải:'
      + '</p>'
      + '<table width="100%" style="background-color:#fdfaf7;border:1px solid #f0e6dd;border-radius:12px;margin-bottom:28px;border-collapse:collapse;">'
      + '<tr><td style="padding:18px;border-bottom:1px solid #f0e6dd;width:30%;font-weight:bold;color:#0d0703;font-size:13px;text-transform:uppercase;">Mã hồ sơ</td><td style="padding:18px;border-bottom:1px solid #f0e6dd;font-family:monospace;font-size:14px;color:#dc5000;font-weight:bold;">' + profileId + '</td></tr>'
      + '<tr><td style="padding:18px;border-bottom:1px solid #f0e6dd;font-weight:bold;color:#0d0703;font-size:13px;text-transform:uppercase;">Nhận định sắc tố</td><td style="padding:18px;border-bottom:1px solid #f0e6dd;font-size:14px;color:#dc5000;font-weight:bold;line-height:1.5;">' + report.pigment + '</td></tr>'
      + '<tr><td style="padding:18px;border-bottom:1px solid #f0e6dd;font-weight:bold;color:#0d0703;font-size:13px;text-transform:uppercase;">Tóm tắt tình trạng</td><td style="padding:18px;border-bottom:1px solid #f0e6dd;font-size:14px;color:#555555;line-height:1.6;">' + report.summary + '</td></tr>'
      + '<tr><td style="padding:18px;font-weight:bold;color:#0d0703;font-size:13px;text-transform:uppercase;">Hướng xử lý ban đầu</td><td style="padding:18px;font-size:14px;color:#0d0703;font-weight:bold;line-height:1.6;">' + report.next + '</td></tr>'
      + '</table>'
      + '<p style="color:#555555;font-size:15px;line-height:1.6;margin:0 0 28px;">'
      + 'Để nhận được tư vấn chuyên sâu hơn trực tiếp từ chuyên gia và thiết lập một phác đồ bôi thoa an toàn, tránh biến chứng tái sạm hoặc làm yếu hàng rào bảo vệ da, bạn có thể click nút dưới đây để kết nối trực tiếp với đội ngũ chuyên khoa.'
      + '</p>'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;"><tr><td align="center">'
      + '<a href="' + CONFIG.ZALO_CTA_URL + '" style="display:inline-block;background-color:#dc5000;color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:30px;font-weight:bold;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;box-shadow:0 6px 20px rgba(220,80,0,0.25);">'
      + '💬 Nhận tư vấn phác đồ da Zalo</a>'
      + '</td></tr></table>'
      + '<p style="margin:0;color:#888888;font-size:13px;line-height:1.5;font-style:italic;">'
      + 'Lưu ý: Kết quả chẩn đoán này chỉ mang tính chất định hướng ban đầu dựa trên hình ảnh tự chụp và thông tin khai báo trực tuyến. Để có kết luận chính xác nhất, bạn nên được thăm khám trực tiếp bằng thiết bị soi da chuyên khoa.'
      + '</p>'
      + '</td></tr>'
      + '<tr><td style="background-color:#fcf9f6;padding:24px 32px;text-align:center;border-top:1px solid #f0e6dd;">'
      + '<p style="color:#8c7d6e;font-size:13px;margin:0;">© 2026 PharmesHub · Hệ thống chăm sóc & phục hồi da nám chuyên sâu</p>'
      + '<p style="color:#b0a59a;font-size:11px;margin:6px 0 0;">Vui lòng không trả lời trực tiếp email này. Liên hệ chuyên gia để được phản hồi tốt nhất.</p>'
      + '</td></tr>'
      + '</table></td></tr></table></body></html>';

    MailApp.sendEmail({
      to: toEmail,
      subject: subject,
      htmlBody: html,
      name: CONFIG.SENDER_NAME,
      replyTo: CONFIG.SUPPORT_EMAIL
    });
    
    Logger.log('Diagnostic email sent successfully to: ' + toEmail);
    return true;
  } catch (err) {
    Logger.log('sendReportEmail ERROR: ' + err.toString());
    return false;
  }
}

// ============================================================
// IMAGE DRIVE UTILITIES
// ============================================================
function getOrCreateDriveFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  const folder = DriveApp.createFolder(folderName);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return folder;
}

function saveBase64Image(base64Data, filename, folder) {
  if (!base64Data) return { viewUrl: '', directUrl: '' };
  try {
    const parts = base64Data.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const rawBase64 = parts[1];
    const decoded = Utilities.base64Decode(rawBase64);
    const blob = Utilities.newBlob(decoded, mime, filename);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileId = file.getId();
    return {
      viewUrl: file.getUrl(),
      directUrl: 'https://lh3.googleusercontent.com/d/' + fileId
    };
  } catch (err) {
    Logger.log('saveBase64Image error for ' + filename + ': ' + err.toString());
    return { viewUrl: '', directUrl: '', error: err.toString() };
  }
}

// ============================================================
// GEMINI AI DIAGNOSTICS UTILITIES
// ============================================================
function analyzeSkinWithGemini(images, customerInfo, surveyData) {
  const apiKey = CONFIG.GEMINI_API_KEY;
  if (!apiKey) {
    Logger.log("Không tìm thấy GEMINI_API_KEY trong cấu hình. Bỏ qua AI chẩn đoán.");
    return null;
  }

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;

  // Lập prompt bằng tiếng Việt kết hợp dữ liệu khảo sát
  const promptText = 
    "Bạn là một chuyên gia da liễu thẩm mỹ cao cấp chuyên về điều trị sắc tố da. " +
    "Hãy phân tích hình ảnh khuôn mặt của khách hàng kết hợp cùng thông tin khảo sát dưới đây để đưa ra chẩn đoán chính xác nhất.\n\n" +
    "THÔNG TIN KHÁCH HÀNG & KHẢO SÁT:\n" +
    "- Họ tên: " + customerInfo.name + "\n" +
    "- Năm sinh: " + (customerInfo.birthYear || 'N/A') + "\n" +
    "- Thời gian bị sắc tố: " + (surveyData.duration || 'N/A') + "\n" +
    "- Dạng biểu hiện khách quan tự thấy: " + (surveyData.pattern || 'N/A') + "\n" +
    "- Các vùng xuất hiện: " + (surveyData.areas || 'N/A') + "\n" +
    "- Phương pháp điều trị đã làm: " + (surveyData.treatments || 'Chưa điều trị') + "\n" +
    "- Kem trộn/trắng da cấp tốc: " + (surveyData.rapidWhitening || 'Không sử dụng') + "\n" +
    "- Nền da hiện tại (triệu chứng): " + (surveyData.symptoms || 'Bình thường') + "\n" +
    "- Yếu tố nội tiết/di truyền: " + (surveyData.context || 'Không') + "\n\n" +
    "YÊU CẦU PHÂN TÍCH:\n" +
    "1. Đọc hình ảnh da (chính diện, má trái, má phải) để phát hiện loại nám/sắc tố (Nám mảng, Nám đinh/chân sâu, Nám hỗn hợp, Tàn nhang, Sạm da do hóa chất, Tăng sắc tố sau viêm PIH, v.v.).\n" +
    "2. Đánh giá sức khỏe nền da (Mỏng đỏ, giãn mao mạch, yếu do kem trộn, bùng phát sắc tố hay nền da khỏe khỏe).\n" +
    "3. Đưa ra phác đồ gợi ý (các chất bôi thoa phục hồi hoặc đặc trị khuyên dùng, lưu ý chống nắng).\n\n" +
    "ĐỊNH DẠNG ĐẦU RA (MỤC TIÊU BẮT BUỘC):\n" +
    "Trả về một đối tượng JSON hợp lệ gồm 3 thuộc tính chính xác bằng Tiếng Việt:\n" +
    "{\n" +
    '  "pigment": "Nhận định loại sắc tố ngắn gọn (ví dụ: Nám mảng nội tiết kết hợp tàn nhang rải rác)",\n' +
    '  "summary": "Tóm tắt tình trạng chi tiết (nêu rõ nguyên nhân, mức độ tổn thương cấu trúc da và sức khỏe nền da hiện tại, khoảng 100-150 từ)",\n' +
    '  "next": "Các bước chăm sóc tiếp theo khuyên dùng (danh sách gạch đầu dòng rõ ràng, cụ thể các hoạt chất khuyên dùng/tránh dùng và hướng bảo vệ da)"\n' +
    "}\n\n" +
    "Lưu ý: Không thêm bất kỳ văn bản nào ngoài JSON. Không bao quanh JSON bằng ```json và ```.";

  const parts = [{ text: promptText }];

  // Thêm ảnh nếu có
  if (images.front && images.front.includes(',')) {
    const rawFront = images.front.split(',')[1];
    const mimeFront = images.front.split(',')[0].match(/:(.*?);/)[1];
    parts.push({ inlineData: { mimeType: mimeFront, data: rawFront } });
  }
  if (images.left && images.left.includes(',')) {
    const rawLeft = images.left.split(',')[1];
    const mimeLeft = images.left.split(',')[0].match(/:(.*?);/)[1];
    parts.push({ inlineData: { mimeType: mimeLeft, data: rawLeft } });
  }
  if (images.right && images.right.includes(',')) {
    const rawRight = images.right.split(',')[1];
    const mimeRight = images.right.split(',')[0].match(/:(.*?);/)[1];
    parts.push({ inlineData: { mimeType: mimeRight, data: rawRight } });
  }

  const payload = {
    contents: [{ parts: parts }],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    const text = response.getContentText();

    if (code === 200) {
      const result = JSON.parse(text);
      if (result.candidates && result.candidates.length > 0) {
        const textResponse = result.candidates[0].content.parts[0].text;
        const parsedResponse = JSON.parse(textResponse.trim());
        if (parsedResponse.pigment && parsedResponse.summary && parsedResponse.next) {
          return parsedResponse;
        }
      }
    }
    Logger.log("Lỗi gọi Gemini API (Code " + code + "): " + text);
    return null;
  } catch (err) {
    Logger.log("Lỗi hệ thống khi gọi Gemini: " + err.toString());
    return null;
  }
}

// ============================================================
// TELEGRAM UTILITIES
// ============================================================
function sendTelegramMessage(text) {
  const token  = CONFIG.TELEGRAM_BOT_TOKEN;
  const chatId = CONFIG.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    Logger.log('Bỏ qua gửi Telegram do thiếu token hoặc chat ID.');
    return;
  }
  try {
    UrlFetchApp.fetch(
      'https://api.telegram.org/bot' + token + '/sendMessage',
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' }),
        muteHttpExceptions: true
      }
    );
  } catch (err) {
    Logger.log('Telegram sending error: ' + err.toString());
  }
}

// ============================================================
// SHEET UTILITIES
// ============================================================
function getOrCreateSheet() {
  let sheetId = CONFIG.SHEET_ID;
  let ss;
  
  if (!sheetId || sheetId === 'YOUR_GOOGLE_SHEET_ID_HERE') {
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
      sheetId = ss.getId();
    } catch(e) {
      throw new Error('Chưa cấu hình SHEET_ID trong script properties hoặc CONFIG.');
    }
  } else {
    ss = SpreadsheetApp.openById(sheetId);
  }

  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  }
  
  // Thiết lập header và đóng băng hàng đầu tiên
  sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  return sheet;
}

function escapeHtml(str) {
  return (str || '').toString()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// HÀM TEST (Chạy thủ công để kiểm tra cấu hình)
// ============================================================
function testTelegram() {
  sendTelegramMessage('🔔 <b>PharmesHub MelanoCheck Bot</b>\nKết nối thành công! Hệ thống sẵn sàng nhận thông báo chẩn đoán da.');
}

/**
 * Hàm hỗ trợ kích hoạt hộp thoại yêu cầu cấp quyền thủ công.
 * Bạn chọn hàm này từ danh sách thả xuống ở thanh công cụ phía trên và bấm "Chạy".
 * Google sẽ hiển thị popup yêu cầu bạn cấp quyền truy cập Drive, Email và Sheets.
 */
function YeuCauCapQuyenThuCong() {
  try {
    // 1. Ép kích hoạt quyền Google Drive
    const testFolderName = "MelanoCheck Temp Test Folder";
    const folders = DriveApp.getFoldersByName(testFolderName);
    
    // 2. Ép kích hoạt quyền gửi Email (MailApp)
    const quota = MailApp.getRemainingDailyQuota();
    
    // 3. Ép kích hoạt quyền SpreadsheetApp
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    Logger.log("=== KIỂM TRA QUYỀN TRUY CẬP ===");
    Logger.log("1. Google Sheets: OK (ID: " + ss.getId() + ")");
    Logger.log("2. Google Drive: OK");
    Logger.log("3. Gửi Email (Số lượt gửi còn lại trong ngày): " + quota);
    Logger.log("===============================");
    Logger.log("Chúc mừng! Bạn đã cấp đầy đủ quyền cho ứng dụng hoạt động.");
  } catch (err) {
    Logger.log("Lỗi khi kiểm tra/cấp quyền: " + err.toString());
  }
}
