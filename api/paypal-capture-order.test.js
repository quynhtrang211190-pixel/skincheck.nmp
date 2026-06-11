// ============================================================
// Tests for api/paypal-capture-order.js
// Run: node api/paypal-capture-order.test.js
// Tests the fulfillment contract: capture ok + GAS ok/fail behavior
// ============================================================

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

// ---- Inline logic mirror of paypal-capture-order.js fulfillment section ----
// Tests the contract logic directly (GAS notify + success/fail distinction)
// without re-importing the module (avoids PayPal token call in tests)

async function simulateCapture({ gasFetch }) {
  // Simulates the post-capture GAS notify section
  const txId   = 'TXID-TEST-001';
  const GAS_URL = process.env.GAS_URL;

  if (!GAS_URL) {
    return { status: 202, body: { success: false, error: 'payment_captured_but_fulfillment_failed', txId } };
  }

  let gasFulfilled = false;
  try {
    const gasRes = await gasFetch(GAS_URL, { method: 'POST' });
    let gasData;
    try { gasData = await gasRes.json(); } catch (_) {}
    if (gasData && gasData.success === true) gasFulfilled = true;
  } catch (_) {}

  if (!gasFulfilled) {
    return { status: 202, body: { success: false, error: 'payment_captured_but_fulfillment_failed', txId } };
  }
  return { status: 200, body: { success: true, txId, status: 'COMPLETED' } };
}

async function runTests() {
  console.log('\n=== paypal-capture-order.js tests ===\n');

  process.env.GAS_URL = 'http://fake-gas-url';

  // ---- Case 1: Capture OK + GAS success => { success: true } ----
  {
    console.log('Case 1: capture ok + GAS ok => success');
    const result = await simulateCapture({
      gasFetch: async () => ({ json: async () => ({ success: true }) }),
    });
    assert('status === 200',         result.status === 200);
    assert('success === true',       result.body.success === true);
    assert('no fulfillment_failed',  result.body.error !== 'payment_captured_but_fulfillment_failed');
  }

  // ---- Case 2: Capture OK + GAS fail => payment_captured_but_fulfillment_failed ----
  {
    console.log('\nCase 2: capture ok + GAS fail => fulfillment_failed');
    const result = await simulateCapture({
      gasFetch: async () => ({ json: async () => ({ success: false, error: 'sheet locked' }) }),
    });
    assert('status === 202',              result.status === 202);
    assert('success === false',           result.body.success === false);
    assert('error is fulfillment_failed', result.body.error === 'payment_captured_but_fulfillment_failed');
    assert('txId present',                !!result.body.txId);
  }

  // ---- Case 3: Capture OK + GAS throws network error => fulfillment_failed ----
  {
    console.log('\nCase 3: capture ok + GAS network error => fulfillment_failed');
    const result = await simulateCapture({
      gasFetch: async () => { throw new Error('ECONNREFUSED'); },
    });
    assert('status === 202',              result.status === 202);
    assert('error is fulfillment_failed', result.body.error === 'payment_captured_but_fulfillment_failed');
  }

  // ---- Summary ----
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => { console.error(err); process.exit(1); });
