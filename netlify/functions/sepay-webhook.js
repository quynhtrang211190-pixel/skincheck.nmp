// Netlify Function — SePay Webhook Proxy
// URL: https://[site].netlify.app/.netlify/functions/sepay-webhook
// Nhận POST từ SePay → forward sang Google Apps Script → trả 200 OK

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyLPFNL7PYH1E9zv61YsGAX6vxqrOHHK6ZTs2Y1Yiqqh453D7_HiGYisZK474j5V4hx/exec';

exports.handler = async (event) => {
  // Chỉ chấp nhận POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');

    // Forward sang GAS (không cần đợi kết quả — trả 200 ngay cho SePay)
    fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow'  // follow 302 redirect của GAS
    }).catch(err => console.error('GAS forward error:', err));

    // Trả 200 ngay cho SePay (trong vòng 30s là OK)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error('Webhook error:', err);
    return {
      statusCode: 200, // Vẫn trả 200 để SePay không retry liên tục
      body: JSON.stringify({ success: true, note: 'parse error logged' })
    };
  }
};
