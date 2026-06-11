// ============================================================
// Vercel Serverless Function — PayPal Capture Order
// Route: POST /api/paypal-capture-order
// Required env vars: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, GAS_URL
// ============================================================

const PAYPAL_API = 'https://api-m.paypal.com'; // Production
// const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // Sandbox

async function getAccessToken() {
  const clientId     = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get PayPal access token');
  return data.access_token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderID, name, email } = req.body || {};

    if (!orderID) {
      return res.status(400).json({ error: 'Missing orderID' });
    }

    const accessToken = await getAccessToken();

    // Capture the PayPal order
    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const capture = await captureRes.json();

    if (!captureRes.ok || capture.status !== 'COMPLETED') {
      console.error('PayPal capture error:', capture);
      return res.status(400).json({ error: 'Capture failed', details: capture });
    }

    const txId   = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id || orderID;
    const amount = capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || '7.00';

    // Notify GAS — fulfillment failure is surfaced distinctly, not swallowed
    const GAS_URL = process.env.GAS_URL;
    if (!GAS_URL) {
      console.error('Missing GAS_URL — cannot fulfill order');
      // Payment captured but we have no way to fulfill
      return res.status(202).json({
        success: false,
        error: 'payment_captured_but_fulfillment_failed',
        txId,
      });
    }

    let gasFulfilled = false;
    try {
      const gasRes = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'paypal_complete',
          email: email || '',
          name: name || '',
          txId,
          amount,
        }),
      });

      let gasData;
      try {
        gasData = await gasRes.json();
      } catch (_) {
        console.error('GAS returned non-JSON, status:', gasRes.status);
      }

      if (gasData && gasData.success === true) {
        gasFulfilled = true;
      } else {
        console.error('GAS fulfillment failed:', gasData);
      }
    } catch (gasErr) {
      console.error('GAS notify error:', gasErr.toString());
    }

    if (!gasFulfilled) {
      // Payment captured but sheet/email not updated — caller must handle this explicitly
      return res.status(202).json({
        success: false,
        error: 'payment_captured_but_fulfillment_failed',
        txId,
      });
    }

    return res.status(200).json({
      success: true,
      txId,
      status: capture.status,
    });

  } catch (err) {
    console.error('Capture order error:', err.toString());
    return res.status(500).json({ error: err.message });
  }
}
