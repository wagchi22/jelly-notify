const fs = require('node:fs');
const path = require('node:path');

const CHROMIUM_LOCK_NAMES = new Set([
  'SingletonCookie',
  'SingletonLock',
  'SingletonSocket',
  'lockfile',
]);

function cleanChromiumProfileLocks(profileDirectories = [
  path.resolve(process.cwd(), '.wwebjs_auth'),
  path.resolve(process.cwd(), '.wwebjs_cache'),
]) {
  const removed = [];

  for (const directory of profileDirectories) {
    if (!fs.existsSync(directory)) continue;

    const visit = (currentDirectory) => {
      let entries;
      try {
        entries = fs.readdirSync(currentDirectory, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        const entryPath = path.join(currentDirectory, entry.name);
        if (CHROMIUM_LOCK_NAMES.has(entry.name)) {
          try {
            fs.rmSync(entryPath, { recursive: entry.isDirectory(), force: true });
            removed.push(entryPath);
          } catch {
            // The lock can be recreated while Chromium is starting.
          }
          continue;
        }

        if (entry.isDirectory()) visit(entryPath);
      }
    };

    visit(directory);
  }

  return removed;
}

module.exports = {
  CHROMIUM_LOCK_NAMES,
  cleanChromiumProfileLocks,
};
