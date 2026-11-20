'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function main() {
  const port = await freePort();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brokengpt-test-'));
  const demoPassword = 'ci-only-demo-password';
  const encryptionKey = crypto.randomBytes(32).toString('hex');
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(port),
      BROKENGPT_DATA_DIR: dataDir,
      BROKENGPT_ENCRYPTION_KEY: encryptionKey,
      BROKENGPT_DEMO_ACCESS_PASSWORD: demoPassword
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let logs = '';
  child.stdout.on('data', chunk => { logs += chunk.toString(); });
  child.stderr.on('data', chunk => { logs += chunk.toString(); });
  const base = 'http://127.0.0.1:' + port;
  const basic = 'Basic ' + Buffer.from('demo:' + demoPassword).toString('base64');
  let cookie = '';
  let csrf = '';

  async function waitUntilReady() {
    for (let i = 0; i < 40; i++) {
      if (child.exitCode !== null) throw new Error('Backend exited early: ' + logs);
      try {
        const response = await fetch(base + '/api/health');
        if (response.ok) return;
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    throw new Error('Backend did not become ready: ' + logs);
  }

  async function request(route, options = {}) {
    const headers = { Authorization: basic, ...(options.headers || {}) };
    if (options.body) headers['Content-Type'] = 'application/json';
    if (cookie) headers.Cookie = cookie;
    if (options.csrf) headers['X-CSRF-Token'] = csrf;
    return fetch(base + route, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  }

  try {
    await waitUntilReady();

    const health = await fetch(base + '/api/health');
    assert.equal(health.status, 200, 'health endpoint should be public for host checks');

    const blocked = await fetch(base + '/');
    assert.equal(blocked.status, 401, 'private demo should block visitors without credentials');

    const page = await fetch(base + '/', { headers: { Authorization: basic } });
    assert.equal(page.status, 200, 'demo credentials should unlock the app page');

    const registered = await request('/api/auth/register', {
      method: 'POST',
      body: { username: 'ci_smoke_user', password: 'safe-test-password-123' }
    });
    assert.equal(registered.status, 201, 'registration should succeed');
    const account = await registered.json();
    assert.equal(account.user.username, 'ci_smoke_user');
    csrf = account.csrfToken;
    cookie = (registered.headers.get('set-cookie') || '').split(';')[0];
    assert.ok(cookie.includes('brokengpt_session='), 'registration should set a session cookie');

    const savedKey = await request('/api/providers/openai/key', {
      method: 'PUT',
      csrf: true,
      body: { apiKey: 'sk-test-brokengpt-placeholder-key' }
    });
    assert.equal(savedKey.status, 200, 'provider key should be accepted and encrypted');

    const providers = await request('/api/providers');
    assert.equal(providers.status, 200);
    const providerData = await providers.json();
    assert.equal(providerData.providers.openai.connected, true, 'saved provider should show as connected');

    const logout = await request('/api/auth/logout', { method: 'POST', csrf: true });
    assert.equal(logout.status, 200, 'logout should succeed');
    cookie = '';

    const login = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'ci_smoke_user', password: 'safe-test-password-123' }
    });
    assert.equal(login.status, 200, 'login should succeed');
    const loginData = await login.json();
    csrf = loginData.csrfToken;
    cookie = (login.headers.get('set-cookie') || '').split(';')[0];

    const me = await request('/api/auth/me');
    assert.equal(me.status, 200, 'logged-in session should be recognized');

    const removedKey = await request('/api/providers/openai/key', { method: 'DELETE', csrf: true });
    assert.equal(removedKey.status, 200, 'provider key should be removable');

    console.log('BrokenGPT smoke tests passed: health, private gate, registration, encrypted provider-key flow, logout, and login.');
  } finally {
    child.kill('SIGTERM');
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
