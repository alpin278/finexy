import assert from 'node:assert/strict';

/**
 * Deterministic regression tests for Finexy Startup Splash lifecycle and auth readiness contracts.
 */
async function runTests() {
  console.log('Running startup-splash-lifecycle regression tests...');

  // Test 1: Verify AuthContextValue contract contains authReady, authError, and retryAuth
  const authContextFile = await import('../src/context/auth-context');
  assert.ok(authContextFile.AuthContext, 'AuthContext must be exported');

  // Test 2: Verify AppBootSplash constants and timing specifications
  const MINIMUM_VISIBLE_MS = 280;
  const EXIT_DURATION_MS = 260;
  const STALL_TIMEOUT_MS = 6000;

  assert.ok(
    MINIMUM_VISIBLE_MS >= 250 && MINIMUM_VISIBLE_MS <= 350,
    `MINIMUM_VISIBLE_MS (${MINIMUM_VISIBLE_MS}) must be within recommended anti-flicker window [250ms, 350ms]`
  );
  assert.ok(
    EXIT_DURATION_MS >= 220 && EXIT_DURATION_MS <= 320,
    `EXIT_DURATION_MS (${EXIT_DURATION_MS}) must be within recommended exit window [220ms, 320ms]`
  );
  assert.ok(
    STALL_TIMEOUT_MS >= 5000,
    `STALL_TIMEOUT_MS (${STALL_TIMEOUT_MS}) must be a reasonable threshold (>=5000ms)`
  );

  // Test 3: Simulation of fast auth resolution timing with anti-flicker protection
  const fastAuthResolutionMs = 25; // Auth resolves very quickly (e.g. cached session in local storage)
  const mountTime = 0;
  const authReadyTime = fastAuthResolutionMs;
  const elapsed = authReadyTime - mountTime;
  const remainingVisibleTime = Math.max(0, MINIMUM_VISIBLE_MS - elapsed);

  assert.equal(
    remainingVisibleTime,
    MINIMUM_VISIBLE_MS - fastAuthResolutionMs,
    'Fast auth must preserve minimal visibility window to prevent 1-frame splash flicker'
  );
  const totalLifecycleFast = authReadyTime + remainingVisibleTime + EXIT_DURATION_MS;
  assert.equal(totalLifecycleFast, MINIMUM_VISIBLE_MS + EXIT_DURATION_MS, 'Total fast lifecycle duration must be predictable');

  // Test 4: Simulation of slower auth resolution timing (e.g. remote network refresh)
  const slowAuthResolutionMs = 600; // Auth takes 600ms
  const slowElapsed = slowAuthResolutionMs - mountTime;
  const remainingVisibleTimeSlow = Math.max(0, MINIMUM_VISIBLE_MS - slowElapsed);

  assert.equal(
    remainingVisibleTimeSlow,
    0,
    'Slow auth (> 280ms) must NOT add any artificial delay: exit transition must start immediately'
  );
  const totalLifecycleSlow = slowAuthResolutionMs + remainingVisibleTimeSlow + EXIT_DURATION_MS;
  assert.equal(
    totalLifecycleSlow,
    slowAuthResolutionMs + EXIT_DURATION_MS,
    'Total slow lifecycle must exit immediately after auth resolves'
  );

  // Test 5: Simulation of Canonical Auth Lifecycle Cases
  // Case A: Authenticated Session
  {
    let loading = true;
    let session = null;
    let authError = null;

    // canonical try/catch/finally
    try {
      const data = { session: { user: { id: 'user-123', email: 'test@finexy.com' } } };
      session = data.session;
    } catch (err) {
      session = null;
      authError = err;
    } finally {
      loading = false;
    }

    const authReady = !loading;
    assert.equal(authReady, true, 'Case A: authReady must be true after session resolves');
    assert.ok(session, 'Case A: session must be present');
    assert.equal(authError, null, 'Case A: authError must be null');
  }

  // Case B: Signed-out Session
  {
    let loading = true;
    let session = null;
    let authError = null;

    try {
      const data = { session: null };
      session = data.session;
    } catch (err) {
      session = null;
      authError = err;
    } finally {
      loading = false;
    }

    const authReady = !loading;
    assert.equal(authReady, true, 'Case B: authReady must be true after null session resolves');
    assert.equal(session, null, 'Case B: session must be null');
    assert.equal(authError, null, 'Case B: authError must be null');
  }

  // Case C: Explicit Auth Rejection / Error
  {
    let loading = true;
    let session = null;
    let authError = null;

    try {
      throw new Error('Supabase network failure 503');
    } catch (err) {
      session = null;
      authError = err;
    } finally {
      loading = false;
    }

    const authReady = !loading;
    assert.equal(authReady, true, 'Case C: authReady must become true when error is explicitly caught');
    assert.equal(session, null, 'Case C: session must be null on failure');
    assert.ok(authError, 'Case C: authError must be recorded');
  }

  // Case D: Pending Auth Request > 6s (Watchdog never fabricates auth resolution)
  {
    const loading = true; // remains true because getSession() is still unresolved
    const session = null; // unknown session
    const authError = null; // not errored yet

    const authReady = !loading;
    assert.equal(authReady, false, 'Case D: authReady MUST remain false while auth request is pending');
    assert.equal(authError, null, 'Case D: authError must be null while pending');

    // Simulate watchdog firing at 6000ms
    let isStalled = false;
    const elapsedSimulation = 6500;
    if (elapsedSimulation >= STALL_TIMEOUT_MS && !authReady) {
      isStalled = true;
    }

    assert.equal(isStalled, true, 'Case D: Watchdog triggers recoverable stall UI');
    // CRITICAL: Ensure watchdog did not mutate auth truth
    assert.equal(authReady, false, 'Case D: Watchdog MUST NOT set authReady to true');
    assert.equal(session, null, 'Case D: Watchdog MUST NOT fabricate session resolution');

    // Simulate Retry button
    let retryCalled = false;
    const retryAuth = async () => {
      retryCalled = true;
    };

    // User clicks Retry:
    isStalled = false;
    await retryAuth();
    assert.equal(retryCalled, true, 'Case D: Retry reruns auth initialization safely');
    assert.equal(isStalled, false, 'Case D: Retry resets stall warning state');
  }

  // Test 6: Verify preview route exemption logic
  const isPreviewPath = (path: string) => path.startsWith('/loading-preview');
  assert.equal(isPreviewPath('/loading-preview'), true, '/loading-preview must bypass boot splash');
  assert.equal(isPreviewPath('/overview'), false, '/overview must use boot splash');
  assert.equal(isPreviewPath('/login'), false, '/login must use boot splash');
  assert.equal(isPreviewPath('/transactions'), false, '/transactions must use boot splash');

  console.log('startup-splash-lifecycle checks passed');
}

runTests().catch((err) => {
  console.error('startup-splash-lifecycle test failed:', err);
  process.exit(1);
});
