const fs = require('node:fs');
const path = require('node:path');

const CHROMIUM_LOCK_PREFIX = 'Singleton';

function isChromiumLock(name) {
  return name.startsWith(CHROMIUM_LOCK_PREFIX);
}

function defaultProfileDirectories(env = process.env) {
  const fromEnv = (env.WA_PROFILE_DIRS || '')
    .split(',')
    .map((dir) => dir.trim())
    .filter(Boolean)
    .map((dir) => path.resolve(dir));

  if (fromEnv.length > 0) return fromEnv;

  return [
    path.resolve(process.cwd(), '.wwebjs_auth'),
    path.resolve(process.cwd(), '.wwebjs_cache'),
  ];
}

function cleanChromiumProfileLocks(profileDirectories = defaultProfileDirectories()) {
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
        if (isChromiumLock(entry.name)) {
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
  CHROMIUM_LOCK_PREFIX,
  isChromiumLock,
  defaultProfileDirectories,
  cleanChromiumProfileLocks,
};