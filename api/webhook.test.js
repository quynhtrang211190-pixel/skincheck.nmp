// ============================================================
// Tests for api/webhook.js
// Run: node --input-type=module < api/webhook.test.js
// Mirrors SePay HMAC-SHA256 spec: sign(`{timestamp}.{body}`) → "sha256={hex}"
// https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc
// ============================================================

import crypto from 'crypto';

// ---- Minimal test harness ----
let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log('  PASS:', label);
    passed++;
  } else {
    console.error('  FAIL:', label);
    failed++;
  }
}

// ---- SePay signing helper — mirrors production format ----
function sign(timestamp, body, secret) {
  return 'sha256=' + crypto.createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
}

function nowTs() {
  return Math.floor(Date.now() / 1000);
}

// ---- Inline logic mirror of webhook.js HMAC + GAS dispatch ----

async function simulateWebhook({ rawBody, receivedSig, timestamp, secret, devBypass = false, gasFetch }) {
  // Step 1: secret / bypass gate
  if (!secret) {
    if (devBypass) {
      // allowed — fall through
    } else {
      return { status: 500, body: { success: false, error: 'Webhook verification not configured' } };
    }
  } else {
    // Replay protection
    const tsNum = Number(timestamp);
    if (!tsNum || Math.abs(Date.now() / 1000 - tsNum) > 300) {
      return { status: 401, body: { error: 'Request expired' } };
    }

    // Sig verify
    const expectedSig = sign(timestamp, rawBody, secret);
    const sigOk = receivedSig.length === expectedSig.length &&
      crypto.timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSig));

    if (!sigOk) {
      return { status: 401, body: { error: 'Invalid signature' } };
    }
  }

  // Step 2: parse JSON
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (_) {
    return { status: 400, body: { error: 'Invalid JSON' } };
  }

  // Step 3: forward to GAS
  try {
    const gasRes = await gasFetch('http://fake-gas', {
      method: 'POST',
      body: JSON.stringify({ action: 'sepay_webhook', ...payload }),
    });

    let gasData;
    try { gasData = await gasRes.json(); } catch (_) {
      return { status: 503, body: { success: false, error: 'GAS returned invalid response' } };
    }

    if (gasData.success === true) return { status: 200, body: { success: true } };
    return { status: 503, body: { success: false, error: gasData.error || 'GAS processing failed' } };

  } catch (_) {
    return { status: 503, body: { success: false, error: 'Upstream unreachable' } };
  }
}

// ---- Run tests ----

async function runTests() {
  const SECRET = 'test-secret-abc';
  const BODY   = JSON.stringify({ id: '123', content: 'CC30-100001 chuyen khoan' });
  const TS     = String(nowTs());

  console.log('\n=== webhook.js tests ===\n');

  // Case 1: Valid sig + fresh timestamp + GAS ok => 200
  {
    console.log('Case 1: Valid sig + GAS success => 200');
    const result = await simulateWebhook({
      rawBody: BODY, timestamp: TS, receivedSig: sign(TS, BODY, SECRET), secret: SECRET,
      gasFetch: async () => ({ json: async () => ({ success: true }) }),
    });
    assert('status === 200',     result.status === 200);
    assert('success === true',   result.body.success === true);
  }

  // Case 2: Valid sig + GAS returns success:false => 503
  {
    console.log('\nCase 2: Valid sig + GAS failure => 503');
    const result = await simulateWebhook({
      rawBody: BODY, timestamp: TS, receivedSig: sign(TS, BODY, SECRET), secret: SECRET,
      gasFetch: async () => ({ json: async () => ({ success: false, error: 'row not found' }) }),
    });
    assert('status === 503',     result.status === 503);
    assert('success === false',  result.body.success === false);
  }

  // Case 3: Valid sig + GAS throws => 503
  {
    console.log('\nCase 3: Valid sig + GAS unreachable => 503');
    const result = await simulateWebhook({
      rawBody: BODY, timestamp: TS, receivedSig: sign(TS, BODY, SECRET), secret: SECRET,
      gasFetch: async () => { throw new Error('ECONNREFUSED'); },
    });
    assert('status === 503',     result.status === 503);
  }

  // Case 4: Wrong signature => 401 "Invalid signature"
  {
    console.log('\nCase 4: Wrong signature => 401');
    const result = await simulateWebhook({
      rawBody: BODY, timestamp: TS, receivedSig: 'sha256=badbadbadbad', secret: SECRET,
      gasFetch: async () => ({ json: async () => ({ success: true }) }),
    });
    assert('status === 401',         result.status === 401);
    assert('error: Invalid signature', result.body.error === 'Invalid signature');
  }

  // Case 5: Invalid JSON body => 400
  {
    console.log('\nCase 5: Invalid JSON => 400');
    const bad = 'not-json{{{';
    const result = await simulateWebhook({
      rawBody: bad, timestamp: TS, receivedSig: sign(TS, bad, SECRET), secret: SECRET,
      gasFetch: async () => ({ json: async () => ({ success: true }) }),
    });
    assert('status === 400',     result.status === 400);
  }

  // Case 6: Missing secret, no dev bypass => 500 (fail-closed)
  {
    console.log('\nCase 6: Missing secret, no bypass => 500');
    const result = await simulateWebhook({
      rawBody: BODY, timestamp: TS, receivedSig: '', secret: undefined, devBypass: false,
      gasFetch: async () => ({ json: async () => ({ success: true }) }),
    });
    assert('status === 500',              result.status === 500);
    assert('error: not configured',       result.body.error === 'Webhook verification not configured');
  }

  // Case 7: Missing secret + dev bypass => passes through => 200
  {
    console.log('\nCase 7: Missing secret + ALLOW_UNSIGNED_WEBHOOK_IN_DEV=true => 200');
    const result = await simulateWebhook({
      rawBody: BODY, timestamp: TS, receivedSig: '', secret: undefined, devBypass: true,
      gasFetch: async () => ({ json: async () => ({ success: true }) }),
    });
    assert('status === 200',     result.status === 200);
  }

  // Case 8: Timestamp too old (>5 min) => 401 "Request expired"
  {
    console.log('\nCase 8: Stale timestamp => 401 Request expired');
    const oldTs = String(nowTs() - 400); // 400 seconds ago
    const result = await simulateWebhook({
      rawBody: BODY, timestamp: oldTs, receivedSig: sign(oldTs, BODY, SECRET), secret: SECRET,
      gasFetch: async () => ({ json: async () => ({ success: true }) }),
    });
    assert('status === 401',             result.status === 401);
    assert('error: Request expired',     result.body.error === 'Request expired');
  }

  // Case 9: Missing timestamp header => 401 "Request expired"
  {
    console.log('\nCase 9: Missing timestamp => 401 Request expired');
    const result = await simulateWebhook({
      rawBody: BODY, timestamp: '', receivedSig: sign('', BODY, SECRET), secret: SECRET,
      gasFetch: async () => ({ json: async () => ({ success: true }) }),
    });
    assert('status === 401',             result.status === 401);
    assert('error: Request expired',     result.body.error === 'Request expired');
  }

  // ---- Summary ----
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => { console.error(err); process.exit(1); });
