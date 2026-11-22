const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  cleanChromiumProfileLocks,
} = require('../src/profile-locks');

test('removes Chromium singleton lock files without deleting the profile', () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'jelly-notify-profile-'));
  const session = path.join(profile, 'session-default');
  fs.mkdirSync(session);
  fs.writeSync(fs.openSync(path.join(session, 'SingletonLock'), 'w'), 'stale');
  fs.writeFileSync(path.join(session, 'SingletonCookie'), 'stale');
  fs.writeFileSync(path.join(session, 'SingletonSocket'), 'stale');
  fs.writeFileSync(path.join(session, 'Credentials'), 'keep');

  const removed = cleanChromiumProfileLocks([profile]);

  assert.equal(removed.length, 3);
  assert.equal(fs.existsSync(path.join(session, 'SingletonLock')), false);
  assert.equal(fs.existsSync(path.join(session, 'SingletonCookie')), false);
  assert.equal(fs.existsSync(path.join(session, 'SingletonSocket')), false);
  assert.equal(fs.readFileSync(path.join(session, 'Credentials'), 'utf8'), 'keep');

  fs.rmSync(profile, { recursive: true, force: true });
});
