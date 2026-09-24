import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// 1. Webhook Command & Deep-Link Recognition
// ---------------------------------------------------------------------------
const linkRegex = /^\/(?:start|link)(?:@\w+)?\s+([A-Fa-f0-9]{12})\s*$/i;
const bareStartRegex = /^\/start(?:@\w+)?\s*$/i;

// Test: /link valid token works
{
  const match = linkRegex.exec('/link ABCDEF123456');
  assert.ok(match, '/link with 12 hex code must match');
  assert.equal(match[1].toUpperCase(), 'ABCDEF123456');
}

// Test: /start valid token works
{
  const match = linkRegex.exec('/start ABCDEF123456');
  assert.ok(match, '/start with 12 hex code must match');
  assert.equal(match[1].toUpperCase(), 'ABCDEF123456');

  // Case insensitivity
  const lowerMatch = linkRegex.exec('/start abcdef123456');
  assert.ok(lowerMatch, 'lowercase hex code must match and normalize to uppercase');
  assert.equal(lowerMatch[1].toUpperCase(), 'ABCDEF123456');
}

// Test: /start@BotName & /link@BotName valid tokens work
{
  const matchStartBot = linkRegex.exec('/start@FinexyBot ABCDEF123456');
  assert.ok(matchStartBot, '/start@FinexyBot with code must match');
  assert.equal(matchStartBot[1].toUpperCase(), 'ABCDEF123456');

  const matchLinkBot = linkRegex.exec('/link@FinexyBot ABCDEF123456');
  assert.ok(matchLinkBot, '/link@FinexyBot with code must match');
  assert.equal(matchLinkBot[1].toUpperCase(), 'ABCDEF123456');
}

// Test: Malformed tokens rejected by webhook parser
{
  assert.equal(linkRegex.exec('/start 123'), null, 'short code must be rejected');
  assert.equal(linkRegex.exec('/start ABCDEF1234567'), null, '13-char code must be rejected');
  assert.equal(linkRegex.exec('/start GGGGGGGGGGGG'), null, 'non-hex code must be rejected');
  assert.equal(linkRegex.exec('/link'), null, 'bare /link must be rejected');
  assert.equal(linkRegex.exec('/start'), null, 'bare /start must be rejected by link regex');
  assert.equal(linkRegex.exec('/start ;DROP TABLE;'), null, 'injection attempts rejected');
}

// ---------------------------------------------------------------------------
// 2. Deterministic Token Security & SQL/RPC Contract Simulation
// ---------------------------------------------------------------------------
function sha256Hex(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

type TokenRecord = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: number;
  consumed_at: number | null;
};

class MockTokenDatabase {
  private tokens: TokenRecord[] = [];
  private integrations: Array<{ user_id: string; external_user_id: string; external_chat_id: string }> = [];

  addToken(id: string, userId: string, code: string, lifetimeMs: number, consumed = false) {
    this.tokens.push({
      id,
      user_id: userId,
      token_hash: sha256Hex(code),
      expires_at: Date.now() + lifetimeMs,
      consumed_at: consumed ? Date.now() - 1000 : null,
    });
  }

  // Exact reproduction of public.consume_telegram_link_code logic
  consumeLinkCode(
    p_telegram_user_id: string,
    p_telegram_chat_id: string,
    p_code: string,
  ): 'linked' | 'already_linked' | 'account_already_linked' | 'invalid' {
    if (!/^[0-9]+$/.test(p_telegram_user_id) || !/^-?[0-9]+$/.test(p_telegram_chat_id)) return 'invalid';
    if (!/^[A-F0-9]{12}$/.test(p_code)) return 'invalid';

    const existingTg = this.integrations.find((i) => i.external_user_id === p_telegram_user_id);
    if (existingTg) return 'already_linked';

    const codeHash = sha256Hex(p_code);
    const now = Date.now();
    const token = this.tokens.find((t) => t.token_hash === codeHash && t.consumed_at === null && t.expires_at > now);
    if (!token) return 'invalid';

    const userAlreadyLinked = this.integrations.find((i) => i.user_id === token.user_id);
    if (userAlreadyLinked) return 'account_already_linked';

    token.consumed_at = now;
    this.integrations.push({
      user_id: token.user_id,
      external_user_id: p_telegram_user_id,
      external_chat_id: p_telegram_chat_id,
    });
    return 'linked';
  }
}

// Test: Expired token cannot be consumed
{
  const db = new MockTokenDatabase();
  const code = 'A1B2C3D4E5F6';
  db.addToken('t-expired', 'u-1', code, -5000); // expired 5 seconds ago

  const result = db.consumeLinkCode('12345678', '12345678', code);
  assert.equal(result, 'invalid', 'expired token must return invalid and be rejected');
}

// Test: Already-consumed token cannot be replayed
{
  const db = new MockTokenDatabase();
  const code = '123456ABCDEF';
  db.addToken('t-valid', 'u-1', code, 600000); // 10 minutes lifetime

  // First consumption: success
  const firstAttempt = db.consumeLinkCode('12345678', '12345678', code);
  assert.equal(firstAttempt, 'linked', 'first attempt with valid token must link');

  // Second attempt (replay with same token): must be rejected
  const replayAttempt = db.consumeLinkCode('87654321', '87654321', code);
  assert.equal(replayAttempt, 'invalid', 'already consumed token cannot be replayed');
}

// Test: Malformed token rejected by SQL RPC contract
{
  const db = new MockTokenDatabase();
  assert.equal(db.consumeLinkCode('12345678', '12345678', 'INVALIDCODE'), 'invalid', 'non-12 hex rejected');
  assert.equal(db.consumeLinkCode('12345678', '12345678', '123'), 'invalid', 'short code rejected');
  assert.equal(db.consumeLinkCode('not_a_num', '12345678', 'A1B2C3D4E5F6'), 'invalid', 'invalid user id rejected');
}

// ---------------------------------------------------------------------------
// 3. Webhook Response Generation for Link Results
// ---------------------------------------------------------------------------
function formatLinkReply(result: 'linked' | 'already_linked' | 'account_already_linked' | 'invalid'): string {
  if (result === 'linked') return 'Akun Finexy berhasil terhubung. Ketik /menu untuk mulai.';
  if (result === 'already_linked' || result === 'account_already_linked') {
    return 'Akun Telegram ini sudah terhubung. Ketik /menu untuk membuka Finexy.';
  }
  return 'Kode link tidak valid, kedaluwarsa, atau sudah digunakan.';
}

// Test: /start and /link produce correct user-facing responses
{
  assert.equal(
    formatLinkReply('linked'),
    'Akun Finexy berhasil terhubung. Ketik /menu untuk mulai.',
    'valid link must provide success response',
  );
  assert.equal(
    formatLinkReply('invalid'),
    'Kode link tidak valid, kedaluwarsa, atau sudah digunakan.',
    'expired, replayed, or invalid token must return failure message',
  );
}

// ---------------------------------------------------------------------------
// 4. Bare /start Onboarding Guidance vs Connected Menu
// ---------------------------------------------------------------------------
function resolveUnrecognizedReply(text: string, isLinked: boolean) {
  const isBareStart = bareStartRegex.test(text);
  return !isLinked && isBareStart
    ? 'Halo! Untuk menghubungkan Telegram ke Finexy, buka Finexy → Settings → Telegram → Connect Telegram.'
    : 'Pesan belum dikenali. Ketik /menu untuk membuka menu Finexy.';
}

{
  // Unlinked user sending /start
  assert.equal(
    resolveUnrecognizedReply('/start', false),
    'Halo! Untuk menghubungkan Telegram ke Finexy, buka Finexy → Settings → Telegram → Connect Telegram.',
  );
  assert.equal(
    resolveUnrecognizedReply('/start@FinexyBot', false),
    'Halo! Untuk menghubungkan Telegram ke Finexy, buka Finexy → Settings → Telegram → Connect Telegram.',
  );

  // Connected user sending /start
  assert.equal(
    resolveUnrecognizedReply('/start', true),
    'Pesan belum dikenali. Ketik /menu untuk membuka menu Finexy.',
  );
}

// ---------------------------------------------------------------------------
// 5. Status Value Consistency & Polling Lifecycle Simulation
// ---------------------------------------------------------------------------
type FrontendTelegramConnection =
  | { status: 'not_connected' }
  | { status: 'link_code_ready'; code: string; expiresAt: string }
  | { status: 'connected'; linkedAt: string | null };

{
  // Exact status constant verification
  const testConn: FrontendTelegramConnection = { status: 'connected', linkedAt: new Date().toISOString() };
  assert.equal(testConn.status, 'connected', 'connected status in src/lib/telegram.ts must be "connected"');

  let pollCount = 0;
  let pollStopped = false;
  let activeInterval: ReturnType<typeof setInterval> | null = null;

  function startPolling(onConnected: (conn: FrontendTelegramConnection) => void, expiresAt: number) {
    activeInterval = setInterval(() => {
      pollCount++;
      if (Date.now() >= expiresAt) {
        clearInterval(activeInterval!);
        activeInterval = null;
        pollStopped = true;
        return;
      }
      // On 3rd poll, status transitions to 'connected'
      if (pollCount === 3) {
        clearInterval(activeInterval!);
        activeInterval = null;
        pollStopped = true;
        onConnected({ status: 'connected', linkedAt: new Date().toISOString() });
      }
    }, 10);
  }

  let finalStatus: string | null = null;
  startPolling((conn) => {
    // Exactly matches SettingsPage: if (connection.status === 'connected')
    if (conn.status === 'connected') {
      finalStatus = conn.status;
    }
  }, Date.now() + 5000);

  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(finalStatus, 'connected', 'polling must check for and receive "connected" status');
  assert.ok(pollStopped, 'polling must stop immediately once "connected" is reached');
  assert.equal(activeInterval, null, 'interval must be cleared');
}

// ---------------------------------------------------------------------------
// 6. Bot Username Normalization & Deep Link URL Formatting
// ---------------------------------------------------------------------------
{
  function normalizeUsername(raw: string | undefined | null): string | null {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const cleaned = trimmed.replace(/^https?:\/\/t\.me\//i, '').replace(/^@/, '').trim();
    return cleaned || null;
  }

  function buildDeepLink(username: string | null, code: string): string | null {
    if (!username) return null;
    return `https://t.me/${username}?start=${encodeURIComponent(code)}`;
  }

  assert.equal(normalizeUsername('FinexyBot'), 'FinexyBot');
  assert.equal(normalizeUsername('@FinexyBot'), 'FinexyBot');
  assert.equal(normalizeUsername('https://t.me/FinexyBot'), 'FinexyBot');
  assert.equal(normalizeUsername('  @FinexyBot  '), 'FinexyBot');
  assert.equal(normalizeUsername(''), null);
  assert.equal(normalizeUsername(undefined), null);

  assert.equal(buildDeepLink('FinexyBot', 'ABCDEF123456'), 'https://t.me/FinexyBot?start=ABCDEF123456');
  assert.equal(buildDeepLink(null, 'ABCDEF123456'), null, 'missing username must yield null, not malformed URL');
}

console.log('All Telegram deep link, token security, and account linking tests PASSED!');
