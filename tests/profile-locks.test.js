const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  cleanChromiumProfileLocks,
  isChromiumLock,
  defaultProfileDirectories,
} = require('../src/profile-locks');

function makeProfile() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'jelly-notify-profile-'));
}

test('removes every entry starting with Singleton without deleting the profile', () => {
  const profile = makeProfile();
  const session = path.join(profile, 'session-default');
  fs.mkdirSync(session);
  fs.writeFileSync(path.join(session, 'SingletonLock'), 'stale');
  fs.writeFileSync(path.join(session, 'SingletonCookie'), 'stale');
  fs.writeFileSync(path.join(session, 'SingletonSocket'), 'stale');
  fs.writeFileSync(path.join(session, 'OtherSingletonFile'), 'keep');
  fs.writeFileSync(path.join(session, 'Credentials'), 'keep');

  const removed = cleanChromiumProfileLocks([profile]);

  assert.equal(removed.length, 3);
  assert.equal(fs.existsSync(path.join(session, 'SingletonLock')), false);
  assert.equal(fs.existsSync(path.join(session, 'SingletonCookie')), false);
  assert.equal(fs.existsSync(path.join(session, 'SingletonSocket')), false);
  assert.equal(fs.readFileSync(path.join(session, 'OtherSingletonFile'), 'utf8'), 'keep');
  assert.equal(fs.readFileSync(path.join(session, 'Credentials'), 'utf8'), 'keep');

  fs.rmSync(profile, { recursive: true, force: true });
});

test('removes broken symlinks and directories starting with Singleton', () => {
  const profile = makeProfile();
  const session = path.join(profile, 'session');
  fs.mkdirSync(path.join(session, 'SingletonDir'), { recursive: true });
  fs.writeFileSync(path.join(session, 'SingletonDir', 'inner'), 'stale');
  fs.symlinkSync('host-123', path.join(session, 'SingletonLock'));
  fs.writeFileSync(path.join(session, 'Keep'), 'keep');

  const removed = cleanChromiumProfileLocks([profile]);

  assert.equal(removed.length, 2);
  assert.equal(fs.existsSync(path.join(session, 'SingletonDir')), false);
  assert.throws(() => fs.lstatSync(path.join(session, 'SingletonLock')));
  assert.equal(fs.readFileSync(path.join(session, 'Keep'), 'utf8'), 'keep');

  fs.rmSync(profile, { recursive: true, force: true });
});

test('ignores directories that do not exist', () => {
  assert.deepEqual(cleanChromiumProfileLocks(['/caminho/inexistente']), []);
});

test('isChromiumLock matches only names starting with Singleton', () => {
  assert.equal(isChromiumLock('SingletonLock'), true);
  assert.equal(isChromiumLock('Singleton'), true);
  assert.equal(isChromiumLock('xSingletonx'), false);
  assert.equal(isChromiumLock('lockfile'), false);
  assert.equal(isChromiumLock('Credentials'), false);
});

test('defaultProfileDirectories uses WA_PROFILE_DIRS when set', () => {
  const dirs = defaultProfileDirectories({ WA_PROFILE_DIRS: '/a, /b' });
  assert.deepEqual(dirs, [path.resolve('/a'), path.resolve('/b')]);
});

test('defaultProfileDirectories falls back to .wwebjs folders', () => {
  const dirs = defaultProfileDirectories({});
  assert.deepEqual(dirs, [
    path.resolve(process.cwd(), '.wwebjs_auth'),
    path.resolve(process.cwd(), '.wwebjs_cache'),
  ]);
});