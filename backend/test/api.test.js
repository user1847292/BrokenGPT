const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const net = require('node:net');

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

test('backend health, account, session, CSRF, and encrypted provider-key flows', { timeout: 30000 }, async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'brokengpt-test-'));
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const encryptionKey = require('node:crypto').randomBytes(32).toString('hex');
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'test',
      BROKENGPT_ENCRYPTION_KEY: encryptionKey,
      BROKENGPT_DATA_DIR: dataDir
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let logs = '';
  child.stdout.on('data', chunk => { logs += chunk.toString(); });
  child.stderr.on('data', chunk => { logs += chunk.toString(); });

  async function request(route, options = {}, cookie) {
    const headers = { ...(options.headers || {}) };
    if (cookie) headers.cookie = cookie;
    return fetch(base + route, { ...options, headers });
  }

  async function waitForServer() {
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error('Backend exited early: ' + logs);
      try {
        const response = await fetch(base + '/api/health');
        if (response.ok) return;
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    throw new Error('Backend did not become ready: ' + logs);
  }

  try {
    await waitForServer();
    const health = await request('/api/health');
    assert.equal(health.status, 200);
    assert.equal((await health.json()).ok, true);

    const invalid = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'x', password: 'short' })
    });
    assert.equal(invalid.status, 400);

    const registration = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'test_user', password: 'a-safe-test-password-123' })
    });
    assert.equal(registration.status, 201);
    const registered = await registration.json();
    let cookie = registration.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie, 'registration should set an HttpOnly session cookie');
    assert.ok(registered.csrfToken);

    const duplicate = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'TEST_USER', password: 'a-safe-test-password-123' })
    });
    assert.equal(duplicate.status, 409);

    const missingCsrf = await request('/api/auth/logout', { method: 'POST' }, cookie);
    assert.equal(missingCsrf.status, 403);

    const saveKey = await request('/api/providers/openai/key', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'x-csrf-token': registered.csrfToken },
      body: JSON.stringify({ apiKey: 'test-provider-key-value-12345' })
    }, cookie);
    assert.equal(saveKey.status, 200);

    const providerState = await request('/api/providers', {}, cookie);
    assert.equal(providerState.status, 200);
    assert.equal((await providerState.json()).providers.openai.connected, true);

    const refreshed = await request('/api/auth/me', {}, cookie);
    assert.equal(refreshed.status, 200);
    const refreshedBody = await refreshed.json();

    const deleteKey = await request('/api/providers/openai/key', {
      method: 'DELETE',
      headers: { 'x-csrf-token': refreshedBody.csrfToken }
    }, cookie);
    assert.equal(deleteKey.status, 200);

    const afterDelete = await request('/api/providers', {}, cookie);
    assert.equal((await afterDelete.json()).providers.openai.connected, false);

    const logout = await request('/api/auth/logout', {
      method: 'POST',
      headers: { 'x-csrf-token': refreshedBody.csrfToken }
    }, cookie);
    assert.equal(logout.status, 200);

    const afterLogout = await request('/api/providers', {}, cookie);
    assert.equal(afterLogout.status, 401);

    const login = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'test_user', password: 'a-safe-test-password-123' })
    });
    assert.equal(login.status, 200);
    assert.ok(login.headers.get('set-cookie'));
  } finally {
    child.kill('SIGTERM');
    await new Promise(resolve => {
      if (child.exitCode !== null) return resolve();
      child.once('exit', resolve);
      setTimeout(() => { child.kill('SIGKILL'); resolve(); }, 2500).unref();
    });
    await rm(dataDir, { recursive: true, force: true });
  }
});
