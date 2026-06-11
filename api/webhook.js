// ============================================================
// Vercel Serverless Function — SePay Webhook Receiver
// Route: POST /api/webhook
// Env vars required: GAS_URL, SEPAY_WEBHOOK_SECRET
// Env vars optional: ALLOW_UNSIGNED_WEBHOOK_IN_DEV=true (dev bypass only)
// ============================================================

import crypto from 'crypto';

// Read raw body so we can verify HMAC before parsing JSON
export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GAS_URL = process.env.GAS_URL;
  if (!GAS_URL) {
    console.error('Missing GAS_URL environment variable');
    return res.status(500).json({ success: false, error: 'Server misconfigured' });
  }

  // Read raw body for HMAC verification
  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    console.error('Failed to read request body:', err.toString());
    return res.status(400).json({ error: 'Failed to read body' });
  }

  // HMAC-SHA256 verification — fail-closed, per SePay spec
  // https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc
  const secret    = process.env.SEPAY_WEBHOOK_SECRET;
  const devBypass = process.env.ALLOW_UNSIGNED_WEBHOOK_IN_DEV === 'true';

  if (!secret) {
    if (devBypass) {
      console.warn('SEPAY_WEBHOOK_SECRET not set — allowing unsigned request via ALLOW_UNSIGNED_WEBHOOK_IN_DEV=true');
    } else {
      console.error('SEPAY_WEBHOOK_SECRET not configured — rejecting webhook');
      return res.status(500).json({ success: false, error: 'Webhook verification not configured' });
    }
  } else {
    const receivedSig = req.headers['x-sepay-signature'] || '';
    const timestamp   = req.headers['x-sepay-timestamp']  || '';

    // Replay protection: timestamp must be within ±5 minutes
    const tsNum = Number(timestamp);
    if (!tsNum || Math.abs(Date.now() / 1000 - tsNum) > 300) {
      console.warn('Webhook timestamp missing or expired:', timestamp);
      return res.status(401).json({ error: 'Request expired' });
    }

    // SePay signs: HMAC-SHA256(`{timestamp}.{rawBody}`), format: "sha256={hex}"
    const expectedSig = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex');

    const sigOk = receivedSig.length === expectedSig.length &&
      crypto.timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSig));

    if (!sigOk) {
      console.warn('Webhook signature mismatch — possible forged request');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  // Parse JSON body
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    console.error('Invalid JSON body:', err.toString());
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  console.log('SePay webhook received:', JSON.stringify(payload));

  // Forward to GAS and surface its success/failure to SePay for retry decisions
  try {
    const gasRes = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ action: 'sepay_webhook', ...payload }),
    });

    let gasData;
    try {
      gasData = await gasRes.json();
    } catch (_) {
      // GAS returned non-JSON (e.g. HTML error page) — treat as failure
      console.error('GAS returned non-JSON response, status:', gasRes.status);
      return res.status(503).json({ success: false, error: 'GAS returned invalid response' });
    }

    console.log('GAS response:', JSON.stringify(gasData));

    if (gasData.success === true) {
      // GAS processed successfully — tell SePay to stop retrying
      return res.status(200).json({ success: true });
    }

    // GAS reported a logical failure — return 503 so SePay retries
    console.error('GAS reported failure:', gasData);
    return res.status(503).json({ success: false, error: gasData.error || 'GAS processing failed' });

  } catch (err) {
    // Network/timeout error reaching GAS — return 503 so SePay retries
    console.error('Failed to reach GAS:', err.toString());
    return res.status(503).json({ success: false, error: 'Upstream unreachable' });
  }
}
