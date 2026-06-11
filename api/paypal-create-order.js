// ============================================================
// Vercel Serverless Function — PayPal Create Order
// Route: POST /api/paypal-create-order
// Required env vars: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET
// ============================================================

const PAYPAL_API = 'https://api-m.paypal.com'; // Production
// const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // Sandbox

async function getAccessToken() {
  const clientId     = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing PayPal credentials in environment variables');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get PayPal access token');
  return data.access_token;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount = '7.00', description = 'Content Calendar 30 Ngày — ContentPro' } = req.body || {};

    const accessToken = await getAccessToken();

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `order-${Date.now()}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: amount
          },
          description
        }]
      })
    });

    const order = await orderRes.json();
    if (!orderRes.ok) {
      console.error('PayPal createOrder error:', order);
      return res.status(400).json({ error: 'Failed to create order', details: order });
    }

    return res.status(200).json({ id: order.id });

  } catch (err) {
    console.error('Create order error:', err.toString());
    return res.status(500).json({ error: err.message });
  }
}
